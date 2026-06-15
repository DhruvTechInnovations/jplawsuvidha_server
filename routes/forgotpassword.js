const express = require('express');
const sgMail = require('@sendgrid/mail');
const pool = require('../db/pg');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

const router = express.Router();

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      status: 'error',
      message: 'Email is required'
    });
  }

  try {
    const result = await pool.query(
      `SELECT id, admin_verified, payment_status,force_change
       FROM user_history
       WHERE email = $1`,
      [email]
    );

    //  Email does not exist
    if (result.rows.length === 0) {
      return res.json({
        status: 'error',
        message: 'User not Found'
      });
    }

    const user = result.rows[0];

    // Admin not verified
    if (!user.admin_verified) {
      return res.json({
        status: 'error',
        message: 'Account not Verified by Admin'
      });
    }

    //Payment pending
    if (user.payment_status !== 'successful') {
      return res.json({
        status: 'error',
        message: 'Payment Pending'
      });
    }
    // intial password not set
    if (user.force_change == true) {
      return res.json({
        status: 'error',
        message: 'First time Password not set'
      });
    }

    // 4️⃣ Generate secure token
    const token = crypto.randomBytes(32).toString('hex');

    // 5️⃣ Hash token before storing
    const tokenHash = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await pool.query(
      `UPDATE user_history
       SET password_setup_token = $1,
           password_setup_expires = $2
       WHERE id = $3`,
      [tokenHash, expires, user.id]
    );

    const resetLink =
      `https://jplawsuvidha.com/reset-password?token=${token}`;

    await sgMail.send({
      to: email,
      from: process.env.MAIL_FROM,
      subject: 'Reset Your Password',
      html: `
        <p>You requested a password reset.</p>
        <p>This link is valid for 1 hour.</p>
        <a href="${resetLink}"
           style="display:inline-block;padding:10px 20px;background:#000;color:#fff;text-decoration:none;border-radius:5px;">
          Reset Password
        </a>
        <p>If you didn’t request this, ignore this email.</p>
      `
    });

    return res.json({
      status: 'success',
      message: 'Password reset link sent'
    });

  } catch (err) {
    console.error('Forgot password error:', err);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to send reset link'
    });
  }
});


// ----------------------
// RESET PASSWORD
// ----------------------
router.post('/reset-password', async (req, res) => {
  const { token, password } = req.body;
   console.log('inside reset passworkd',req.body)
  if (!token || !password) {
    return res.status(400).json({
      status: 'error',
      message: 'Token and password are required'
    });
  }

  const tokenHash = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const userResult = await client.query(
      `SELECT email
       FROM user_history
       WHERE password_setup_token = $1
         AND password_setup_expires > NOW()`,
      [tokenHash]
    );

    if (userResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        status: 'error',
        message: 'Invalid or expired token'
      });
    }

    const { email } = userResult.rows[0];

    const hashedPassword = await bcrypt.hash(password, 10);

    // Upsert password
    await client.query(
      `INSERT INTO AdvocateLogin (email, password)
       VALUES ($1, $2)
       ON CONFLICT (email)
       DO UPDATE SET password = $2`,
      [email, hashedPassword]
    );

    // Clear token after use
    await client.query(
      `UPDATE user_history
      SET  password_setup_token = NULL,
           password_setup_expires = NULL
       WHERE email = $1`,
      [email]
    );

    await client.query('COMMIT');

    return res.json({
      status: 'success',
      message: 'Password reset successfully'
    });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Reset password error:', err);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to reset password'
    });
  } finally {
    client.release();
  }
});

module.exports = router;

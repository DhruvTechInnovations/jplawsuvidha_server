const express = require('express');
const adminRouter = express.Router();
const pool = require('../db/pg');
const jwt = require('jsonwebtoken');
const verifyAdminToken=require('../middleware/verifyAdminToken')

const ADMIN_LEAD_EMAIL = 'hanumanreddyy@gmail.com'; // replace with your email
const ADMIN_PASSWORD = 'JPLAWSUVIDHADMIN007TRICKYVERYPASSWORD';
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey'; // store in env for prod

// Token validity: 30 minutes
const TOKEN_EXPIRY = '30m';


adminRouter.post('/adminLogin', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(401).json({ status: 'error', message: 'unauthorized' });
        }

        if (email !== ADMIN_LEAD_EMAIL || password !== ADMIN_PASSWORD) {
            return res.status(401).json({ status: 'error', message: 'unauthorized' });
        }

        // Generate JWT token
        const token = jwt.sign({ email }, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });

        // Set token in HTTP-only cookie
        res.cookie('accessToken', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 30 * 60 * 1000, // 30 mins
            sameSite: 'strict',
        });

        return res.status(200).json({
            status: 'success',
            message: 'Login successful'
        });

    } catch (err) {
        console.error('Admin login error:', err);
        return res.status(500).json({ status: 'error', message: 'internal server error' });
    }
});


// get users route
adminRouter.get('/users', verifyAdminToken, async (req, res) => {
    try {
        const leads = await pool.query(`
            SELECT lawyername, admin_verified, payment_status 
            FROM user_history
        `);

        return res.status(200).json({
            status: 'success',
            message: 'Leads fetched successfully',
            leads: leads.rows
        });

    } catch (err) {
        console.error('Fetch users error:', err);
        return res.status(500).json({ status: 'error', message: 'internal server error' });
    }
});


// approve details route
adminRouter.patch(
  '/approve-details',

  async (req, res) => {
    try {
        console.log('inside approve details')
      const { lawyername, admin_verified } = req.body;

      if (!lawyername || typeof admin_verified !== 'boolean') {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid payload'
        });
      }

      const result = await pool.query(
        `
        UPDATE user_history
        SET admin_verified = $1
        WHERE lawyername = $2
        RETURNING id, lawyername, admin_verified
        `,
        [admin_verified, lawyername]
      );

      if (result.rowCount === 0) {
        return res.status(404).json({
          status: 'error',
          message: 'User not found'
        });
      }

      return res.status(200).json({
        status: 'success',
        message: 'Admin verification updated',
        data: result.rows[0]
      });

    } catch (err) {
      console.error('approve-details error:', err);
      return res.status(500).json({
        status: 'error',
        message: 'Internal server error'
      });
    }
  }
);


// approve payment and insert in to subscription history
adminRouter.put(
  '/approve-payment',
  verifyAdminToken,
  async (req, res) => {
    const client = await pool.connect();

    try {
      const { userId, payment_status } = req.body;

      const allowedStatuses = ['successful', 'pending'];

      if (!userId || !allowedStatuses.includes(payment_status)) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid payment status'
        });
      }

      await client.query('BEGIN');

      const paymentResult = await client.query(
        `
        UPDATE user_history
        SET payment_status = $1
        WHERE id = $2
        RETURNING id, lawyername
        `,
        [payment_status, userId]
      );

      if (paymentResult.rowCount === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({
          status: 'error',
          message: 'User not found'
        });
      }

      if (payment_status === 'PAID') {
        const activatedAt = new Date();
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30); 

       
        const planId = Math.floor(Math.random() * 3) + 1; 
        const historyId = Date.now(); 

        await client.query(
          `
          INSERT INTO subscription_history (
            activated_at,
            adv_id,
            plan_id,
            history_id,
            expires_at,
            subscription_state
          )
          VALUES ($1, $2, $3, $4, $5, $6)
          `,
          [
            activatedAt,
            userId,         
            planId,
            historyId,
            expiresAt,
            'ACTIVE'
          ]
        );
      }

      await client.query('COMMIT');

      return res.status(200).json({
        status: 'success',
        message: 'Payment approved and subscription activated',
        data: {
          userId,
          payment_status
        }
      });

    } catch (err) {
      await client.query('ROLLBACK');
      console.error('approve-payment error:', err);
      return res.status(500).json({
        status: 'error',
        message: 'Internal server error'
      });
    } finally {
      client.release();
    }
  }
);


module.exports = adminRouter;

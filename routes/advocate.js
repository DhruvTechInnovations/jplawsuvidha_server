const express = require('express')
const login_router = express.Router()
const pool = require('../db/pg')
const bcrpt = require('bcrypt')
const crypto = require('crypto');
const {LoginMiddleware} = require('../middleware/LoginMiddleware')
const jwt = require('jsonwebtoken');
// const { sendAdminCaseNotification } = require('../controllers/mail');
const { sendAdminAdvocateRegistrationNotification } = require('../controllers/advocateregister');
// const { encryptPhone,decryptPhone } = require('../utils/crypto');
const fetchUser=require('../helper/login/fetchUser')
const validateAccountStatus=require('../helper/login/validateAccountStatus')
const handleFirstTimeLogin=require('../helper/login/handleFirstTimeLogin')
const handleNormalLogin =require('../helper/login/handleNormalLogin')




// advocate register/ subscription route 
login_router.post('/register', async (req, res) => {
  // console.log('inside register')
  const client = await pool.connect();
  const saltrounds = 10
  const data=req.body.formData
  console.log('register data',data)
  const { lawyerName, barCouncilId, email, practiceAreas, experience, firm, phone, regions, plan,annual} = req.body.formData
  console.log('bar council id from req ',barCouncilId)
    const hashphone = await bcrpt.hash(phone, saltrounds)
  const phoneLookup = crypto
  .createHmac('sha256', process.env.PHONE_LOOKUP_SECRET)
  .update(phone)
  .digest('hex');
  const tempPassword = barCouncilId; // 16-char temp password
  const hashedTempPassword = await bcrpt.hash(tempPassword, 10);
  const normalizedBarCouncilId = barCouncilId?.toLowerCase();

  try {
    await client.query('BEGIN');
    const conflict = await client.query(
      `SELECT 1 FROM user_history
   WHERE email = $1 OR phone_lookup = $2`,
      [email, phoneLookup]
    );


    if (conflict.rows.length > 0) {

      return res.status(409).json({
        status: 'conflict',
        message: 'Email or phone already registered',
      });
    }
    const result = await client.query(
      `INSERT INTO user_history 
            (lawyername, barcouncilid, phone,phone_lookup, email, practiceareas, experience, firm,force_change,regions,plan,temp_password_hash,billing_cycle) 
           VALUES ($1, $2, $3, $4, $5, $6, $7,$8,$9,$10,$11,$12,$13) 
           RETURNING *`,
      [lawyerName, normalizedBarCouncilId, hashphone, phoneLookup, email, practiceAreas, experience, firm, true, regions, plan,tempPassword,annual]
    );
    console.log(result)


// console.log('register insert done ')
// console.log('result of advoate register',result.rows[0])

    // const result2=await client.query(
    //   `INSERT INTO user_encrypted (email,phone_encrypted,phone_iv,phone_auth_tag) VALUES($1,$2,$3,$4) RETURNING *`,
    //   [result.rows[0].email,encryptedPhone.phone_encrypted,encryptedPhone.phone_iv,encryptedPhone.phone_auth_tag]
    // )
    // console.log('before commit')
    await client.query('COMMIT');

    // const planInfo=await pool.query(
    //   `SELECT p_name,p_price from packages where p_name=$1 `,[result.rows[0].plan]
    // )   LATER STAGE FOR SUBSCRIPTION AND LEAD ASSIGNMENT
    // const { p_name, p_price } = planInfo.rows[0];
// const decryptedPhone = decryptPhone(
//   encryptedPhone.phone_encrypted,
//   encryptedPhone.phone_iv,
//   encryptedPhone.phone_auth_tag
// );

res.status(201).json({
  message: 'Advocate registered successfully',
});
   sendAdminAdvocateRegistrationNotification({
  name: lawyerName,
  email,
  phone,
  barCouncilId:result.rows[0].barcouncilid,
  practiceareas: result.rows[0].practiceareas,
  experience: result.rows[0].experience,
  regions: result.rows[0].regions,
  plan: result.rows[0].plan,
  billingcycle:result.rows[0].billing_cycle
}).catch(err => {
  console.error('Admin mail failed:', err.message);
});

 
    // console.log('after mail sent')
  } catch (err) {
  await client.query('ROLLBACK');

  if (err.code === '23505') {
    return res.status(409).json({
      status: 'conflict',
      message: 'Email or phone already registered',
    });
  }

  console.error('Register error:', err);
  res.status(500).json({
    message: 'Something went wrong while registering advocate',
  });
}
  finally {
  client.release();
}
})


login_router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await fetchUser(email);

    validateAccountStatus(user);

    if (user.force_change) {
      return handleFirstTimeLogin(email, password, res);
    }

    await handleNormalLogin(email, password, res);

  } catch (err) {
    console.error('Login error:', err.message);
    return res.status(err.status || 500).json({
      status: 'error',
      message: err.message || 'Login failed',
    });
  }
});


login_router.post('/set-password', async (req, res) => {
  const { token, password } = req.body;
// console.log('inside set-password')
  const client = await pool.connect();
  const hashPassword = await bcrpt.hash(password, 10);

  try {
    await client.query('BEGIN');

    const reg = await client.query(
      `SELECT email, force_change, password_setup_expires FROM user_history WHERE password_setup_token=$1`,
      [token]
    );

    if (reg.rows.length === 0) {
      return res.status(404).json({ message: 'Invalid token' });
    }

    const user = reg.rows[0];

    if (!user.force_change) {
      return res.status(403).json({ message: 'Password already set' });
    }

    if (new Date(user.password_setup_expires) < new Date()) {
      return res.status(400).json({ message: 'Token expired' });
    }

    await client.query(
      `INSERT INTO AdvocateLogin (email, password)
       VALUES ($1, $2)
       ON CONFLICT (email) DO UPDATE SET password=$2`,
      [user.email, hashPassword]
    );

    await client.query(
      `UPDATE user_history 
       SET force_change=false,
           temp_password_hash=NULL,
           password_setup_token=NULL,
           password_setup_expires=NULL
       WHERE email=$1`,
      [user.email]
    );

    await client.query('COMMIT');
    res.json({ status: 'success', message: 'Password set successfully' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Set-password error:', err);
    res.status(500).json({ status: 'error', message: 'Failed to set password' });
  } finally {
    client.release();
  }
});


login_router.post('/logout', (req, res) => {
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  }); 
  res.json({ success: true });
});

module.exports = login_router

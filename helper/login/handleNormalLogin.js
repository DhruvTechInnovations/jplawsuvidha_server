require('dotenv').config()
const pool = require('../../db/pg')
const bcrpt = require('bcrypt')
const jwt = require('jsonwebtoken');

function generateTokens(payload) {
  const token = jwt.sign(payload, process.env.ACCESS_JWT_SECRET, {
    expiresIn: '15m',
  });

  const refreshToken = jwt.sign(
    payload,
    process.env.REFRESH_JWT_SECRET,
    { expiresIn: '7d' }
  );

  return { token, refreshToken };
}

async function handleNormalLogin(email, password, res) {
  const loginResult = await pool.query(
    `SELECT password FROM AdvocateLogin WHERE email=$1`,
    [email]
  );

  if (loginResult.rows.length === 0) {
    const err = new Error('Invalid credentails');
    err.status = 403;
    throw err;
  }

  const isMatch = await bcrpt.compare(
    password,
    loginResult.rows[0].password
  );

  if (!isMatch) {
    const err = new Error('Invalid credentials');
    err.status = 401;
    throw err;
  }

  const { token, refreshToken } = generateTokens({
    email,
    role: 'advocate',
    isAdmin:email === process.env.ADMIN_LEAD_EMAIL

  });

  return res
    .cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge:  10 * 60 * 1000,
    })
    .status(200)
    .json({
      status: 'success',
      token,
    });
}
module.exports=handleNormalLogin
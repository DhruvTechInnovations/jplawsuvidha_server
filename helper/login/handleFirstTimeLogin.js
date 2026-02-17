const pool = require('../../db/pg')
const bcrpt = require('bcrypt')
const crypto = require('crypto');


async function handleFirstTimeLogin(email, password, res) {
  const tokenData = await pool.query(
    `SELECT password_setup_token, password_setup_expires,temp_password_hash
     FROM user_history
     WHERE email=$1`,
    [email]
  );

  let token = tokenData.rows[0]?.password_setup_token;
  let expires = tokenData.rows[0]?.password_setup_expires;
  let valid=tokenData.rows[0]?.temp_password_hash === password
  if(!valid)
  {
    return res.status(403).json({status:'incorrect password',message:"password is incorrect"})
  }
  if (!token || new Date(expires) < new Date()) {
    token = crypto.randomBytes(32).toString('hex');
    expires = new Date(Date.now() + 48 * 60 * 60 * 1000);

    await pool.query(
      `UPDATE user_history
       SET password_setup_token=$1, password_setup_expires=$2
       WHERE email=$3`,
      [token, expires, email]
    );
  }

  return res.status(200).json({
    status: 'first_time',
    message: 'Set your password',
    token:token,
  });
}
module.exports=handleFirstTimeLogin
const pool = require('../../db/pg')
const bcrpt = require('bcrypt')

async function fetchUser(email) {
  console.log('req from mobile',email)
  const result = await pool.query(
    `SELECT email, force_change, admin_verified, payment_status
     FROM user_history
     WHERE email=$1`,
    [email]
  );

  if (result.rows.length === 0) {
    const err = new Error('User not registered');
    err.status = 404;
    throw err;
  }

  return result.rows[0];
}
module.exports=fetchUser

const express=require('express')
const pool=require('../db/pg')
const mrouter=express.Router()

// login for mobile
mrouter.post('/mobile-login', async (req, res) => {
  const { email } = req.body;
  try {
    console.log("email", email);
    const result = await pool.query("INSERT INTO mobile(email) VALUES($1)", [email]);
    res.status(200).json({ message: 'login successful', res: result });
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ message: 'Database connection failed' });
  }
});

module.exports=mrouter
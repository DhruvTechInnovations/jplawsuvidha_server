const express=require('express')
const jwt = require('jsonwebtoken');

const validate_router=express.Router()
const {verifyRefreshToken}=require('../middleware/verifyToken')
validate_router.get('/validate',verifyRefreshToken,async(req,res)=>{
  // console.log('validate hit')
   try {
    const accessToken = jwt.sign(
      { email: req.user.email, role: req.user.role, isAdmin : req.user.email === process.env.ADMIN_LEAD_EMAIL },
      process.env.ACCESS_JWT_SECRET,
      { expiresIn: '15m' }
    );
  //  console.log(accessToken)
    res.status(200).json({
      status: 'success',
      token: accessToken,
    });
  } catch (err) {
    // console.error('Validate-login error:', err);
    res.status(500).json({ status: 'error', message: 'Failed to validate login' });
  }
})
module.exports=validate_router
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
    console.log('successful')
    res.status(200).json({
      status: 'success',
      token: accessToken,
    });
  } catch (err) {
    // console.error('Validate-login error:', err);
    res.status(500).json({ status: 'error', message: 'Failed to validate login' });
  }
})
validate_router.post('/mobile/refresh', async (req, res) => {
  console.log('mobile/refresh')
  const { refreshToken } = req.body;

  try {
    const decoded = jwt.verify(
      refreshToken,
      process.env.REFRESH_JWT_SECRET
    );

    const newAccessToken = jwt.sign(
      {
        email: decoded.email,
        role: decoded.role,
        isAdmin: decoded.isAdmin
      },
      process.env.ACCESS_JWT_SECRET,
      { expiresIn: '15m' }
    );

    res.json({ token: newAccessToken });

  } catch (err) {
    return res.status(401).json({
      message: 'Invalid refresh token',
    });
  }
});
module.exports=validate_router
const jwt = require('jsonwebtoken');

function verifyRefreshToken(req, res, next) {
  console.log('validate middleware hit')
  const token = req.cookies.refreshToken;
  if (!token) {
    return res.status(401).json({ authenticated: false });
  }

  try {
    const payload = jwt.verify(token, process.env.REFRESH_JWT_SECRET);
    req.user = payload; // attach user info
    next();
  } catch (err) {
    return res.status(403).json({ status: 'error', message: 'Invalid or expired refresh token' });
  }
}

module.exports={verifyRefreshToken}
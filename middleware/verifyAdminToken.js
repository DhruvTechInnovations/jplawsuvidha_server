const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

function verifyAdminToken(req, res, next) {
    const token = req.cookies.accessToken;

    if (!token) {
        return res.status(401).json({ status: 'error', message: 'unauthorized' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded; // attach user info
        next();
    } catch (err) {
        return res.status(401).json({ status: 'error', message: 'invalid or expired token' });
    }
}

module.exports = verifyAdminToken;

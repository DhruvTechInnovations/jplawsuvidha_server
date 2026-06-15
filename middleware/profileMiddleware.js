const jwt = require("jsonwebtoken");

function profileMiddleware(req, res, next) {
  console.log('check p12')
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Missing access token" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload = jwt.verify(token, process.env.ACCESS_JWT_SECRET);

    // Attach payload to request (very important)
    req.user = payload;
      console.log('inside profile middleware',payload)


    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

module.exports=profileMiddleware

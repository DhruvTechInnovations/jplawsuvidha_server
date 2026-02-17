const LoginMiddleware = (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      status: 'error',
      message: 'Email is required',
    });
  }

  next();
};
module.exports={LoginMiddleware}
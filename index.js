const express = require('express')
require('dotenv').config();
const app = express()
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser');
const { google } = require('googleapis')
const LoginMiddleware = require('./middleware/LoginMiddleware')
const verification = require('./middleware/Verification')
const advocate = require('./routes/advocate')
const validate = require('./routes/authentication')
const tawk = require('./routes/tawk')
const croute = require('./routes/calendar')
const pool = require('./db/pg')
const payment_router = require('./routes/payment')
const cors = require('cors');
const mrouter = require('./routes/mobileLogin');
const caseRouter = require('./routes/contact_us');
const decaprouter = require('./routes/decap');
const profile_router=require('./routes/advocate_profile')
const router=require('./routes/forgotpassword')
const leadRouter=require('./routes/leads')
const adminRouter=require('./routes/admin');
const subRouter = require('./routes/subscription');
const activityRouter = require('./routes/leadActivity');
const allowedOrigins = [process.env.FRONTEND_URL,"http://localhost:3000",process.env.FRONTEND_URL_2];
const port = 3001;
const rate_limiter=require('express-rate-limit')
app.use(cookieParser());
if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

app.use(cors({
  origin: allowedOrigins,
  credentials: true,              
}));

app.use(bodyParser.json({
  type: 'application/json',
  verify: (req, res, buf) => {
    req.rawBody = buf.toString(); 
  }
}));

// basic api for testing
app.get('/api/', (req, res) => {
  res.json({ message: 'welcome to JP law suvidha', status: 200 })
})

app.use('/api', advocate)
app.use('/api', tawk)
app.use('/api', validate)
app.use('/api', croute)
app.use('/api', mrouter)
app.use('/api', payment_router)
app.use('/api', caseRouter)
app.use('/api/decap', decaprouter);
app.use('/api',profile_router)
app.use('/api',router)
app.use('/api',leadRouter)
app.use('/api',adminRouter) // for admin application built dont consider for production.
app.use('/api',subRouter)
app.use('/api',activityRouter)

// global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// server starting
app.listen(port, () => {
  console.log(`OAuth server running on http://localhost:`)
})
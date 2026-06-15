const express=require('express')
const fcm_router=express.Router()
const admin = require("firebase-admin");
const profileMiddleware = require('../middleware/profileMiddleware');
const pool=require('../db/pg')

// const serviceAccount = require("../helper/login/android-app-133e2-firebase-adminsdk-fbsvc-f5716c3a54.json");

admin.initializeApp({
  credential: admin.credential.cert({
    projectId:process.env.FIREBASE_PROJECT_ID,
    clientEmail:process.env.FIREBASE_CLIENT_EMAIL,
    privateKey:process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
  })
});

fcm_router.get('/',(req,res)=>{
    alert('FCM is working')
})

fcm_router.post('/fcm-token',profileMiddleware,async (req,res)=>{
  console.log('inside fcm')
  const { token } = req.body;
  const user=req.user
  console.log(req.user)

  if (!token) {
    return res.status(400).json({ message: 'Token required' });
  }
   console.log('fcm token',req.body)
   try
   {

    await pool.query(`INSERT INTO fcp_tokens(fcp_token,user_details) values($1,$2)`,[token,user.email])
    console.log('fcm_token stored successfully')
    res.json({ message: 'Token stored' });
   }catch(err)
   {
       console.log(err)
       res.status(500).json({ message: 'fcm_token storage failed' });
   }
  
})


async function test() {
    try {
      const response = await admin.messaging().send({
      token:'cLKZrqDDQvmPl39a7o-Gst:APA91bEnDSwHzDdvpZWMQ_dI-PLFmB4KL_orOXFuqr3Jm-pxuJbWVselTJSGRyoAXdUuI6jRdXKF_sFhy6gHsSgW5lj2ROgrIr4vLk2YMEo6vLqpVFI8qj8',
    notification: {
          title: 'Test',
          body: 'Firebase Admin working 🚀',
        },
      });
  
      console.log('Success:', response);
    } catch (err) {
      console.error('Error:', err);
    }
  }
test()
module.exports=fcm_router
const express=require('express')
const notification_router=express.Router()
const notificationController=require('../controllers/notificationController')
notification_router.get('/notifications',(req,res)=>{
    res.send("notification service working success")
})

notification_router.post('/onesignalId',notificationController)

module.exports={notification_router}
const express=require('express')
const activityRouter=express.Router()
const profileMiddleware=require('../middleware/profileMiddleware')
const{addLeadActivity}=require('../controllers/leadActivityController')
const {getLeadActivities}=require('../controllers/leadActivityController')

activityRouter.post(
  "/leads/:leadId/activity",
  profileMiddleware,        
  addLeadActivity
);
activityRouter.get(
    "/leads/:leadId/activity",
    profileMiddleware,
    getLeadActivities
  );
module.exports=activityRouter

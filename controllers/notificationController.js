const pool=require('../db/pg')
const notificationController =async (req,res)=>{
    console.log('from notification controller')
    try {
        console.log("chceck 1")
        const { onesignal_id } = req.body;
    
        if (!onesignal_id) {
          return res.status(400).json({
            success: false,
            message: 'OneSignal ID is required',
          });
        }
    
        // user id comes from JWT middleware
        const email = req.body.email
    
        await pool.query(
            `
            INSERT INTO user_notification_devices
            (email, onesignal_id)
            VALUES ($1, $2)
            `,
            [email, onesignal_id]
          );
      
    
        return res.status(200).json({
          success: true,
          message: 'OneSignal ID saved successfully',
        });
      } catch (error) {
        console.error(error);
    
        return res.status(500).json({
          success: false,
          message: 'Internal server error',
        });
      }
}
module.exports=notificationController
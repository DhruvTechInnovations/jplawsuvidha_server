const express=require('express')
const pool=require('../db/pg')
const profileMiddleware = require('../middleware/profileMiddleware')
const subRouter=express.Router()
subRouter.get('/subscriptiondetails',profileMiddleware,async (req,res)=>{
        const { email } = req.user;
        console.log('from subscription',email)
      
        try {
          const query = `
            SELECT sh.*,u.regions
            FROM subscription_history sh
            JOIN user_history u ON u.id = sh.adv_id
            WHERE u.email = $1
            ORDER BY sh.subscription_start_date DESC
          `;
      
          const { rows } = await pool.query(query, [email]);
          console.log('subscription data',rows)
      
          res.status(200).json({
            success: true,
            data: rows
          });
        } catch (err) {
          console.error(err);
          res.status(500).json({
            success: false,
            message: 'Server error'
          });
        }
    
})
module.exports=subRouter
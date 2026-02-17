const express=require('express')
const pool=require('../db/pg')
const payment_router=express.Router()
payment_router.get('/orders/:qOrderId', async (req, res) => {
  try {
    const plan = req.params.qOrderId;
    console.log('plan in payment route',plan)

    // Query to get price for the plan
    const result = await pool.query(
      `SELECT p_price FROM packages WHERE p_name = $1`,
      [plan]
    );

    if (result.rows.length > 0) {
      // ✅ Plan found
        const plan = result.rows[0].p_name;
      const price = result.rows[0].p_price;
      res.status(200).json({
        success: true,
        data: { plan,price },
      });
    } else {
      // ❌ Plan not found
      res.status(404).json({
        success: false,
        message: `Plan '${plan}' not found.`,
      });
    }

  } catch (error) {
    console.error('Error fetching price:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching plan price.',
    });
  }
});
module.exports=payment_router
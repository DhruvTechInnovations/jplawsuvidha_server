const express = require("express");
const crypto = require("crypto");
const Razorpay = require("razorpay");
const profileMiddleware = require("../middleware/profileMiddleware");

const ra_router = express.Router();



const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/*
Dummy DB example
Replace this with your actual database
*/
const products = {
  prod_101: {
    id: "prod_101",
    name: "Premium Subscription",
    price: 999, // in INR
  },
  prod_102: {
    id: "prod_102",
    name: "Pro Membership",
    price: 1499,
  },
};

/*
GET Route
*/
ra_router.get("/payment", (req, res) => {
  res.send("Payment API Working");
});

/*
STEP 1:
Create Razorpay Order

Frontend sends:
{
  "product_id": "prod_101"
}
*/
ra_router.post("/create-payment-order",profileMiddleware, async (req, res) => {
    console.log('in create order')
  try {
    const { planId:product_id } = req.body;
    console.log('cp1',req.body)

    if (!product_id) {
      return res.status(400).json({
        success: false,
        message: "product_id is required",
      });
    }

    /*
    Fetch product from DB
    */
    const product = products[product_id];

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    /*
    Convert INR → Paise
    Razorpay works in smallest currency unit
    */
    const amountInPaise = product.price * 100;

    /*
    Create Razorpay Order
    */
    const options = {
      amount: amountInPaise,
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
      payment_capture: 1,
      notes: {
        product_id: product.id,
        product_name: product.name,
      },
    };

    const order = await razorpay.orders.create(options);

    console.log('order is',order)

    console.log('last check point')
    console.log('razorpaykey',process.env.RAZORPAY_KEY_ID)

    return res.status(200).json({
      success: true,
      message: "Order created successfully",
      data: {
        order_id: order.id,
        amount: order.amount,
        currency: order.currency,
        product_name: product.name,
        razorpay_key: process.env.RAZORPAY_KEY_ID,
      },
    });
  } catch (error) {
    console.error("Create Order Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create payment order",
      error: error.message,
    });
  }
});

/*
STEP 2:
Verify Payment Signature

Frontend sends after payment success:

{
  "razorpay_order_id": "",
  "razorpay_payment_id": "",
  "razorpay_signature": ""
}
*/
ra_router.post("/payment-verify", async (req, res) => {
    console.log('inside payment-verify')
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;
   console.log('in payment-verify',req.body)
    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing payment verification fields",
      });
    }

    /*
    Generate signature manually
    */
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    /*
    Compare signatures
    */
    const isAuthentic =
      expectedSignature === razorpay_signature;

    if (!isAuthentic) {
      return res.status(400).json({
        success: false,
        message: "Payment verification failed",
      });
    }

    /*
    Payment is verified

    Here:
    - update DB
    - activate subscription
    - mark order paid
    - generate invoice
    */

    return res.status(200).json({
      success: true,
      message: "Payment verified successfully",
      data: {
        payment_id: razorpay_payment_id,
        order_id: razorpay_order_id,
      },
    });
  } catch (error) {
    console.error("Verify Payment Error:", error);

    return res.status(500).json({
      success: false,
      message: "Payment verification failed",
      error: error.message,
    });
  }
});

/*
STEP 3:
Webhook (Recommended for Production)

Set this in Razorpay Dashboard
*/
ra_router.post("/payment-webhook", (req, res) => {
  try {
    console.log("Webhook Event:", req.body);

    /*
    Example events:
    - payment.captured
    - payment.failed
    - refund.processed

    Handle production events here
    */

    return res.status(200).json({
      success: true,
      message: "Webhook received",
    });
  } catch (error) {
    console.error("Webhook Error:", error);

    return res.status(500).json({
      success: false,
      message: "Webhook failed",
    });
  }
});


ra_router.post('/razorpay-webhook',(req,res)=>{
  console.log('this is from razorpay-webhook',req.body.event)
})

module.exports = ra_router;
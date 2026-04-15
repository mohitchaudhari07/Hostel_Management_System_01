const express = require("express");
const router = express.Router();
const paymentGatewayController = require("../controllers/paymentGatewayController");
const { authenticate } = require("../middleware/auth");

// Razorpay endpoints
router.post("/razorpay/create-order", authenticate, paymentGatewayController.createRazorpayOrder);
router.post("/razorpay/verify", authenticate, paymentGatewayController.verifyRazorpayPayment);

// Stripe endpoints
router.post("/stripe/create-intent", authenticate, paymentGatewayController.createStripePaymentIntent);
router.post("/stripe/verify", authenticate, paymentGatewayController.verifyStripePayment);

// PayPal endpoints
router.post("/paypal/create", authenticate, paymentGatewayController.createPayPalPayment);

// Webhooks (no authentication needed)
router.post("/webhook", paymentGatewayController.handlePaymentWebhook);

// Get payment status
router.get("/status/:messPaymentId", authenticate, paymentGatewayController.getPaymentStatus);

module.exports = router;

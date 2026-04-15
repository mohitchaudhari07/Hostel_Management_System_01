const MessPayment = require("../models/MessPayment");
const MessTransaction = require("../models/MessTransaction");

// Razorpay Payment  Integration (for future implementation)
// npm install razorpay

/**
 * Create Razorpay Order for student payment
 * This creates an order on Razorpay that the student can pay
 */
const createRazorpayOrder = async (req, res) => {
  try {
    const { messPaymentId, amount } = req.body;

    // Validate payment exists
    const payment = await MessPayment.findById(messPaymentId);
    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    // TODO: Initialize Razorpay
    // const Razorpay = require("razorpay");
    // const razorpay = new Razorpay({
    //   key_id: process.env.RAZORPAY_KEY_ID,
    //   key_secret: process.env.RAZORPAY_KEY_SECRET
    // });

    // // Create order
    // const order = await razorpay.orders.create({
    //   amount: amount * 100, // Convert to paise
    //   currency: "INR",
    //   receipt: `receipt_${messPaymentId}`,
    //   notes: {
    //     messPaymentId,
    //     studentId: payment.studentId
    //   }
    // });

    res.json({
      message: "Order created successfully",
      orderId: "order_placeholder", // order.id,
      amount,
      keyId: process.env.RAZORPAY_KEY_ID || "rzp_placeholder"
    });
  } catch (error) {
    console.error("Error creating Razorpay order:", error);
    res.status(500).json({ message: "Error creating order", error: error.message });
  }
};

/**
 * Verify Razorpay Payment
 * Called after successful payment on frontend
 */
const verifyRazorpayPayment = async (req, res) => {
  try {
    const {
      orderCreationId,
      razorpayPaymentId,
      razorpayOrderId,
      razorpaySignature,
      messPaymentId
    } = req.body;

    // TODO: Verify signature using crypto
    // const crypto = require("crypto");
    // const hmac = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET);
    // hmac.update(razorpayOrderId + "|" + razorpayPaymentId);
    // const generated_signature = hmac.digest("hex");

    // if (generated_signature !== razorpaySignature) {
    //   return res.status(400).json({ message: "Payment signature verification failed" });
    // }

    // Get payment record
    const payment = await MessPayment.findById(messPaymentId);
    if (!payment) {
      return res.status(404).json({ message: "Payment record not found" });
    }

    // Update payment status
    payment.paymentStatus = "paid";
    payment.paymentDate = new Date();
    payment.amountPaid = payment.amount;
    payment.amountDue = 0;
    payment.transactionId = razorpayPaymentId;
    payment.paymentGateway = "razorpay";
    payment.receiptGenerated = true;
    payment.receiptId = `RCP-${Date.now()}`;

    await payment.save();

    // Create transaction record
    const transaction = new MessTransaction({
      transactionId: `TXN-${Date.now()}`,
      studentId: payment.studentId,
      transactionType: "payment",
      amount: payment.amount,
      transactionDate: new Date(),
      paymentMethod: "online",
      paymentGateway: "razorpay",
      gatewayTransactionId: razorpayPaymentId,
      status: "success",
      messFeeId: payment.messFeeId,
      messPaymentId: payment._id,
      description: "Online payment via Razorpay"
    });

    await transaction.save();

    res.json({
      message: "Payment verified and recorded successfully",
      payment,
      transaction
    });
  } catch (error) {
    console.error("Error verifying payment:", error);
    res.status(500).json({ message: "Payment verification failed", error: error.message });
  }
};

/**
 * Stripe Payment Integration (for future implementation)
 * npm install stripe
 */
const createStripePaymentIntent = async (req, res) => {
  try {
    const { messPaymentId, amount } = req.body;

    // Validate payment
    const payment = await MessPayment.findById(messPaymentId);
    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    // TODO: Initialize Stripe
    // const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
    // const paymentIntent = await stripe.paymentIntents.create({
    //   amount: amount * 100, // Convert to cents
    //   currency: "inr",
    //   metadata: {
    //     messPaymentId,
    //     studentId: payment.studentId.toString()
    //   }
    // });

    res.json({
      message: "Payment intent created",
      clientSecret: "pi_placeholder", // paymentIntent.client_secret,
      amount,
      publishableKey: process.env.STRIPE_PUBLIC_KEY || "pk_placeholder"
    });
  } catch (error) {
    console.error("Error creating payment intent:", error);
    res.status(500).json({ message: "Error creating payment intent", error: error.message });
  }
};

/**
 * Verify Stripe Payment
 */
const verifyStripePayment = async (req, res) => {
  try {
    const { paymentIntentId, messPaymentId } = req.body;

    // Get payment record
    const payment = await MessPayment.findById(messPaymentId);
    if (!payment) {
      return res.status(404).json({ message: "Payment record not found" });
    }

    // TODO: Verify payment intent with Stripe
    // const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
    // const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    // if (paymentIntent.status !== "succeeded") {
    //   return res.status(400).json({ message: "Payment not completed" });
    // }

    // Update payment
    payment.paymentStatus = "paid";
    payment.paymentDate = new Date();
    payment.amountPaid = payment.amount;
    payment.amountDue = 0;
    payment.transactionId = paymentIntentId;
    payment.paymentGateway = "stripe";
    payment.receiptGenerated = true;
    payment.receiptId = `RCP-${Date.now()}`;

    await payment.save();

    // Create transaction
    const transaction = new MessTransaction({
      transactionId: `TXN-${Date.now()}`,
      studentId: payment.studentId,
      transactionType: "payment",
      amount: payment.amount,
      transactionDate: new Date(),
      paymentMethod: "online",
      paymentGateway: "stripe",
      gatewayTransactionId: paymentIntentId,
      status: "success",
      messFeeId: payment.messFeeId,
      messPaymentId: payment._id,
      description: "Online payment via Stripe"
    });

    await transaction.save();

    res.json({
      message: "Stripe payment verified successfully",
      payment,
      transaction
    });
  } catch (error) {
    console.error("Error verifying Stripe payment:", error);
    res.status(500).json({ message: "Payment verification failed", error: error.message });
  }
};

/**
 * PayPal Payment Integration (for future implementation)
 */
const createPayPalPayment = async (req, res) => {
  try {
    const { messPaymentId, amount } = req.body;

    const payment = await MessPayment.findById(messPaymentId);
    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    // TODO: PayPal integration
    res.json({
      message: "PayPal payment initiated",
      paymentId: "paypal_placeholder"
    });
  } catch (error) {
    console.error("Error creating PayPal payment:", error);
    res.status(500).json({ message: "Error creating PayPal payment", error: error.message });
  }
};

/**
 * Handle webhook from payment gateway
 * Razorpay or Stripe sends updates via webhook
 */
const handlePaymentWebhook = async (req, res) => {
  try {
    const { event, data } = req.body;

    console.log("Webhook received:", event);

    // Handle different events
    switch (event) {
      case "payment.authorized":
      case "charge.succeeded":
        // Update payment status
        await MessPayment.updateOne(
          { transactionId: data.transactionId },
          { paymentStatus: "paid" }
        );
        break;

      case "payment.failed":
      case "charge.failed":
        // Update to failed
        await MessPayment.updateOne(
          { transactionId: data.transactionId },
          { paymentStatus: "failed" }
        );
        break;

      case "payment.refunded":
        // Handle refund
        await MessPayment.updateOne(
          { transactionId: data.transactionId },
          { paymentStatus: "refund" }
        );
        break;

      default:
        console.log("Unknown event:", event);
    }

    res.json({ received: true });
  } catch (error) {
    console.error("Error handling webhook:", error);
    res.status(500).json({ message: "Webhook processing failed" });
  }
};

/**
 * Get payment status
 */
const getPaymentStatus = async (req, res) => {
  try {
    const { messPaymentId } = req.params;

    const payment = await MessPayment.findById(messPaymentId);
    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    res.json({
      message: "Payment status fetched",
      paymentStatus: payment.paymentStatus,
      amountPaid: payment.amountPaid,
      amountDue: payment.amountDue,
      lastUpdated: payment.updatedAt
    });
  } catch (error) {
    console.error("Error fetching payment status:", error);
    res.status(500).json({ message: "Error fetching payment status", error: error.message });
  }
};

module.exports = {
  createRazorpayOrder,
  verifyRazorpayPayment,
  createStripePaymentIntent,
  verifyStripePayment,
  createPayPalPayment,
  handlePaymentWebhook,
  getPaymentStatus
};

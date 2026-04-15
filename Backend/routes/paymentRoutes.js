const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/paymentController");
const { authenticate, authorize } = require("../middleware/auth");

// Create payment record (admin only)
router.post("/payments", authenticate, authorize("admin"), paymentController.createPaymentRecord);

// Get all payments (with filters) - admin only
router.get("/payments", authenticate, authorize("admin"), paymentController.getAllPayments);

// Get payment by ID - admin or student (own payment)
router.get("/payments/:id", authenticate, paymentController.getPaymentById);

// Update payment status (admin only)
router.put("/payments/:id", authenticate, authorize("admin"), paymentController.updatePaymentStatus);

// Get student payment history - student can view own, admin can view any
router.get("/student/:studentId/payment-history", authenticate, paymentController.getStudentPaymentHistory);

// Get student payment details (for student panel)
router.get("/student/payment-details", authenticate, authorize("student"), paymentController.getStudentPaymentDetails);

// Process student payment
router.post("/student/pay", authenticate, authorize("student"), paymentController.processStudentPayment);

// Send payment details to student (admin only)
router.post("/student/:studentId/send-payment-details", authenticate, authorize("admin"), paymentController.sendPaymentDetails);

// Update student payment details (admin only)
router.put("/student/:studentId/payment-details", authenticate, authorize("admin"), paymentController.updateStudentPaymentDetails);

module.exports = router;

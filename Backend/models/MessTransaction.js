const mongoose = require("mongoose");

const messTransactionSchema = new mongoose.Schema(
  {
    // Transaction ID (unique)
    transactionId: {
      type: String,
      unique: true,
      required: true
      // Format: TXN-2025-000001
    },

    // Student Reference
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true
    },

    // Student Name (for easy lookup)
    studentName: {
      type: String,
      required: true
    },

    // Student Email
    studentEmail: {
      type: String,
      required: true
    },

    // Transaction Type
    transactionType: {
      type: String,
      enum: ["payment", "refund", "adjustment", "late_fee", "discount"],
      default: "payment"
    },

    // Amount
    amount: {
      type: Number,
      required: true
    },

    // Transaction Date
    transactionDate: {
      type: Date,
      default: Date.now
    },

    // Payment Method
    paymentMethod: {
      type: String,
      enum: ["online", "offline", "cash", "cheque", "bank_transfer", "upi"],
      required: true
    },

    // Payment Gateway
    paymentGateway: {
      type: String,
      enum: ["razorpay", "stripe", "paypal", "manual", "none"],
      default: "none"
    },

    // Gateway Transaction ID
    gatewayTransactionId: {
      type: String,
      default: ""
    },

    // Status
    status: {
      type: String,
      enum: ["success", "pending", "failed", "cancelled"],
      default: "pending"
    },

    // Related Mess Fee
    messFeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MessFee"
    },

    // Related Invoice
    invoiceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Invoice"
    },

    // Related Mess Payment
    messPaymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MessPayment"
    },

    // Description
    description: {
      type: String,
      default: ""
    },

    // Notes
    notes: {
      type: String,
      default: ""
    },

    // Processed By
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },

    // IP Address (for security)
    ipAddress: {
      type: String,
      default: ""
    },

    // User Agent (for security)
    userAgent: {
      type: String,
      default: ""
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("MessTransaction", messTransactionSchema);

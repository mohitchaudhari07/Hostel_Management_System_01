const mongoose = require("mongoose");

const messPaymentSchema = new mongoose.Schema(
  {
    // Student Reference
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true
    },

    // Mess Fee Reference (optional for ad-hoc payments)
    messFeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MessFee",
      required: false,
      default: null
    },

    // Payment Amount
    amount: {
      type: Number,
      required: true,
      min: 0
    },

    // Payment Method
    paymentMethod: {
      type: String,
      enum: ["online", "offline", "cash", "cheque", "bank_transfer", "upi"],
      required: true
    },

    // Payment Status
    paymentStatus: {
      type: String,
      enum: ["paid", "pending", "overdue", "failed", "cancelled"],
      default: "pending"
    },

    // Payment Gateway (for online payments)
    paymentGateway: {
      type: String,
      enum: ["razorpay", "stripe", "paypal", "manual", "none"],
      default: "none"
    },

    // Transaction ID (for online payments)
    transactionId: {
      type: String,
      unique: true,
      sparse: true
    },

    // Reference Number (for offline payments)
    referenceNumber: {
      type: String,
      default: ""
    },

    // Amount Paid
    amountPaid: {
      type: Number,
      default: 0,
      min: 0
    },

    // Amount Due
    amountDue: {
      type: Number,
      default: 0,
      min: 0
    },

    // Payment Date
    paymentDate: {
      type: Date,
      default: null
    },

    // Due Date
    dueDate: {
      type: Date,
      required: true
    },

    // Late Fee Applied
    lateFeeApplied: {
      type: Number,
      default: 0,
      min: 0
    },

    // Payment Notes
    notes: {
      type: String,
      default: ""
    },

    // Receipt Generated
    receiptGenerated: {
      type: Boolean,
      default: false
    },

    // Receipt ID
    receiptId: {
      type: String,
      unique: true,
      sparse: true
    },

    // Processed By (admin)
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("MessPayment", messPaymentSchema);

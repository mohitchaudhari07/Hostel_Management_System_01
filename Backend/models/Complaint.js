const mongoose = require("mongoose");

const complaintSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student",
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ["maintenance", "food", "cleaning", "security", "other"],
    default: "other"
  },
  status: {
    type: String,
    enum: ["pending", "in_progress", "resolved"],
    default: "pending"
  },
  adminReply: {
    type: String
  },
  isReadByAdmin: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

module.exports = mongoose.model("Complaint", complaintSchema);

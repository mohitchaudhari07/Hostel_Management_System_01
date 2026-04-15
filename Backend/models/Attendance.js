const mongoose = require("mongoose");

const AttendanceSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    date: {
      type: Date,
      default: () => {
        const date = new Date();
        date.setHours(0, 0, 0, 0);
        return date;
      },
    },
    checkInTime: {
      type: Date,
      default: null,
    },
    checkOutTime: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ["Present", "Absent", "Partial"],
      default: "Present",
    },
    matchDistance: {
      type: Number,
      default: null,
    },
    method: {
      type: String,
      enum: ["Face Recognition", "Manual", "QR Code"],
      default: "Face Recognition",
    },
    checkInDistance: {
      type: Number,
      default: null,
    },
    checkOutDistance: {
      type: Number,
      default: null,
    },
    duration: {
      type: Number, // Duration in minutes
      default: null,
    },
    notes: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

// Index for fast queries
AttendanceSchema.index({ studentId: 1, date: 1 });
AttendanceSchema.index({ date: 1 });
AttendanceSchema.index({ status: 1 });

module.exports = mongoose.model("Attendance", AttendanceSchema);

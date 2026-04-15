const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema(
  {
    name: String,
    phone: String,
    email: { type: String, unique: true },
    course: String,
    roomType: String,
    password: String,
    role: {
      type: String,
      default: "student"
    },
    // Room assignment fields
    roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', default: null },
    bedId: { type: String, default: null }, // bedNumber within the room
    roomNumber: { type: String, default: null },
    floor: { type: Number, default: null },
    block: { type: String, default: null },
    isRoomAssigned: { type: Boolean, default: false },
    roomAssignedDate: { type: Date, default: null },
    // Face recognition fields
    faceDescriptor: { type: [Number], default: null },
    faceRegistered: { type: Boolean, default: false },
    faceRegisteredDate: { type: Date, default: null },
    // Payment fields
    paymentStatus: {
      type: String,
      enum: ["not_assigned", "pending", "partial", "paid", "overdue"],
      default: "not_assigned"
    },
    hostelFeeAmount: { type: Number, default: 0 },
    messFeeAmount: { type: Number, default: 0 },
    hostelFeePaid: { type: Number, default: 0 },
    messFeePaid: { type: Number, default: 0 },
    totalFeeAmount: { type: Number, default: 0 },
    amountPaid: { type: Number, default: 0 },
    amountDue: { type: Number, default: 0 },
    paymentAssignedDate: { type: Date, default: null },
    paymentDueDate: { type: Date, default: null }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Student", studentSchema);

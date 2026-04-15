const mongoose = require("mongoose");

const bedSchema = new mongoose.Schema({
  bedNumber: { type: Number, required: true },
  isOccupied: { type: Boolean, default: false },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', default: null },
  studentName: { type: String, default: null },
  studentEmail: { type: String, default: null }
});

const roomSchema = new mongoose.Schema({
  roomNumber: { type: String, required: true, unique: true },
  roomType: { type: String, enum: ['Single', 'Double', 'Triple', 'Quad'], required: true },
  totalBeds: { type: Number, required: true },
  availableBeds: { type: Number, required: true },
  floor: { type: Number, required: true },
  block: { type: String, required: true },
  beds: [bedSchema],
  amenities: [String], // e.g., ['AC', 'Attached Bathroom', 'Study Table']
  rentPerMonth: { type: Number, required: true },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model("Room", roomSchema);
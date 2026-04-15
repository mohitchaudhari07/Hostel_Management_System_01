const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: false },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
  rating: { type: Number, min: 1, max: 5, required: true },
  comment: { type: String, default: '' },
  category: { type: String, enum: ['food', 'service', 'cleanliness', 'other'], default: 'food' },
  date: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Feedback', feedbackSchema);

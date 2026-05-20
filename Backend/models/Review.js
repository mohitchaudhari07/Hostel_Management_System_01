const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    foodItemId: { type: mongoose.Schema.Types.ObjectId, ref: "FoodItem", required: true },
    text: { type: String, required: true, maxlength: 2000 },
    sentiment: {
      type: String,
      enum: ["positive", "neutral", "negative"],
      default: "neutral",
    },
    sentimentScore: { type: Number, default: 0, min: -1, max: 1 },
    aiSummary: { type: String, default: "" },
    isPublic: { type: Boolean, default: true },
  },
  { timestamps: true },
);

reviewSchema.index({ foodItemId: 1, createdAt: -1 });
reviewSchema.index({ sentiment: 1 });

module.exports = mongoose.model("Review", reviewSchema);

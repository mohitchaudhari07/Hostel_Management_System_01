const mongoose = require("mongoose");

const ratingSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    foodItemId: { type: mongoose.Schema.Types.ObjectId, ref: "FoodItem", required: true },
    stars: { type: Number, required: true, min: 1, max: 5 },
    mealSlot: {
      type: String,
      enum: ["breakfast", "lunch", "dinner", "other"],
      default: "lunch",
    },
    date: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

ratingSchema.index({ userId: 1, foodItemId: 1 }, { unique: true });

module.exports = mongoose.model("Rating", ratingSchema);

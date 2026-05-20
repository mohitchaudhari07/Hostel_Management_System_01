const mongoose = require("mongoose");

const foodReactionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    foodItemId: { type: mongoose.Schema.Types.ObjectId, ref: "FoodItem", required: true },
    reaction: { type: String, enum: ["like", "dislike"], required: true },
  },
  { timestamps: true },
);

foodReactionSchema.index({ userId: 1, foodItemId: 1 }, { unique: true });

module.exports = mongoose.model("FoodReaction", foodReactionSchema);

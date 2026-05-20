const mongoose = require("mongoose");

const foodItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    category: {
      type: String,
      enum: ["breakfast", "lunch", "dinner", "snack", "beverage", "other"],
      default: "lunch",
    },
    mealType: { type: String, enum: ["veg", "non-veg", "vegan", "both"], default: "veg" },
    description: { type: String, default: "" },
    imageUrl: { type: String, default: "" },
    tags: [{ type: String }],
    avgRating: { type: Number, default: 0, min: 0, max: 5 },
    ratingCount: { type: Number, default: 0 },
    likeCount: { type: Number, default: 0 },
    dislikeCount: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
    popularityScore: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

foodItemSchema.index({ popularityScore: -1 });
foodItemSchema.index({ avgRating: -1 });

module.exports = mongoose.model("FoodItem", foodItemSchema);

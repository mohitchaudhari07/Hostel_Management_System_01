const mongoose = require("mongoose");

const recommendationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    type: {
      type: String,
      enum: [
        "personal",
        "popular",
        "trending",
        "combination",
        "weekly_menu",
        "demand",
      ],
      required: true,
    },
    payload: { type: mongoose.Schema.Types.Mixed, default: {} },
    expiresAt: { type: Date, required: true },
    generatedBy: { type: String, enum: ["ai", "engine", "hybrid"], default: "engine" },
  },
  { timestamps: true },
);

recommendationSchema.index({ userId: 1, type: 1 });
recommendationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("Recommendation", recommendationSchema);

const mongoose = require("mongoose");

const messFeeSchema = new mongoose.Schema(
  {
    // Fee Structure Type
    feeType: {
      type: String,
      enum: ["monthly", "semester"],
      required: true
    },

    // Period
    period: {
      type: String,
      required: true
      // For monthly: "2025-02" (February 2025)
      // For semester: "Spring-2025" or "Fall-2025"
    },

    // Fee Amount in rupees
    feeAmount: {
      type: Number,
      required: true,
      min: 0
    },

    // Pricing model: flat monthly or per-plate
    pricingModel: {
      type: String,
      enum: ["monthly_flat", "per_plate"],
      default: "monthly_flat"
    },

    // Per-plate rates (used when pricingModel === 'per_plate')
    perPlateRates: {
      veg: { type: Number, default: 0, min: 0 },
      nonVeg: { type: Number, default: 0, min: 0 }
    },

    // Per-meal rates (for more granular pricing)
    perMealRates: {
      breakfast: {
        veg: { type: Number, default: 0, min: 0 },
        nonVeg: { type: Number, default: 0, min: 0 }
      },
      lunch: {
        veg: { type: Number, default: 0, min: 0 },
        nonVeg: { type: Number, default: 0, min: 0 }
      },
      dinner: {
        veg: { type: Number, default: 0, min: 0 },
        nonVeg: { type: Number, default: 0, min: 0 }
      }
    },

    // Veg/Non-Veg available categories
    mealCategories: {
      type: [String],
      enum: ["veg", "non-veg", "both"],
      default: ["both"]
    },

    // Fee Category/Purpose
    feeCategory: {
      type: String,
      enum: ["meals", "maintenance", "utilities", "combined"],
      default: "combined"
    },

    // Application Rules
    applicableToRoomType: {
      // Which room types this fee applies to (Single, Double, Triple, etc.)
      type: [String],
      default: ["all"] // applies to all if empty or ["all"]
    },

    // Active Status
    isActive: {
      type: Boolean,
      default: true
    },

    // Due Date
    dueDate: {
      type: Date,
      required: true
    },

    // Late Fee (if any)
    lateFeePercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },

    // Description
    description: {
      type: String,
      default: ""
    },

    // Created By
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    // Notes
    notes: {
      type: String,
      default: ""
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("MessFee", messFeeSchema);

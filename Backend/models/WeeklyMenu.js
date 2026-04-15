const mongoose = require("mongoose");

const dayMenuSchema = new mongoose.Schema({
  breakfast: { type: [String], default: [] },
  lunch: { type: [String], default: [] },
  dinner: { type: [String], default: [] },
  breakfastStatus: { type: String, enum: ['pending', 'preparing', 'ready', 'served'], default: 'pending' },
  lunchStatus: { type: String, enum: ['pending', 'preparing', 'ready', 'served'], default: 'pending' },
  dinnerStatus: { type: String, enum: ['pending', 'preparing', 'ready', 'served'], default: 'pending' },
  notes: { type: String, default: "" }
});

const weeklyMenuSchema = new mongoose.Schema(
  {
    // e.g. weekOf: 2026-02-23 (ISO date representing week start)
    weekOf: { type: Date, required: true },
    // Object with keys monday..sunday
    days: {
      type: Map,
      of: dayMenuSchema,
      default: {}
    },
    specialSundayMenu: { type: dayMenuSchema, default: {} },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    notes: { type: String, default: "" }
  },
  { timestamps: true }
);

module.exports = mongoose.model("WeeklyMenu", weeklyMenuSchema);

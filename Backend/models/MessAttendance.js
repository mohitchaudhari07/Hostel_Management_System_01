const mongoose = require("mongoose");

const messAttendanceSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    date: {
      type: Date,
      required: true,
      default: () => {
        const date = new Date();
        date.setHours(0, 0, 0, 0);
        return date;
      },
    },
    meals: {
      breakfast: {
        attended: { type: Boolean, default: false },
        timestamp: { type: Date, default: null },
        mealType: { type: String, enum: ["veg", "non-veg"], default: "veg" }
      },
      lunch: {
        attended: { type: Boolean, default: false },
        timestamp: { type: Date, default: null },
        mealType: { type: String, enum: ["veg", "non-veg"], default: "veg" }
      },
      dinner: {
        attended: { type: Boolean, default: false },
        timestamp: { type: Date, default: null },
        mealType: { type: String, enum: ["veg", "non-veg"], default: "veg" }
      }
    },
    totalMeals: {
      type: Number,
      default: 0,
      min: 0,
      max: 3
    },
    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    notes: {
      type: String,
      default: ""
    }
  },
  { timestamps: true }
);

// Compound index to prevent duplicate entries
messAttendanceSchema.index({ studentId: 1, date: 1 }, { unique: true });

// Pre-save middleware to calculate total meals
messAttendanceSchema.pre('save', function(next) {
  let total = 0;
  if (this.meals.breakfast.attended) total++;
  if (this.meals.lunch.attended) total++;
  if (this.meals.dinner.attended) total++;
  this.totalMeals = total;
  next();
});

module.exports = mongoose.model("MessAttendance", messAttendanceSchema);
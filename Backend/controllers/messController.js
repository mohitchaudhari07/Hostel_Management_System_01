const MessFee = require("../models/MessFee");
const MessPayment = require("../models/MessPayment");
const Student = require("../models/Student");
const WeeklyMenu = require("../models/WeeklyMenu");
const User = require("../models/User");
const Attendance = require("../models/Attendance");
const MessTransaction = require("../models/MessTransaction");
const Feedback = require("../models/Feedback");

// Create new fee structure
const createMessFee = async (req, res) => {
  try {
    const {
      feeType,
      period,
      feeAmount,
      pricingModel,
      perPlateRates,
      perMealRates,
      mealCategories,
      feeCategory,
      applicableToRoomType,
      dueDate,
      lateFeePercentage,
      description,
      notes
    } = req.body;

    // Validate required fields
    if (!feeType || !period || !dueDate) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Check if fee for this period already exists
    const existingFee = await MessFee.findOne({ period, feeType });
    if (existingFee && existingFee.isActive) {
      return res.status(400).json({ message: "A fee for this period already exists" });
    }

    const newMessFee = new MessFee({
      feeType,
      period,
      feeAmount,
      pricingModel: pricingModel || "monthly_flat",
      perPlateRates: perPlateRates || { veg: 0, nonVeg: 0 },
      perMealRates: perMealRates || {
        breakfast: { veg: 0, nonVeg: 0 },
        lunch: { veg: 0, nonVeg: 0 },
        dinner: { veg: 0, nonVeg: 0 }
      },
      mealCategories: mealCategories || ["both"],
      feeCategory,
      applicableToRoomType: applicableToRoomType || ["all"],
      dueDate: new Date(dueDate),
      lateFeePercentage,
      description,
      notes,
      createdBy: req.user.id
    });

    await newMessFee.save();

    res.status(201).json({
      message: "Mess fee created successfully",
      messFee: newMessFee
    });
  } catch (error) {
    console.error("Error creating mess fee:", error);
    res.status(500).json({ message: "Error creating mess fee", error: error.message });
  }
};

// Get all fee structures
const getAllMessFees = async (req, res) => {
  try {
    const { feeType, period, isActive } = req.query;

    const filter = {};
    if (feeType) filter.feeType = feeType;
    if (period) filter.period = period;
    if (isActive !== undefined) filter.isActive = isActive === "true";

    const fees = await MessFee.find(filter)
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    res.json({
      message: "Mess fees fetched",
      count: fees.length,
      fees
    });
  } catch (error) {
    console.error("Error fetching mess fees:", error);
    res.status(500).json({ message: "Error fetching mess fees", error: error.message });
  }
};

// Get fee by ID
const getMessFeeById = async (req, res) => {
  try {
    const { id } = req.params;

    const fee = await MessFee.findById(id).populate("createdBy", "name email");

    if (!fee) {
      return res.status(404).json({ message: "Mess fee not found" });
    }

    res.json({
      message: "Mess fee fetched",
      fee
    });
  } catch (error) {
    console.error("Error fetching mess fee:", error);
    res.status(500).json({ message: "Error fetching mess fee", error: error.message });
  }
};

// Update fee structure
const updateMessFee = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      feeAmount,
      pricingModel,
      perPlateRates,
      perMealRates,
      mealCategories,
      dueDate,
      lateFeePercentage,
      description,
      notes,
      isActive
    } = req.body;

    const fee = await MessFee.findById(id);
    if (!fee) {
      return res.status(404).json({ message: "Mess fee not found" });
    }

    // Update fields if provided
    if (feeAmount !== undefined) fee.feeAmount = feeAmount;
    if (pricingModel !== undefined) fee.pricingModel = pricingModel;
    if (perPlateRates !== undefined) fee.perPlateRates = perPlateRates;
    if (perMealRates !== undefined) fee.perMealRates = perMealRates;
    if (mealCategories !== undefined) fee.mealCategories = mealCategories;
    if (dueDate) fee.dueDate = new Date(dueDate);
    if (lateFeePercentage !== undefined) fee.lateFeePercentage = lateFeePercentage;
    if (description !== undefined) fee.description = description;
    if (notes !== undefined) fee.notes = notes;
    if (isActive !== undefined) fee.isActive = isActive;

    await fee.save();

    res.json({
      message: "Mess fee updated successfully",
      fee
    });
  } catch (error) {
    console.error("Error updating mess fee:", error);
    res.status(500).json({ message: "Error updating mess fee", error: error.message });
  }
};

// Delete fee structure
const deleteMessFee = async (req, res) => {
  try {
    const { id } = req.params;

    const fee = await MessFee.findByIdAndDelete(id);

    if (!fee) {
      return res.status(404).json({ message: "Mess fee not found" });
    }

    res.json({
      message: "Mess fee deleted successfully",
      fee
    });
  } catch (error) {
    console.error("Error deleting mess fee:", error);
    res.status(500).json({ message: "Error deleting mess fee", error: error.message });
  }
};

// Get applicable fees for a student
const getApplicableFeesForStudent = async (req, res) => {
  try {
    const { studentId } = req.params;

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    if (req.user.role === "student" && student.email !== req.user.email) {
      return res.status(403).json({ message: "You can only view your own fees" });
    }

    // Find applicable fees
    const fees = await MessFee.find({
      isActive: true,
      $or: [
        { applicableToRoomType: "all" },
        { applicableToRoomType: student.roomType }
      ]
    }).sort({ dueDate: 1 });

    res.json({
      message: "Applicable fees fetched",
      studentRoomType: student.roomType,
      count: fees.length,
      fees
    });
  } catch (error) {
    console.error("Error fetching applicable fees:", error);
    res.status(500).json({ message: "Error fetching applicable fees", error: error.message });
  }
};

module.exports = {
  createMessFee,
  getAllMessFees,
  getMessFeeById,
  updateMessFee,
  deleteMessFee,
  getApplicableFeesForStudent
  ,
  createWeeklyMenu,
  getWeeklyMenus,
  updateWeeklyMenu,
  assignMessManager,
  createFeedback,
  getFeedbacks,
  getReports
};

// Create weekly menu
async function createWeeklyMenu(req, res) {
  try {
    const { weekOf, days, specialSundayMenu, notes } = req.body;
    if (!weekOf) return res.status(400).json({ message: "Missing weekOf date" });

    const weekStart = new Date(weekOf);
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const existing = await WeeklyMenu.findOne({
      weekOf: { $gte: weekStart, $lt: weekEnd },
    });

    if (existing) {
      existing.days = days || existing.days;
      if (specialSundayMenu !== undefined) existing.specialSundayMenu = specialSundayMenu;
      if (notes !== undefined) existing.notes = notes;
      await existing.save();
      return res.json({ message: "Weekly menu updated", menu: existing });
    }

    const menu = new WeeklyMenu({
      weekOf: weekStart,
      days: days || {},
      specialSundayMenu: specialSundayMenu || {},
      createdBy: req.user.id,
      notes: notes || ""
    });

    await menu.save();
    res.status(201).json({ message: "Weekly menu created", menu });
  } catch (error) {
    console.error("Error creating weekly menu:", error);
    res.status(500).json({ message: "Error creating weekly menu", error: error.message });
  }
}

async function getWeeklyMenus(req, res) {
  try {
    const { weekOf } = req.query;
    const filter = {};
    if (weekOf) filter.weekOf = new Date(weekOf);

    const menus = await WeeklyMenu.find(filter).sort({ weekOf: -1 }).populate("createdBy", "name email");
    res.json({ message: "Weekly menus fetched", count: menus.length, menus });
  } catch (error) {
    console.error("Error fetching weekly menus:", error);
    res.status(500).json({ message: "Error fetching weekly menus", error: error.message });
  }
}

// Update weekly menu
async function updateWeeklyMenu(req, res) {
  try {
    const { id } = req.params;
    const { days, specialSundayMenu, notes, day, meal, status } = req.body;

    const menu = await WeeklyMenu.findById(id);
    if (!menu) return res.status(404).json({ message: "Weekly menu not found" });

    // Handle status update for specific meal
    if (day && meal && status) {
      if (!menu.days[day]) menu.days[day] = {};
      menu.days[day][`${meal}Status`] = status;
    } else {
      // Handle full menu update
      if (days !== undefined) menu.days = days;
      if (specialSundayMenu !== undefined) menu.specialSundayMenu = specialSundayMenu;
      if (notes !== undefined) menu.notes = notes;
    }

    await menu.save();
    res.json({ message: "Weekly menu updated", menu });
  } catch (error) {
    console.error("Error updating weekly menu:", error);
    res.status(500).json({ message: "Error updating weekly menu", error: error.message });
  }
}

async function deleteWeeklyMenu(req, res) {
  try {
    const { id } = req.params;
    const menu = await WeeklyMenu.findByIdAndDelete(id);

    if (!menu) {
      return res.status(404).json({ message: "Weekly menu not found" });
    }

    res.json({ message: "Weekly menu deleted", menu });
  } catch (error) {
    console.error("Error deleting weekly menu:", error);
    res.status(500).json({ message: "Error deleting weekly menu", error: error.message });
  }
}

// Create feedback (students)
async function createFeedback(req, res) {
  try {
    const { rating, comment, category } = req.body;
    if (!rating || rating < 1 || rating > 5) return res.status(400).json({ message: "Invalid rating" });
    const student = req.user.role === "student"
      ? await Student.findOne({ email: req.user.email })
      : null;

    const fb = new Feedback({
      studentId: student?._id,
      userId: req.user.id,
      rating,
      comment: comment || "",
      category: category || 'food'
    });

    await fb.save();
    res.status(201).json({ message: "Feedback submitted", feedback: fb });
  } catch (error) {
    console.error("Error creating feedback:", error);
    res.status(500).json({ message: "Error creating feedback", error: error.message });
  }
}

// Get feedbacks (admin/mess)
async function getFeedbacks(req, res) {
  try {
    const { from, to, category } = req.query;
    const filter = {};
    if (from || to) filter.date = {};
    if (from) filter.date.$gte = new Date(from);
    if (to) filter.date.$lte = new Date(to);
    if (category) filter.category = category;

    const feedbacks = await Feedback.find(filter).sort({ createdAt: -1 }).limit(500);
    res.json({ message: "Feedbacks fetched", count: feedbacks.length, feedbacks });
  } catch (error) {
    console.error("Error fetching feedbacks:", error);
    res.status(500).json({ message: "Error fetching feedbacks", error: error.message });
  }
}

// Assign mess manager
async function assignMessManager(req, res) {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.role = "mess"; // role used by mess routes
    await user.save();

    res.json({ message: "User assigned as mess manager", user: { id: user._id, name: user.name, role: user.role } });
  } catch (error) {
    console.error("Error assigning mess manager:", error);
    res.status(500).json({ message: "Error assigning mess manager", error: error.message });
  }
}

// Reports: daily attendance, food consumption, monthly expense, feedback ratings (feedback optional)
async function getReports(req, res) {
  try {
    const { date, month } = req.query;

    // Daily attendance
    const targetDate = date ? new Date(date) : new Date();
    targetDate.setHours(0,0,0,0);
    const nextDate = new Date(targetDate);
    nextDate.setDate(nextDate.getDate() + 1);

    const dailyAttendanceCount = await Attendance.countDocuments({ date: { $gte: targetDate, $lt: nextDate }, status: "Present" });

    // Food consumption - derive from MessTransaction payments in the day
    const foodConsumption = await MessTransaction.aggregate([
      { $match: { transactionDate: { $gte: targetDate, $lt: nextDate } } },
      { $group: { _id: null, totalAmount: { $sum: "$amount" }, txCount: { $sum: 1 } } }
    ]);

    // Monthly expense - sum of mess payments for the month
    let monthlyExpense = 0;
    if (month) {
      const [y, m] = month.split("-"); // expecting YYYY-MM
      const monthStart = new Date(parseInt(y), parseInt(m) - 1, 1);
      const monthEnd = new Date(parseInt(y), parseInt(m), 1);
      const agg = await MessPayment.aggregate([
        { $match: { paymentDate: { $gte: monthStart, $lt: monthEnd } } },
        { $group: { _id: null, total: { $sum: "$amountPaid" } } }
      ]);
      monthlyExpense = agg[0] ? agg[0].total : 0;
    }

    // Feedback ratings - compute averages if available
    const feedbackAgg = await Feedback.aggregate([
      { $match: { date: { $gte: targetDate, $lt: nextDate } } },
      { $group: { _id: null, avgRating: { $avg: "$rating" }, count: { $sum: 1 } } }
    ]);

    const feedbackRatings = feedbackAgg[0] ? { average: feedbackAgg[0].avgRating, count: feedbackAgg[0].count } : { average: null, count: 0 };

    res.json({
      message: "Reports fetched",
      dailyAttendance: dailyAttendanceCount,
      foodConsumption: foodConsumption[0] || { totalAmount: 0, txCount: 0 },
      monthlyExpense,
      feedbackRatings
    });
  } catch (error) {
    console.error("Error generating reports:", error);
    res.status(500).json({ message: "Error generating reports", error: error.message });
  }
};

// Mess Attendance Management
const MessAttendance = require("../models/MessAttendance");

// Mark meal attendance
const markMealAttendance = async (req, res) => {
  try {
    const { studentId, date, meals } = req.body;

    if (!studentId || !date || !meals) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);

    let attendance = await MessAttendance.findOne({ studentId, date: attendanceDate });

    if (!attendance) {
      attendance = new MessAttendance({
        studentId,
        date: attendanceDate,
        markedBy: req.user.id
      });
    }

    // Update meals
    if (meals.breakfast !== undefined) {
      attendance.meals.breakfast.attended = meals.breakfast.attended;
      if (meals.breakfast.attended) {
        attendance.meals.breakfast.timestamp = new Date();
        attendance.meals.breakfast.mealType = meals.breakfast.mealType || "veg";
      }
    }

    if (meals.lunch !== undefined) {
      attendance.meals.lunch.attended = meals.lunch.attended;
      if (meals.lunch.attended) {
        attendance.meals.lunch.timestamp = new Date();
        attendance.meals.lunch.mealType = meals.lunch.mealType || "veg";
      }
    }

    if (meals.dinner !== undefined) {
      attendance.meals.dinner.attended = meals.dinner.attended;
      if (meals.dinner.attended) {
        attendance.meals.dinner.timestamp = new Date();
        attendance.meals.dinner.mealType = meals.dinner.mealType || "veg";
      }
    }

    await attendance.save();

    res.json({
      message: "Meal attendance marked successfully",
      attendance
    });
  } catch (error) {
    console.error("Error marking meal attendance:", error);
    res.status(500).json({ message: "Error marking meal attendance", error: error.message });
  }
};

// Get attendance for a specific date
const getMealAttendance = async (req, res) => {
  try {
    const { date } = req.query;
    const targetDate = date ? new Date(date) : new Date();
    targetDate.setHours(0, 0, 0, 0);
    const nextDate = new Date(targetDate);
    nextDate.setDate(nextDate.getDate() + 1);

    const attendance = await MessAttendance.find({
      date: { $gte: targetDate, $lt: nextDate }
    }).populate("studentId", "name email roomNumber").populate("markedBy", "name");

    res.json({
      message: "Meal attendance fetched",
      date: targetDate,
      attendance
    });
  } catch (error) {
    console.error("Error fetching meal attendance:", error);
    res.status(500).json({ message: "Error fetching meal attendance", error: error.message });
  }
};

// Get attendance summary for reports
const getAttendanceSummary = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    const summary = await MessAttendance.aggregate([
      { $match: { date: { $gte: start, $lte: end } } },
      {
        $group: {
          _id: null,
          totalBreakfast: { $sum: { $cond: ["$meals.breakfast.attended", 1, 0] } },
          totalLunch: { $sum: { $cond: ["$meals.lunch.attended", 1, 0] } },
          totalDinner: { $sum: { $cond: ["$meals.dinner.attended", 1, 0] } },
          totalStudents: { $addToSet: "$studentId" }
        }
      }
    ]);

    const result = summary[0] || { totalBreakfast: 0, totalLunch: 0, totalDinner: 0, totalStudents: [] };

    res.json({
      message: "Attendance summary fetched",
      period: { start, end },
      summary: {
        breakfast: result.totalBreakfast,
        lunch: result.totalLunch,
        dinner: result.totalDinner,
        uniqueStudents: result.totalStudents.length
      }
    });
  } catch (error) {
    console.error("Error fetching attendance summary:", error);
    res.status(500).json({ message: "Error fetching attendance summary", error: error.message });
  }
};

module.exports = {
  createMessFee,
  getAllMessFees,
  getMessFeeById,
  updateMessFee,
  deleteMessFee,
  getApplicableFeesForStudent,
  createWeeklyMenu,
  getWeeklyMenus,
  updateWeeklyMenu,
  deleteWeeklyMenu,
  createFeedback,
  getFeedbacks,
  assignMessManager,
  getReports,
  markMealAttendance,
  getMealAttendance,
  getAttendanceSummary
};

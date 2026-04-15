const MessPayment = require("../models/MessPayment");
const MessFee = require("../models/MessFee");
const Invoice = require("../models/Invoice");
const MessTransaction = require("../models/MessTransaction");
const Student = require("../models/Student");

// Get dashboard analytics
const getDashboardAnalytics = async (req, res) => {
  try {
    // Get current period
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const currentPeriod = `${year}-${month}`;

    // Total statistics
    const totalStudents = await Student.countDocuments();
    const totalPayments = await MessPayment.countDocuments();
    const totalTransactions = await MessTransaction.countDocuments();

    // Payment statistics
    const paymentStats = await MessPayment.aggregate([
      {
        $group: {
          _id: "$paymentStatus",
          count: { $sum: 1 },
          totalAmount: { $sum: "$amount" }
        }
      }
    ]);

    // Revenue statistics
    const paidPayments = await MessPayment.find({ paymentStatus: "paid" });
    const totalCollected = paidPayments.reduce((sum, p) => sum + p.amountPaid, 0);

    const pendingPayments = await MessPayment.find({ paymentStatus: "pending" });
    const totalPending = pendingPayments.reduce((sum, p) => sum + p.amountDue, 0);

    const overduePayments = await MessPayment.find({ paymentStatus: "overdue" });
    const totalOverdue = overduePayments.reduce((sum, p) => sum + p.amountDue, 0);

    // Monthly collection trend
    const monthlyTrend = await MessTransaction.aggregate([
      {
        $match: { status: "success" }
      },
      {
        $group: {
          _id: {
            year: { $year: "$transactionDate" },
            month: { $month: "$transactionDate" }
          },
          totalAmount: { $sum: "$amount" },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
      { $limit: 12 }
    ]);

    // Payment method breakdown
    const paymentMethodStats = await MessTransaction.aggregate([
      {
        $match: { status: "success" }
      },
      {
        $group: {
          _id: "$paymentMethod",
          count: { $sum: 1 },
          totalAmount: { $sum: "$amount" }
        }
      }
    ]);

    // Default payment method stats if none found
    if (paymentMethodStats.length === 0) {
      paymentMethodStats.push({
        _id: "no_data",
        count: 0,
        totalAmount: 0
      });
    }

    // Top paying students
    const topPayingStudents = await MessPayment.aggregate([
      {
        $group: {
          _id: "$studentId",
          totalPaid: { $sum: "$amountPaid" }
        }
      },
      { $sort: { totalPaid: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: "students",
          localField: "_id",
          foreignField: "_id",
          as: "student"
        }
      },
      { $unwind: "$student" }
    ]);

    // Fee-wise collection
    const feeWiseCollection = await MessPayment.aggregate([
      {
        $group: {
          _id: "$messFeeId",
          totalAmount: { $sum: "$amount" },
          totalPaid: { $sum: "$amountPaid" },
          count: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: "messfees",
          localField: "_id",
          foreignField: "_id",
          as: "fee"
        }
      }
    ]);

    res.json({
      message: "Dashboard analytics fetched",
      overview: {
        totalStudents,
        totalPayments,
        totalTransactions,
        currentPeriod
      },
      revenue: {
        totalCollected,
        totalPending,
        totalOverdue,
        totalDue: totalPending + totalOverdue
      },
      paymentStats,
      monthlyTrend,
      paymentMethodStats,
      topPayingStudents,
      feeWiseCollection
    });
  } catch (error) {
    console.error("Error fetching dashboard analytics:", error);
    res.status(500).json({ message: "Error fetching dashboard analytics", error: error.message });
  }
};

// Get collection summary
const getCollectionSummary = async (req, res) => {
  try {
    const { month, year } = req.query;

    const filter = {};
    if (month && year) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 1);
      filter.transactionDate = { $gte: startDate, $lt: endDate };
    }

    const summary = await MessTransaction.aggregate([
      { $match: { ...filter, status: "success" } },
      {
        $group: {
          _id: null,
          totalCollection: { $sum: "$amount" },
          totalTransactions: { $sum: 1 },
          averageTransaction: { $avg: "$amount" }
        }
      }
    ]);

    // Get payment method breakdown for the period
    const paymentBreakdown = await MessTransaction.aggregate([
      { $match: { ...filter, status: "success" } },
      {
        $group: {
          _id: "$paymentMethod",
          amount: { $sum: "$amount" },
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      message: "Collection summary fetched",
      period: {
        month: month || "all",
        year: year || "all"
      },
      summary: summary.length > 0 ? summary[0] : { totalCollection: 0, totalTransactions: 0, averageTransaction: 0 },
      paymentBreakdown
    });
  } catch (error) {
    console.error("Error fetching collection summary:", error);
    res.status(500).json({ message: "Error fetching collection summary", error: error.message });
  }
};

// Get pending dues report
const getPendingDuesReport = async (req, res) => {
  try {
    const { sortBy = "amountDue", order = "-1" } = req.query;

    const report = await MessPayment.aggregate([
      {
        $match: {
          paymentStatus: { $in: ["pending", "overdue"] },
          amountDue: { $gt: 0 }
        }
      },
      {
        $lookup: {
          from: "students",
          localField: "studentId",
          foreignField: "_id",
          as: "student"
        }
      },
      {
        $lookup: {
          from: "messfees",
          localField: "messFeeId",
          foreignField: "_id",
          as: "fee"
        }
      },
      { $unwind: "$student" },
      { $unwind: "$fee" },
      { $sort: { [sortBy]: parseInt(order) } }
    ]);

    // Group by student
    const groupedByStudent = {};
    report.forEach((payment) => {
      const studentId = payment.studentId;
      if (!groupedByStudent[studentId]) {
        groupedByStudent[studentId] = {
          student: payment.student,
          totalDue: 0,
          payments: []
        };
      }
      groupedByStudent[studentId].totalDue += payment.amountDue;
      groupedByStudent[studentId].payments.push({
        period: payment.fee.period,
        amount: payment.amountDue,
        status: payment.paymentStatus,
        dueDate: payment.dueDate
      });
    });

    // Convert to array and sort by total due
    const studentDues = Object.values(groupedByStudent).sort((a, b) => b.totalDue - a.totalDue);

    // Calculate totals
    const totalDue = studentDues.reduce((sum, s) => sum + s.totalDue, 0);
    const studentsInArrears = studentDues.length;

    res.json({
      message: "Pending dues report fetched",
      totals: {
        totalDue,
        studentsInArrears,
        averageDuePerStudent: studentsInArrears > 0 ? totalDue / studentsInArrears : 0
      },
      studentDues
    });
  } catch (error) {
    console.error("Error fetching pending dues report:", error);
    res.status(500).json({ message: "Error fetching pending dues report", error: error.message });
  }
};

// Get payment status distribution
const getPaymentStatusDistribution = async (req, res) => {
  try {
    const distribution = await MessPayment.aggregate([
      {
        $group: {
          _id: "$paymentStatus",
          count: { $sum: 1 },
          totalAmount: { $sum: "$amount" },
          totalAmountDue: { $sum: "$amountDue" }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Calculate percentages
    const total = distribution.reduce((sum, d) => sum + d.count, 0);
    const withPercentage = distribution.map((item) => ({
      ...item,
      percentage: ((item.count / total) * 100).toFixed(2)
    }));

    res.json({
      message: "Payment status distribution fetched",
      total,
      distribution: withPercentage
    });
  } catch (error) {
    console.error("Error fetching payment status distribution:", error);
    res.status(500).json({ message: "Error fetching payment status distribution", error: error.message });
  }
};

module.exports = {
  getDashboardAnalytics,
  getCollectionSummary,
  getPendingDuesReport,
  getPaymentStatusDistribution
};

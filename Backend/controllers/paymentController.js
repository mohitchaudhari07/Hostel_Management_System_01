const MessPayment = require("../models/MessPayment");
const MessFee = require("../models/MessFee");
const Invoice = require("../models/Invoice");
const MessTransaction = require("../models/MessTransaction");
const Student = require("../models/Student");

// Create payment record (admin)
const createPaymentRecord = async (req, res) => {
  try {
    const {
      studentId,
      messFeeId,
      amount,
      paymentMethod,
      paymentStatus,
      paymentGateway,
      transactionId,
      referenceNumber,
      amountPaid,
      paymentDate,
      notes
    } = req.body;

    // Validate student exists
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Validate mess fee exists
    const messFee = await MessFee.findById(messFeeId);
    if (!messFee) {
      return res.status(404).json({ message: "Mess fee not found" });
    }

    // Calculate amount due
    const paymentDate_ = paymentDate ? new Date(paymentDate) : new Date();
    const isOverdue = paymentDate_ > messFee.dueDate;
    const lateFee = isOverdue && paymentStatus === "paid" 
      ? (messFee.feeAmount * messFee.lateFeePercentage) / 100 
      : 0;

    const totalAmount = messFee.feeAmount + lateFee;
    const amountDue = totalAmount - (amountPaid || 0);

    const newPayment = new MessPayment({
      studentId,
      messFeeId,
      amount: messFee.feeAmount,
      paymentMethod,
      paymentStatus,
      paymentGateway,
      transactionId: transactionId || null,
      referenceNumber,
      amountPaid: amountPaid || (paymentStatus === "paid" ? messFee.feeAmount : 0),
      paymentDate: paymentStatus === "paid" ? paymentDate_ : null,
      dueDate: messFee.dueDate,
      lateFeeApplied: lateFee,
      notes,
      processedBy: req.user.id
    });

    await newPayment.save();

    // Create transaction record
    const transactionRecord = new MessTransaction({
      transactionId: `TXN-${Date.now()}`,
      studentId,
      studentName: student.name,
      studentEmail: student.email,
      transactionType: "payment",
      amount: amountPaid || messFee.feeAmount,
      transactionDate: paymentDate_,
      paymentMethod,
      paymentGateway,
      gatewayTransactionId: transactionId || "",
      status: paymentStatus === "paid" ? "success" : paymentStatus === "pending" ? "pending" : "failed",
      messFeeId,
      messPaymentId: newPayment._id,
      description: `Payment for ${messFee.period}`,
      processedBy: req.user.id,
      ipAddress: req.ip || ""
    });

    await transactionRecord.save();

    res.status(201).json({
      message: "Payment record created successfully",
      payment: newPayment,
      transaction: transactionRecord
    });
  } catch (error) {
    console.error("Error creating payment record:", error);
    res.status(500).json({ message: "Error creating payment record", error: error.message });
  }
};

// Get all payments (with filters)
const getAllPayments = async (req, res) => {
  try {
    const { studentId, paymentStatus, messFeeId, page = 1, limit = 50 } = req.query;

    const filter = {};
    if (studentId) filter.studentId = studentId;
    if (paymentStatus) filter.paymentStatus = paymentStatus;
    if (messFeeId) filter.messFeeId = messFeeId;

    const skip = (page - 1) * limit;

    const payments = await MessPayment.find(filter)
      .populate("studentId", "name email roomNumber")
      .populate("messFeeId", "period feeAmount feeType")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await MessPayment.countDocuments(filter);

    res.json({
      message: "Payments fetched",
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / limit),
      count: payments.length,
      payments
    });
  } catch (error) {
    console.error("Error fetching payments:", error);
    res.status(500).json({ message: "Error fetching payments", error: error.message });
  }
};

// Get payment by ID
const getPaymentById = async (req, res) => {
  try {
    const { id } = req.params;

    const payment = await MessPayment.findById(id)
      .populate("studentId")
      .populate("messFeeId")
      .populate("processedBy", "name email");

    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    res.json({
      message: "Payment fetched",
      payment
    });
  } catch (error) {
    console.error("Error fetching payment:", error);
    res.status(500).json({ message: "Error fetching payment", error: error.message });
  }
};

// Update payment status
const updatePaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentStatus, amountPaid, notes } = req.body;

    const payment = await MessPayment.findById(id);
    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    const messFee = await MessFee.findById(payment.messFeeId);

    // Update payment
    if (paymentStatus) {
      payment.paymentStatus = paymentStatus;
      if (paymentStatus === "paid" && !payment.paymentDate) {
        payment.paymentDate = new Date();
      }
    }

    if (amountPaid !== undefined) {
      payment.amountPaid = amountPaid;
      payment.amountDue = payment.amount - amountPaid;
    }

    if (notes !== undefined) {
      payment.notes = notes;
    }

    await payment.save();

    res.json({
      message: "Payment status updated successfully",
      payment
    });
  } catch (error) {
    console.error("Error updating payment:", error);
    res.status(500).json({ message: "Error updating payment", error: error.message });
  }
};

// Get student payment history
const getStudentPaymentHistory = async (req, res) => {
  try {
    const { studentId } = req.params;

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    const payments = await MessPayment.find({ studentId })
      .populate("messFeeId", "period feeAmount dueDate feeType")
      .sort({ createdAt: -1 });

    // Calculate statistics
    const stats = {
      totalFees: payments.reduce((sum, p) => sum + p.amount, 0),
      totalPaid: payments.reduce((sum, p) => sum + p.amountPaid, 0),
      totalDue: payments.reduce((sum, p) => sum + p.amountDue, 0),
      paidCount: payments.filter(p => p.paymentStatus === "paid").length,
      pendingCount: payments.filter(p => p.paymentStatus === "pending").length,
      overdueCount: payments.filter(p => p.paymentStatus === "overdue").length
    };

    res.json({
      message: "Student payment history fetched",
      studentName: student.name,
      studentEmail: student.email,
      stats,
      payments
    });
  } catch (error) {
    console.error("Error fetching student payment history:", error);
    res.status(500).json({ message: "Error fetching student payment history", error: error.message });
  }
};

// Get student payment details (for student panel)
const getStudentPaymentDetails = async (req, res) => {
  try {
    const studentId = req.user.id; // From auth middleware

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Get current mess fee details
    const currentMessFee = await MessFee.findOne({ 
      isActive: true, 
      feeType: "monthly",
      applicableToRoomType: { $in: ["all", student.roomType] }
    }).sort({ createdAt: -1 });

    // Get room rent details
    let roomRent = 0;
    if (student.roomId) {
      const room = await require("../models/Room").findById(student.roomId);
      if (room) {
        roomRent = room.rentPerMonth;
      }
    }

    res.json({
      message: "Payment details fetched",
      paymentDetails: {
        hostelFeeAmount: student.hostelFeeAmount,
        messFeeAmount: student.messFeeAmount,
        hostelFeePaid: student.hostelFeePaid,
        messFeePaid: student.messFeePaid,
        totalFeeAmount: student.totalFeeAmount,
        amountPaid: student.amountPaid,
        amountDue: student.amountDue,
        paymentStatus: student.paymentStatus,
        paymentAssignedDate: student.paymentAssignedDate,
        paymentDueDate: student.paymentDueDate
      },
      currentFees: {
        roomRent,
        messFee: currentMessFee ? {
          period: currentMessFee.period,
          amount: currentMessFee.feeAmount,
          dueDate: currentMessFee.dueDate
        } : null
      }
    });
  } catch (error) {
    console.error("Error fetching student payment details:", error);
    res.status(500).json({ message: "Error fetching payment details", error: error.message });
  }
};

// Process student payment
const processStudentPayment = async (req, res) => {
  try {
    const studentId = req.user.id; // From auth middleware
    const { amount, paymentMethod, transactionId, paymentType = "total", notes = "" } = req.body;

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    if (student.paymentStatus === "paid") {
      return res.status(400).json({ message: "Payment already completed" });
    }

    if (amount <= 0) {
      return res.status(400).json({ message: "Invalid payment amount" });
    }

    // Validate amount based on payment type
    let maxAmount;
    if (paymentType === "hostel") {
      maxAmount = student.hostelFeeAmount - student.hostelFeePaid;
    } else if (paymentType === "mess") {
      maxAmount = student.messFeeAmount - student.messFeePaid;
    } else {
      maxAmount = student.amountDue;
    }

    if (amount > maxAmount) {
      return res.status(400).json({ message: `Payment amount cannot exceed ₹${maxAmount} for ${paymentType} fee` });
    }

    // Update student payment details
    if (paymentType === "hostel") {
      student.hostelFeePaid += amount;
    } else if (paymentType === "mess") {
      student.messFeePaid += amount;
    } else {
      // For total, distribute proportionally or add to both
      // For simplicity, add to hostel first, then mess
      const remainingHostel = student.hostelFeeAmount - student.hostelFeePaid;
      if (amount <= remainingHostel) {
        student.hostelFeePaid += amount;
      } else {
        student.hostelFeePaid += remainingHostel;
        student.messFeePaid += amount - remainingHostel;
      }
    }
    
    student.amountPaid = student.hostelFeePaid + student.messFeePaid;
    student.amountDue = student.totalFeeAmount - student.amountPaid;

    if (student.amountDue <= 0) {
      student.paymentStatus = "paid";
    } else if (student.amountPaid > 0) {
      student.paymentStatus = "partial";
    }

    await student.save();

    // Create mess payment record for tracking
    const messPaymentData = {
      studentId,
      amount,
      paymentMethod,
      paymentStatus: student.paymentStatus === "paid" ? "paid" : "pending",
      paymentGateway: "manual",
      transactionId: transactionId || undefined,
      amountPaid: amount,
      amountDue: student.amountDue,
      paymentDate: new Date(),
      dueDate: student.paymentDueDate || new Date(),
      notes: notes || "",
      processedBy: null // Student self-payment
    };

    const messPayment = new MessPayment(messPaymentData);
    await messPayment.save();

    // Create transaction record
    const MessTransaction = require("../models/MessTransaction");
    const transactionRecord = new MessTransaction({
      transactionId: `TXN-${Date.now()}`,
      studentId,
      studentName: student.name,
      studentEmail: student.email,
      transactionType: "payment",
      amount,
      transactionDate: new Date(),
      paymentMethod,
      paymentGateway: "manual",
      gatewayTransactionId: transactionId || "",
      status: "success",
      description: `Student payment: Hostel + Mess fees`,
      processedBy: null,
      ipAddress: req.ip || ""
    });

    await transactionRecord.save();

    // Generate invoice automatically after payment
    if (student.paymentStatus === "paid") {
      await generateInvoiceAfterPayment(student, messPayment, req.user.id);
    }

    res.json({
      message: "Payment processed successfully",
      payment: {
        amount,
        totalPaid: student.amountPaid,
        remainingDue: student.amountDue,
        status: student.paymentStatus
      },
      transaction: transactionRecord
    });
  } catch (error) {
    console.error("Error processing student payment:", error);
    res.status(500).json({ message: "Error processing payment", error: error.message });
  }
};

// Update student payment details (admin only)
const updateStudentPaymentDetails = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { hostelFeeAmount, messFeeAmount, paymentDueDate, notes } = req.body;

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Update payment details
    if (hostelFeeAmount !== undefined) student.hostelFeeAmount = hostelFeeAmount;
    if (messFeeAmount !== undefined) student.messFeeAmount = messFeeAmount;
    if (paymentDueDate) student.paymentDueDate = new Date(paymentDueDate);

    // Recalculate total
    student.totalFeeAmount = student.hostelFeeAmount + student.messFeeAmount;
    student.amountDue = student.totalFeeAmount - student.amountPaid;

    // Update status based on payment
    if (student.amountDue <= 0) {
      student.paymentStatus = "paid";
    } else if (student.amountPaid > 0) {
      student.paymentStatus = "partial";
    } else {
      student.paymentStatus = "pending";
    }

    student.paymentAssignedDate = new Date();

    await student.save();

    res.json({
      message: "Student payment details updated successfully",
      student: {
        id: student._id,
        name: student.name,
        email: student.email,
        paymentStatus: student.paymentStatus,
        hostelFeeAmount: student.hostelFeeAmount,
        messFeeAmount: student.messFeeAmount,
        totalFeeAmount: student.totalFeeAmount,
        amountPaid: student.amountPaid,
        amountDue: student.amountDue,
        paymentDueDate: student.paymentDueDate
      }
    });
  } catch (error) {
    console.error("Error updating student payment details:", error);
    res.status(500).json({ message: "Error updating payment details", error: error.message });
  }
};

// Send payment details to student (admin only)
const sendPaymentDetails = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { hostelFeeAmount, messFeeAmount, paymentDueDate, notes } = req.body;

    // Validate required fields
    if (!hostelFeeAmount || !messFeeAmount || !paymentDueDate) {
      return res.status(400).json({ 
        message: "Missing required fields: hostelFeeAmount, messFeeAmount, paymentDueDate" 
      });
    }

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Check if payment details already sent
    if (student.paymentStatus !== "not_assigned") {
      return res.status(400).json({ 
        message: "Payment details already sent to this student" 
      });
    }

    // Update student with payment details
    student.hostelFeeAmount = hostelFeeAmount;
    student.messFeeAmount = messFeeAmount;
    student.hostelFeePaid = 0;
    student.messFeePaid = 0;
    student.totalFeeAmount = hostelFeeAmount + messFeeAmount;
    student.amountDue = student.totalFeeAmount;
    student.paymentStatus = "pending";
    student.paymentAssignedDate = new Date();
    student.paymentDueDate = new Date(paymentDueDate);

    await student.save();

    res.json({
      message: "Payment details sent to student successfully",
      student: {
        id: student._id,
        name: student.name,
        email: student.email,
        paymentStatus: student.paymentStatus,
        hostelFeeAmount: student.hostelFeeAmount,
        messFeeAmount: student.messFeeAmount,
        totalFeeAmount: student.totalFeeAmount,
        amountDue: student.amountDue,
        paymentDueDate: student.paymentDueDate,
        paymentAssignedDate: student.paymentAssignedDate
      }
    });
  } catch (error) {
    console.error("Error sending payment details:", error);
    res.status(500).json({ message: "Error sending payment details", error: error.message });
  }
};

// Helper function to generate invoice after payment
const generateInvoiceAfterPayment = async (student, messPayment, generatedBy) => {
  try {
    const Invoice = require("../models/Invoice");
    
    // Generate invoice number
    const year = new Date().getFullYear();
    const lastInvoice = await Invoice.findOne()
      .sort({ createdAt: -1 })
      .select("invoiceNumber");

    let number = 1;
    if (lastInvoice) {
      const lastNumber = parseInt(lastInvoice.invoiceNumber.split("-")[2]);
      number = lastNumber + 1;
    }

    const invoiceNumber = `INV-${year}-${String(number).padStart(6, "0")}`;

    const invoice = new Invoice({
      invoiceNumber,
      studentId: student._id,
      messPaymentIds: [messPayment._id],
      invoiceDate: new Date(),
      dueDate: student.paymentDueDate,
      subtotal: student.totalFeeAmount,
      tax: 0,
      discount: 0,
      lateFee: 0,
      totalAmount: student.totalFeeAmount,
      amountPaid: student.amountPaid,
      balanceDue: student.amountDue,
      invoiceStatus: "paid",
      paymentStatus: "paid",
      periodFrom: new Date(),
      periodTo: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      description: `Hostel and Mess fees for ${student.name}`,
      notes: "Auto-generated invoice after payment completion",
      generatedBy
    });

    await invoice.save();
    return invoice;
  } catch (error) {
    console.error("Error generating invoice:", error);
    throw error;
  }
};

// Get outstanding dues
const getOutstandingDues = async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;

    const skip = (page - 1) * limit;

    const payments = await MessPayment.find({
      paymentStatus: { $in: ["pending", "overdue"] },
      amountDue: { $gt: 0 }
    })
      .populate("studentId", "name email roomNumber")
      .populate("messFeeId", "period dueDate feeAmount")
      .sort({ messFeeId: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await MessPayment.countDocuments({
      paymentStatus: { $in: ["pending", "overdue"] },
      amountDue: { $gt: 0 }
    });

    // Calculate total outstanding
    const totalOutstanding = payments.reduce((sum, p) => sum + p.amountDue, 0);

    res.json({
      message: "Outstanding dues fetched",
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / limit),
      totalOutstanding,
      count: payments.length,
      payments
    });
  } catch (error) {
    console.error("Error fetching outstanding dues:", error);
    res.status(500).json({ message: "Error fetching outstanding dues", error: error.message });
  }
};

module.exports = {
  createPaymentRecord,
  getAllPayments,
  getPaymentById,
  updatePaymentStatus,
  getStudentPaymentHistory,
  getOutstandingDues,
  getStudentPaymentDetails,
  processStudentPayment,
  updateStudentPaymentDetails,
  sendPaymentDetails
};

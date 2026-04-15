const Invoice = require("../models/Invoice");
const MessPayment = require("../models/MessPayment");
const MessFee = require("../models/MessFee");
const Student = require("../models/Student");

// Generate invoice number
const generateInvoiceNumber = async () => {
  const year = new Date().getFullYear();
  const lastInvoice = await Invoice.findOne()
    .sort({ createdAt: -1 })
    .select("invoiceNumber");

  let number = 1;
  if (lastInvoice) {
    const lastNumber = parseInt(lastInvoice.invoiceNumber.split("-")[2]);
    number = lastNumber + 1;
  }

  return `INV-${year}-${String(number).padStart(6, "0")}`;
};

// Create invoice
const createInvoice = async (req, res) => {
  try {
    const {
      studentId,
      messPaymentIds,
      dueDate,
      subtotal,
      tax = 0,
      discount = 0,
      lateFee = 0,
      description,
      notes,
      periodFrom,
      periodTo
    } = req.body;

    // Validate student
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Validate payments
    const payments = await MessPayment.find({ _id: { $in: messPaymentIds } });
    if (payments.length !== messPaymentIds.length) {
      return res.status(400).json({ message: "One or more payments not found" });
    }

    // Calculate amounts
    const totalAmount = subtotal + tax + lateFee - discount;
    const amountPaid = payments.reduce((sum, p) => sum + p.amountPaid, 0);
    const balanceDue = totalAmount - amountPaid;

    // Determine status
    let invoiceStatus = "issued";
    let paymentStatus = "unpaid";

    if (amountPaid >= totalAmount) {
      invoiceStatus = "paid";
      paymentStatus = "paid";
    } else if (amountPaid > 0) {
      invoiceStatus = "partially_paid";
      paymentStatus = "partial";
    } else if (new Date(dueDate) < new Date()) {
      invoiceStatus = "overdue";
    }

    // Generate invoice number
    const invoiceNumber = await generateInvoiceNumber();

    const newInvoice = new Invoice({
      invoiceNumber,
      studentId,
      messPaymentIds,
      invoiceDate: new Date(),
      dueDate: new Date(dueDate),
      subtotal,
      tax,
      discount,
      lateFee,
      totalAmount,
      amountPaid,
      balanceDue,
      invoiceStatus,
      paymentStatus,
      periodFrom: new Date(periodFrom),
      periodTo: new Date(periodTo),
      description,
      notes,
      generatedBy: req.user.id
    });

    await newInvoice.save();

    res.status(201).json({
      message: "Invoice created successfully",
      invoice: newInvoice
    });
  } catch (error) {
    console.error("Error creating invoice:", error);
    res.status(500).json({ message: "Error creating invoice", error: error.message });
  }
};

// Get all invoices
const getAllInvoices = async (req, res) => {
  try {
    const { studentId, invoiceStatus, page = 1, limit = 50 } = req.query;

    const filter = {};
    if (studentId) filter.studentId = studentId;
    if (invoiceStatus) filter.invoiceStatus = invoiceStatus;

    const skip = (page - 1) * limit;

    const invoices = await Invoice.find(filter)
      .populate("studentId", "name email roomNumber")
      .populate("generatedBy", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Invoice.countDocuments(filter);

    res.json({
      message: "Invoices fetched",
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / limit),
      count: invoices.length,
      invoices
    });
  } catch (error) {
    console.error("Error fetching invoices:", error);
    res.status(500).json({ message: "Error fetching invoices", error: error.message });
  }
};

// Get invoice by ID
const getInvoiceById = async (req, res) => {
  try {
    const { id } = req.params;

    const invoice = await Invoice.findById(id)
      .populate("studentId")
      .populate("messPaymentIds")
      .populate("generatedBy", "name email");

    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    // Increment download count
    invoice.downloadCount += 1;
    invoice.lastDownloadedAt = new Date();
    await invoice.save();

    res.json({
      message: "Invoice fetched",
      invoice
    });
  } catch (error) {
    console.error("Error fetching invoice:", error);
    res.status(500).json({ message: "Error fetching invoice", error: error.message });
  }
};

// Update invoice
const updateInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    const { invoiceStatus, amountPaid, notes } = req.body;

    const invoice = await Invoice.findById(id);
    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    if (invoiceStatus) invoice.invoiceStatus = invoiceStatus;
    if (amountPaid !== undefined) {
      invoice.amountPaid = amountPaid;
      invoice.balanceDue = invoice.totalAmount - amountPaid;

      // Update status based on payment
      if (amountPaid >= invoice.totalAmount) {
        invoice.invoiceStatus = "paid";
        invoice.paymentStatus = "paid";
      } else if (amountPaid > 0) {
        invoice.invoiceStatus = "partially_paid";
        invoice.paymentStatus = "partial";
      }
    }
    if (notes !== undefined) invoice.notes = notes;

    await invoice.save();

    res.json({
      message: "Invoice updated successfully",
      invoice
    });
  } catch (error) {
    console.error("Error updating invoice:", error);
    res.status(500).json({ message: "Error updating invoice", error: error.message });
  }
};

// Get student invoices
const getStudentInvoices = async (req, res) => {
  try {
    const { studentId } = req.params;

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    const invoices = await Invoice.find({ studentId })
      .populate("messPaymentIds")
      .sort({ createdAt: -1 });

    // Calculate statistics
    const stats = {
      totalInvoices: invoices.length,
      totalAmount: invoices.reduce((sum, i) => sum + i.totalAmount, 0),
      amountPaid: invoices.reduce((sum, i) => sum + i.amountPaid, 0),
      balanceDue: invoices.reduce((sum, i) => sum + i.balanceDue, 0),
      paidCount: invoices.filter(i => i.invoiceStatus === "paid").length,
      pendingCount: invoices.filter(i => i.invoiceStatus === "issued" || i.invoiceStatus === "overdue").length,
      partialCount: invoices.filter(i => i.invoiceStatus === "partially_paid").length
    };

    res.json({
      message: "Student invoices fetched",
      studentName: student.name,
      studentEmail: student.email,
      stats,
      invoices
    });
  } catch (error) {
    console.error("Error fetching student invoices:", error);
    res.status(500).json({ message: "Error fetching student invoices", error: error.message });
  }
};

// Get student invoices (for student panel)
const getMyInvoices = async (req, res) => {
  try {
    const studentId = req.user.id; // From auth middleware

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    const invoices = await Invoice.find({ studentId })
      .populate("messPaymentIds")
      .sort({ createdAt: -1 });

    res.json({
      message: "Student invoices fetched",
      count: invoices.length,
      invoices
    });
  } catch (error) {
    console.error("Error fetching student invoices:", error);
    res.status(500).json({ message: "Error fetching invoices", error: error.message });
  }
};

// Send invoice reminder
const sendInvoiceReminder = async (req, res) => {
  try {
    const { id } = req.params;

    const invoice = await Invoice.findById(id);
    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    // Increment reminder count
    invoice.reminderCount += 1;
    invoice.lastReminderSent = new Date();
    await invoice.save();

    // TODO: Send email reminder using email service
    // await sendEmail(student.email, emailContent);

    res.json({
      message: "Reminder sent successfully",
      reminder: {
        invoiceId: invoice._id,
        reminderCount: invoice.reminderCount,
        lastReminderSent: invoice.lastReminderSent
      }
    });
  } catch (error) {
    console.error("Error sending reminder:", error);
    res.status(500).json({ message: "Error sending reminder", error: error.message });
  }
};

module.exports = {
  createInvoice,
  getAllInvoices,
  getInvoiceById,
  updateInvoice,
  getStudentInvoices,
  sendInvoiceReminder,
  getMyInvoices
};

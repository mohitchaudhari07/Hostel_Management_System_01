const express = require("express");
const router = express.Router();
const invoiceController = require("../controllers/invoiceController");
const { authenticate, authorize } = require("../middleware/auth");

// Create invoice (admin only)
router.post("/invoices", authenticate, authorize("admin"), invoiceController.createInvoice);

// Get all invoices (admin only)
router.get("/invoices", authenticate, authorize("admin"), invoiceController.getAllInvoices);

// Get invoice by ID - admin or student (own invoice)
router.get("/invoices/:id", authenticate, invoiceController.getInvoiceById);

// Update invoice (admin only)
router.put("/invoices/:id", authenticate, authorize("admin"), invoiceController.updateInvoice);

// Get student invoices - student can view own, admin can view any
router.get("/student/:studentId/invoices", authenticate, invoiceController.getStudentInvoices);

// Get my invoices (for student panel)
router.get("/student/invoices", authenticate, authorize("student"), invoiceController.getMyInvoices);

// Send invoice reminder (admin only)
router.post("/invoices/:id/send-reminder", authenticate, authorize("admin"), invoiceController.sendInvoiceReminder);

module.exports = router;

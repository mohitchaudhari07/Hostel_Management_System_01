const express = require("express");
const router = express.Router();
const complaintController = require("../controllers/complaintController");
const { authenticate, authorize } = require("../middleware/auth");

// Student Routes
router.post("/", authenticate, authorize("student"), complaintController.createComplaint);
router.get("/student", authenticate, authorize("student"), complaintController.getStudentComplaints);

// Admin Routes
router.get("/", authenticate, authorize("admin"), complaintController.getAllComplaints);
router.get("/unread-count", authenticate, authorize("admin"), complaintController.getUnreadComplaintsCount);
router.put("/:id/read", authenticate, authorize("admin"), complaintController.markComplaintAsRead);
router.put("/:id", authenticate, authorize("admin"), complaintController.updateComplaintStatus);

module.exports = router;

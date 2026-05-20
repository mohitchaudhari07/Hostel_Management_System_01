const express = require("express");
const router = express.Router();
const messController = require("../controllers/messController");
const { authenticate, authorize } = require("../middleware/auth");

// Middleware to ensure user is authenticated
// Assuming you have auth middleware configured

// Create new fee structure (admin only)
router.post("/fees", authenticate, authorize("admin"), messController.createMessFee);

// Get all fee structures (admin, mess staff)
router.get("/fees", authenticate, authorize("admin", "mess", "mess_staff"), messController.getAllMessFees);

// Get fee by ID (admin, mess staff)
router.get("/fees/:id", authenticate, authorize("admin", "mess", "mess_staff"), messController.getMessFeeById);

// Update fee structure (admin only)
router.put("/fees/:id", authenticate, authorize("admin"), messController.updateMessFee);

// Delete fee structure (admin only)
router.delete("/fees/:id", authenticate, authorize("admin"), messController.deleteMessFee);

// Get applicable fees for a student (students can view their own, admins can view all)
router.get("/student/:studentId/applicable-fees", authenticate, messController.getApplicableFeesForStudent);

// Weekly menu endpoints
router.post("/menus", authenticate, authorize("admin", "mess", "mess_staff"), messController.createWeeklyMenu);
router.get("/menus", authenticate, authorize("admin", "mess", "mess_staff", "student"), messController.getWeeklyMenus);
// Update weekly menu (admin, mess, mess_staff)
router.put("/menus/:id", authenticate, authorize("admin", "mess", "mess_staff"), messController.updateWeeklyMenu);
router.delete("/menus/:id", authenticate, authorize("admin"), messController.deleteWeeklyMenu);

// Feedback endpoints
router.post("/feedback", authenticate, messController.createFeedback);
router.get("/feedbacks", authenticate, authorize("admin", "mess", "mess_staff"), messController.getFeedbacks);

// Assign mess manager
router.post("/assign-manager/:userId", authenticate, authorize("admin"), messController.assignMessManager);

// Reports
router.get("/reports", authenticate, authorize("admin", "mess", "mess_staff"), messController.getReports);

// Mess Attendance endpoints
router.post("/attendance", authenticate, authorize("admin", "mess", "mess_staff"), messController.markMealAttendance);
router.get("/attendance", authenticate, authorize("admin", "mess", "mess_staff"), messController.getMealAttendance);
router.get("/attendance/summary", authenticate, authorize("admin", "mess", "mess_staff"), messController.getAttendanceSummary);

module.exports = router;

const express = require("express");
const router = express.Router();
const attendanceController = require("../controllers/attendanceController");
const { authenticate, authorize } = require("../middleware/auth");

// Face registration routes
router.post("/register-face", authenticate, authorize("admin"), attendanceController.registerFace);
router.post("/remove-face", authenticate, authorize("admin"), attendanceController.removeFace);
router.get("/face-registered", authenticate, authorize("admin"), attendanceController.getFaceRegisteredStudents);

// Face recognition and attendance routes
router.post("/recognize-face", authenticate, authorize("admin", "mess_staff"), attendanceController.recognizeFace);
router.get("/today", authenticate, authorize("admin", "mess_staff"), attendanceController.getTodayAttendance);
router.post("/mark-manual", authenticate, authorize("admin"), attendanceController.markAttendanceManual);
router.post("/mark-absent", authenticate, authorize("admin"), attendanceController.markAbsentStudents);

// Attendance reports and analytics
router.get("/report", authenticate, authorize("admin"), attendanceController.getAttendanceReport);
router.get("/analytics", authenticate, authorize("admin"), attendanceController.getAttendanceAnalytics);
router.get("/student/:studentId", authenticate, authorize("admin", "student"), attendanceController.getStudentAttendance);
router.get("/today-count", authenticate, authorize("admin", "mess", "mess_staff"), attendanceController.getTodayPresentCount);

module.exports = router;

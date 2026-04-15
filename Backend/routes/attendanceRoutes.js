const express = require("express");
const router = express.Router();
const attendanceController = require("../controllers/attendanceController");

// Face registration routes
router.post("/register-face", attendanceController.registerFace);
router.post("/remove-face", attendanceController.removeFace);
router.get("/face-registered", attendanceController.getFaceRegisteredStudents);

// Face recognition and attendance routes
router.post("/recognize-face", attendanceController.recognizeFace);
router.get("/today", attendanceController.getTodayAttendance);
router.post("/mark-manual", attendanceController.markAttendanceManual);
router.post("/mark-absent", attendanceController.markAbsentStudents);

// Attendance reports and analytics
router.get("/report", attendanceController.getAttendanceReport);
router.get("/analytics", attendanceController.getAttendanceAnalytics);
router.get("/student/:studentId", attendanceController.getStudentAttendance);
router.get("/today-count", attendanceController.getTodayPresentCount);

module.exports = router;

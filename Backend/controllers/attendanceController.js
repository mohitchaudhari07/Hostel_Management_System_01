const Attendance = require("../models/Attendance");
const Student = require("../models/Student");

// Helper function to calculate Euclidean distance between two descriptors
const calculateDistance = (descriptor1, descriptor2) => {
  if (!descriptor1 || !descriptor2 || descriptor1.length !== descriptor2.length) {
    return 1;
  }
  let sum = 0;
  for (let i = 0; i < descriptor1.length; i++) {
    const diff = descriptor1[i] - descriptor2[i];
    sum += diff * diff;
  }
  return Math.sqrt(sum);
};

// Register face for a student
exports.registerFace = async (req, res) => {
  try {
    const { studentId, faceDescriptor } = req.body;

    if (!studentId || !faceDescriptor || faceDescriptor.length !== 128) {
      return res.status(400).json({
        message: "Invalid face descriptor. Please provide a valid 128-dimensional face descriptor.",
      });
    }

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Save face descriptor
    student.faceDescriptor = faceDescriptor;
    student.faceRegistered = true;
    student.faceRegisteredDate = new Date();
    await student.save();

    res.json({
      success: true,
      message: `Face registered successfully for ${student.name}!`,
    });
  } catch (error) {
    console.error("Error registering face:", error);
    res.status(500).json({ message: "Error registering face" });
  }
};

// Remove face registration
exports.removeFace = async (req, res) => {
  try {
    const { studentId } = req.body;

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    student.faceDescriptor = null;
    student.faceRegistered = false;
    student.faceRegisteredDate = null;
    await student.save();

    res.json({
      success: true,
      message: "Face registration removed successfully",
    });
  } catch (error) {
    console.error("Error removing face:", error);
    res.status(500).json({ message: "Error removing face registration" });
  }
};

// Get all face-registered students
exports.getFaceRegisteredStudents = async (req, res) => {
  try {
    const students = await Student.find({ faceRegistered: true }).select(
      "name email phone faceRegisteredDate"
    );
    res.json(students);
  } catch (error) {
    console.error("Error fetching registered students:", error);
    res.status(500).json({ message: "Error fetching registered students" });
  }
};

// Recognize face and mark attendance
exports.recognizeFace = async (req, res) => {
  try {
    const { faceDescriptor } = req.body;

    if (!faceDescriptor || faceDescriptor.length !== 128) {
      return res.status(400).json({
        message: "Invalid face descriptor",
      });
    }

    // Get all registered students
    const registeredStudents = await Student.find({ faceRegistered: true });

    if (registeredStudents.length === 0) {
      return res.status(404).json({
        message: "No registered faces in the system",
      });
    }

    // Find the best match
    let bestMatch = null;
    let bestDistance = 0.6; // Threshold for face recognition (lower is better, 0-1)

    for (const student of registeredStudents) {
      const distance = calculateDistance(faceDescriptor, student.faceDescriptor);

      if (distance < bestDistance) {
        bestDistance = distance;
        bestMatch = student;
      }
    }

    if (!bestMatch) {
      return res.status(404).json({
        success: false,
        message: "Face not recognized. Please try again with a clear face.",
      });
    }

    // Check if already marked attendance for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let attendance = await Attendance.findOne({
      studentId: bestMatch._id,
      date: today,
    });

    const now = new Date();
    let action = "";
    let message = "";

    if (!attendance) {
      // First detection of the day - Check-In
      attendance = new Attendance({
        studentId: bestMatch._id,
        checkInTime: now,
        status: "Present",
        checkInDistance: bestDistance,
        method: "Face Recognition",
      });
      action = "check-in";
      message = `Check-in successful! Welcome ${bestMatch.name}`;
    } else if (!attendance.checkOutTime) {
      // Second detection of the day - Check-Out
      // Check if enough time has passed since check-in (at least 1 minute)
      const timeSinceCheckIn = (now - attendance.checkInTime) / (1000 * 60); // minutes

      if (timeSinceCheckIn < 1) {
        return res.status(400).json({
          success: false,
          message: "Please wait at least 1 minute before check-out.",
        });
      }

      attendance.checkOutTime = now;
      attendance.checkOutDistance = bestDistance;
      attendance.duration = Math.round(timeSinceCheckIn);

      // Update status based on duration
      if (attendance.duration >= 480) { // 8 hours
        attendance.status = "Present";
      } else if (attendance.duration >= 240) { // 4 hours
        attendance.status = "Partial";
      }

      action = "check-out";
      message = `Check-out successful! Duration: ${attendance.duration} minutes`;
    } else {
      // Already checked out - prevent duplicate
      return res.status(400).json({
        success: false,
        message: "Already checked out for today. See you tomorrow!",
      });
    }

    await attendance.save();

    res.json({
      success: true,
      action: action,
      student: {
        id: bestMatch._id,
        name: bestMatch.name,
        email: bestMatch.email,
      },
      attendance: {
        checkInTime: attendance.checkInTime,
        checkOutTime: attendance.checkOutTime,
        duration: attendance.duration,
        status: attendance.status,
      },
      message: message,
    });
  } catch (error) {
    console.error("Error recognizing face:", error);
    res.status(500).json({ message: "Error processing attendance" });
  }
};

// Get today's attendance
exports.getTodayAttendance = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await Attendance.find({
      date: today,
    }).populate("studentId", "name email phone");

    // Get all students count
    const allStudents = await Student.countDocuments({ faceRegistered: true });

    // Calculate statistics
    const presentCount = attendance.length;
    const absentCount = Math.max(0, allStudents - presentCount);

    res.json({
      attendance: attendance.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)),
      stats: {
        total: allStudents,
        present: presentCount,
        absent: absentCount,
      },
    });
  } catch (error) {
    console.error("Error fetching today's attendance:", error);
    res.status(500).json({ message: "Error fetching attendance" });
  }
};

// Mark attendance manually
exports.markAttendanceManual = async (req, res) => {
  try {
    const { studentId, status, date, notes } = req.body;

    if (!studentId || !status) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    const attendanceDate = date ? new Date(date) : new Date();
    attendanceDate.setHours(0, 0, 0, 0);

    let attendance = await Attendance.findOne({
      studentId,
      date: attendanceDate,
    });

    if (attendance) {
      attendance.status = status;
      attendance.notes = notes || "";
      attendance.method = "Manual";
    } else {
      attendance = new Attendance({
        studentId,
        status,
        date: attendanceDate,
        method: "Manual",
        notes: notes || "",
      });
    }

    await attendance.save();

    res.json({
      success: true,
      message: `Attendance marked as ${status} for ${student.name}`,
    });
  } catch (error) {
    console.error("Error marking attendance:", error);
    res.status(500).json({ message: "Error marking attendance" });
  }
};

// Get attendance report for a date range
exports.getAttendanceReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        message: "Missing startDate or endDate",
      });
    }

    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);

    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const attendance = await Attendance.find({
      date: { $gte: start, $lte: end },
    }).populate("studentId", "name email");

    // Group by student
    const report = {};
    attendance.forEach((record) => {
      const studentId = record.studentId._id.toString();
      if (!report[studentId]) {
        report[studentId] = {
          student: record.studentId,
          total: 0,
          present: 0,
          absent: 0,
          records: [],
        };
      }
      report[studentId].total++;
      if (record.status === "Present") {
        report[studentId].present++;
      } else {
        report[studentId].absent++;
      }
      report[studentId].records.push(record);
    });

    const reportArray = Object.values(report);

    res.json({
      startDate,
      endDate,
      report: reportArray,
      summary: {
        totalStudents: reportArray.length,
        totalRecords: attendance.length,
      },
    });
  } catch (error) {
    console.error("Error generating report:", error);
    res.status(500).json({ message: "Error generating attendance report" });
  }
};

// Get attendance for a specific student
exports.getStudentAttendance = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { month, year } = req.query;

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    let query = { studentId };

    if (month && year) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);
      query.date = { $gte: startDate, $lte: endDate };
    }

    const attendance = await Attendance.find(query).sort({ date: -1 });

    const stats = {
      total: attendance.length,
      present: attendance.filter((a) => a.status === "Present").length,
      absent: attendance.filter((a) => a.status === "Absent").length,
      partial: attendance.filter((a) => a.status === "Partial").length,
    };

    // Calculate attendance percentage
    const totalDays = stats.total;
    const presentDays = stats.present + (stats.partial * 0.5); // Partial counts as half
    const percentage = totalDays > 0 ? ((presentDays / totalDays) * 100).toFixed(1) : 0;

    res.json({
      student: {
        id: student._id,
        name: student.name,
        email: student.email,
      },
      attendance,
      stats: {
        ...stats,
        percentage: parseFloat(percentage),
      },
    });
  } catch (error) {
    console.error("Error fetching student attendance:", error);
    res.status(500).json({ message: "Error fetching attendance" });
  }
};

// Auto-mark absent students for today
exports.markAbsentStudents = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get all face-registered students
    const registeredStudents = await Student.find({ faceRegistered: true });

    // Get students who already have attendance marked today
    const existingAttendance = await Attendance.find({ date: today });
    const markedStudentIds = existingAttendance.map(a => a.studentId.toString());

    // Find students who haven't checked in today
    const absentStudents = registeredStudents.filter(
      student => !markedStudentIds.includes(student._id.toString())
    );

    // Mark them as absent
    const absentRecords = [];
    for (const student of absentStudents) {
      const attendance = new Attendance({
        studentId: student._id,
        status: "Absent",
        method: "Auto",
        notes: "Auto-marked as absent (no check-in)",
      });
      await attendance.save();
      absentRecords.push(attendance);
    }

    res.json({
      success: true,
      message: `Marked ${absentRecords.length} students as absent`,
      absentCount: absentRecords.length,
    });
  } catch (error) {
    console.error("Error marking absent students:", error);
    res.status(500).json({ message: "Error marking absent students" });
  }
};

// Get attendance analytics
exports.getAttendanceAnalytics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
    const end = endDate ? new Date(endDate) : new Date();

    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    const attendance = await Attendance.find({
      date: { $gte: start, $lte: end },
    }).populate("studentId", "name email");

    // Calculate daily statistics
    const dailyStats = {};
    const studentStats = {};

    attendance.forEach((record) => {
      const dateKey = record.date.toISOString().split('T')[0];
      const studentId = record.studentId._id.toString();

      // Daily stats
      if (!dailyStats[dateKey]) {
        dailyStats[dateKey] = { present: 0, absent: 0, partial: 0, total: 0 };
      }
      dailyStats[dateKey].total++;
      if (record.status === "Present") dailyStats[dateKey].present++;
      else if (record.status === "Absent") dailyStats[dateKey].absent++;
      else if (record.status === "Partial") dailyStats[dateKey].partial++;

      // Student stats
      if (!studentStats[studentId]) {
        studentStats[studentId] = {
          student: record.studentId,
          total: 0,
          present: 0,
          absent: 0,
          partial: 0,
        };
      }
      studentStats[studentId].total++;
      if (record.status === "Present") studentStats[studentId].present++;
      else if (record.status === "Absent") studentStats[studentId].absent++;
      else if (record.status === "Partial") studentStats[studentId].partial++;
    });

    // Calculate percentages
    Object.keys(studentStats).forEach(studentId => {
      const stats = studentStats[studentId];
      const presentDays = stats.present + (stats.partial * 0.5);
      stats.percentage = stats.total > 0 ? ((presentDays / stats.total) * 100).toFixed(1) : 0;
    });

    const analytics = {
      dailyStats: Object.keys(dailyStats).sort().map(date => ({
        date,
        ...dailyStats[date],
      })),
      studentStats: Object.values(studentStats).sort((a, b) => b.percentage - a.percentage),
      summary: {
        totalDays: Object.keys(dailyStats).length,
        totalStudents: Object.keys(studentStats).length,
        averageAttendance: Object.values(studentStats).reduce((sum, s) => sum + parseFloat(s.percentage), 0) / Object.keys(studentStats).length,
      },
    };

    res.json(analytics);
  } catch (error) {
    console.error("Error generating analytics:", error);
    res.status(500).json({ message: "Error generating attendance analytics" });
  }
};

// Get count of present students for today (for Mess Dashboard)
exports.getTodayPresentCount = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Count students with Present or Partial status for today
    const presentCount = await Attendance.countDocuments({
      date: {
        $gte: today,
        $lt: tomorrow
      },
      status: { $in: ["Present", "Partial"] }
    });

    res.json({
      presentCount: presentCount,
      date: today.toISOString().split('T')[0],
      timestamp: new Date()
    });
  } catch (error) {
    console.error("Error fetching today's present count:", error);
    res.status(500).json({ message: "Error fetching present student count" });
  }
};

const mongoose = require("mongoose");
require("dotenv").config();

// Models
const Student = require("./models/Student");
const Attendance = require("./models/Attendance");

async function seedAttendanceData() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB Connected");

    // Get existing students
    const students = await Student.find().limit(5);
    
    if (students.length === 0) {
      console.log("❌ No students found. Please run seed-students.js first.");
      process.exit(1);
    }

    console.log(`📚 Found ${students.length} students. Creating attendance records...`);

    // Clear existing attendance
    await Attendance.deleteMany({});
    console.log("🗑️  Cleared existing attendance records");

    // Create attendance records for last 30 days
    const attendanceRecords = [];
    const today = new Date();

    for (let dayOffset = 30; dayOffset >= 0; dayOffset--) {
      const currentDate = new Date(today);
      currentDate.setDate(currentDate.getDate() - dayOffset);
      currentDate.setHours(0, 0, 0, 0);

      // Skip weekends
      const dayOfWeek = currentDate.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) continue; // Skip Sunday and Saturday

      // Create attendance for each student
      for (const student of students) {
        // 90% attendance rate (some students miss days)
        const isPresent = Math.random() < 0.9;

        if (isPresent) {
          const timestamp = new Date(currentDate);
          // Random time between 7 AM and 9 AM
          const hour = 7 + Math.floor(Math.random() * 2);
          const minute = Math.floor(Math.random() * 60);
          timestamp.setHours(hour, minute, 0);

          attendanceRecords.push({
            studentId: student._id,
            date: currentDate,
            timestamp: timestamp,
            status: "Present",
            matchDistance: Math.random() * 0.4, // 0-0.4 distance (good matches)
            method: "Face Recognition",
            notes: `Face recognized with confidence ${(100 - Math.random() * 20).toFixed(1)}%`,
          });
        } else {
          // Create absent record
          attendanceRecords.push({
            studentId: student._id,
            date: currentDate,
            status: "Absent",
            method: "Manual",
            notes: "Not marked",
          });
        }
      }
    }

    // Insert attendance records
    await Attendance.insertMany(attendanceRecords);
    console.log(`✅ Created ${attendanceRecords.length} attendance records`);

    // Generate statistics
    const stats = await Attendance.aggregate([
      {
        $group: {
          _id: "$studentId",
          total: { $sum: 1 },
          present: {
            $sum: {
              $cond: [{ $eq: ["$status", "Present"] }, 1, 0],
            },
          },
          absent: {
            $sum: {
              $cond: [{ $eq: ["$status", "Absent"] }, 1, 0],
            },
          },
        },
      },
      {
        $project: {
          _id: 1,
          total: 1,
          present: 1,
          absent: 1,
          percentage: {
            $multiply: [
              { $divide: ["$present", "$total"] },
              100,
            ],
          },
        },
      },
    ]);

    console.log("\n📊 Attendance Statistics:");
    console.log("═══════════════════════════════════════════════");

    for (const stat of stats) {
      const student = students.find(s => s._id.toString() === stat._id.toString());
      console.log(`\n👤 ${student.name}`);
      console.log(`   Total Days: ${stat.total}`);
      console.log(`   ✅ Present: ${stat.present}`);
      console.log(`   ❌ Absent: ${stat.absent}`);
      console.log(`   📈 Attendance: ${stat.percentage.toFixed(2)}%`);
    }

    console.log("\n═══════════════════════════════════════════════");
    console.log("✅ Attendance seeding completed successfully!");

    await mongoose.connection.close();
    console.log("🔌 MongoDB connection closed");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

// Run seed function
seedAttendanceData();

const cron = require('node-cron');
const Attendance = require('./models/Attendance');
const Student = require('./models/Student');

// Schedule job to run every day at 11:59 PM (23:59)
cron.schedule('59 23 * * *', async () => {
  console.log('Running daily absent marking job...');

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Find all students
    const students = await Student.find({ isRoomAssigned: true });

    for (const student of students) {
      // Check if student already has attendance record for today
      const existingAttendance = await Attendance.findOne({
        student: student._id,
        date: {
          $gte: today,
          $lt: tomorrow
        }
      });

      // If no attendance record exists, mark as absent
      if (!existingAttendance) {
        const absentRecord = new Attendance({
          student: student._id,
          date: today,
          status: 'Absent',
          method: 'Auto',
          timestamp: new Date()
        });

        await absentRecord.save();
        console.log(`Marked student ${student.name} (${student.email}) as absent for ${today.toDateString()}`);
      }
    }

    console.log('Daily absent marking job completed successfully');
  } catch (error) {
    console.error('Error in daily absent marking job:', error);
  }
}, {
  timezone: "Asia/Kolkata" // Adjust timezone as needed
});

console.log('Absent marking cron job scheduled - runs daily at 11:59 PM');

module.exports = cron;
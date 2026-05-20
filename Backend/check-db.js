/**
 * Quick script to check users in database
 */
const mongoose = require("mongoose");
require("dotenv").config();

const User = require("./models/User");

async function checkDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB\n");

    const totalUsers = await User.countDocuments();
    const adminCount = await User.countDocuments({ role: "admin" });
    const studentCount = await User.countDocuments({ role: "student" });

    console.log("📊 Database Summary:");
    console.log(`   Total users: ${totalUsers}`);
    console.log(`   Admins: ${adminCount}`);
    console.log(`   Students: ${studentCount}\n`);

    console.log("👥 All users:");
    const users = await User.find({})
      .select("-password")
      .sort({ createdAt: -1 });
    if (users.length === 0) {
      console.log("   (empty database)");
    } else {
      users.forEach((u, i) => {
        console.log(`   ${i + 1}. ${u.name} (${u.email}) - ${u.role}`);
      });
    }

    await mongoose.disconnect();
    console.log("\n✅ Done");
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

checkDB();

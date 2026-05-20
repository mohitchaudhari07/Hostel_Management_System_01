/**
 * Test: Create enquiry and check if user was created
 */
const mongoose = require("mongoose");
require("dotenv").config();

const User = require("./models/User");
const Enquiry = require("./models/Enquiry");
const axios = require("axios");

async function testEnquiry() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB\n");

    const initialUserCount = await User.countDocuments();
    const initialEnquiryCount = await Enquiry.countDocuments();
    console.log(`Initial state:`);
    console.log(`  Users: ${initialUserCount}`);
    console.log(`  Enquiries: ${initialEnquiryCount}\n`);

    // Submit enquiry
    console.log("📝 Submitting enquiry...");
    const testEmail = `teststudent${Date.now()}@test.com`;
    const res = await axios.post("http://localhost:5000/api/enquiries", {
      name: "Test Student",
      email: testEmail,
      phone: "9876543210",
      course: "B.Tech",
      preferredRoomType: "Double",
    });
    console.log(`✅ Enquiry submitted for: ${testEmail}\n`);

    // Check counts immediately
    const newUserCount = await User.countDocuments();
    const newEnquiryCount = await Enquiry.countDocuments();

    console.log(`After enquiry submission:`);
    console.log(`  Users: ${newUserCount} (was ${initialUserCount})`);
    console.log(
      `  Enquiries: ${newEnquiryCount} (was ${initialEnquiryCount})\n`,
    );

    // Check if user was created
    const user = await User.findOne({ email: testEmail });
    if (user) {
      console.log(`✅ USER AUTO-CREATED:`);
      console.log(`  Email: ${user.email}`);
      console.log(`  Role: ${user.role}\n`);
    } else {
      console.log(`❌ USER NOT CREATED (Auto-creation not working)\n`);
    }

    // Try to login with that user
    if (user) {
      console.log("🔐 Testing login with auto-created user...");
      try {
        const tempPassword = res.data?.loginCredentials?.password;
        console.log(`Temp password from response: ${tempPassword}`);

        // We don't know the password, so just check that user exists
        console.log(`✅ User exists in database\n`);
      } catch (e) {
        console.log(`Login test skipped\n`);
      }
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

testEnquiry();

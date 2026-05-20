/**
 * Test student enquiry to see full response
 */
const axios = require("axios");

const BASE_URL = "http://localhost:5000/api";
const TEST_STUDENT = {
  name: "Test Student",
  email: `teststudent${Date.now()}@test.com`,
  phone: "9876543210",
  course: "B.Tech",
  preferredRoomType: "Double",
};

async function testEnquiry() {
  try {
    console.log("\n📝 Testing Student Enquiry...\n");
    const res = await axios.post(`${BASE_URL}/enquiries`, TEST_STUDENT);

    console.log("✅ Enquiry created successfully!\n");
    console.log("Response Body:");
    console.log(JSON.stringify(res.data, null, 2));
  } catch (error) {
    console.error("❌ Error:", error.response?.data || error.message);
  }
}

testEnquiry();

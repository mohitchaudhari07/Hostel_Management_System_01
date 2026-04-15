const axios = require("axios");

const testLogin = async () => {
  try {
    const response = await axios.post("http://localhost:5000/api/auth/login", {
      email: "admin@example.com",
      password: "admin123"
    });
    console.log("Login successful:", response.data);
  } catch (error) {
    console.log("Login failed:", error.response?.data || error.message);
  }
};

testLogin();
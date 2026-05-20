const mongoose = require("mongoose");
const User = require("./models/User");

mongoose.connect("mongodb://localhost:27017/Hostel_Management")
  .then(async () => {
    // Update the user to admin
    await User.updateMany({}, { $set: { role: "admin" } });
    console.log("Updated all users to admin role.");
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });

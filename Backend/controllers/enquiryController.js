const User = require("../models/User");
const Student = require("../models/Student");
const Enquiry = require("../models/Enquiry");
const bcrypt = require("bcryptjs");

// CREATE ENQUIRY
const createEnquiry = async (req, res) => {
  try {
    const enquiry = await Enquiry.create({
      ...req.body,
      status: "New"
    });

    res.status(201).json(enquiry);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET ALL
const getAllEnquiries = async (req, res) => {
  try {
    const enquiries = await Enquiry.find().sort({ createdAt: -1 });
    res.json(enquiries);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// UPDATE STATUS / NOTES
const updateEnquiry = async (req, res) => {
  try {
    const enquiry = await Enquiry.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.json(enquiry);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 🔥 CONVERT TO STUDENT
const convertToStudent = async (req, res) => {
  try {
    const enquiry = await Enquiry.findById(req.params.id);

    if (!enquiry) {
      return res.status(404).json({ message: "Enquiry not found" });
    }

    // generate password
    const rawPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(rawPassword, 10);

    console.log("Creating student with email:", enquiry.email);
    
    // Check if user already exists
    const existingUser = await User.findOne({ email: enquiry.email });
    const existingStudent = await Student.findOne({ email: enquiry.email });
    if (existingUser || existingStudent) {
      return res.status(400).json({ message: "User with this email already exists" });
    }

    // Create student WITHOUT payment details (will be sent separately by admin)
    const student = await Student.create({
      name: enquiry.name,
      phone: enquiry.phone,
      email: enquiry.email,
      course: enquiry.course,
      roomType: enquiry.preferredRoomType,
      password: hashedPassword,
      role: "student",
      paymentStatus: "not_assigned", // Payment details not yet sent
      hostelFeeAmount: 0,
      messFeeAmount: 0,
      totalFeeAmount: 0,
      amountDue: 0,
      paymentAssignedDate: null,
      paymentDueDate: null
    });

    // Also create a User record for authentication
    const user = await User.create({
      name: enquiry.name,
      email: enquiry.email,
      password: hashedPassword,
      role: "student"
    });

    enquiry.status = "Joined";
    await enquiry.save();

    res.json({
      message: "Student created successfully. Payment details need to be sent separately.",
      student: {
        id: student._id,
        name: student.name,
        email: student.email,
        roomType: student.roomType,
        paymentStatus: student.paymentStatus
      },
      loginCredentials: {
        email: student.email,
        password: rawPassword
      },
      nextStep: "Admin needs to send payment details using /api/payments/student/:studentId/send-payment-details"
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE ENQUIRY
const deleteEnquiry = async (req, res) => {
  try {
    const enquiry = await Enquiry.findByIdAndDelete(req.params.id);

    if (!enquiry) {
      return res.status(404).json({ message: "Enquiry not found" });
    }

    res.json({ message: "Enquiry deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createEnquiry,
  getAllEnquiries,
  updateEnquiry,
  convertToStudent,
  deleteEnquiry
};

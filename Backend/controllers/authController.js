const User = require("../models/User");
const Student = require("../models/Student");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
require("dotenv").config();

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";

const buildUserPayload = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
});

const loginUser = async (req, res) => {
  try {
    const { email, password, loginType } = req.body;

    console.log(`[LOGIN ATTEMPT] Email: ${email}, Type: ${loginType}`);

    const user = await User.findOne({ email });

    if (!user) {
      console.log(`[LOGIN FAILED] User not found: ${email}`);
      return res.status(400).json({ message: "Invalid email" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      console.log(`[LOGIN FAILED] Invalid password for: ${email}`);
      return res.status(400).json({ message: "Invalid password" });
    }

    // Validate login type matches user role
    if (loginType === "admin" && user.role !== "admin") {
      console.log(
        `[LOGIN FAILED] User role mismatch for ${email}. Expected admin, got ${user.role}`,
      );
      return res
        .status(403)
        .json({ message: "Access denied. Admin credentials required." });
    }

    if (
      loginType === "student" &&
      !["student", "mess", "mess_staff"].includes(user.role)
    ) {
      console.log(
        `[LOGIN FAILED] User role mismatch for ${email}. Expected student/mess/mess_staff, got ${user.role}`,
      );
      return res
        .status(403)
        .json({ message: "Access denied. Student credentials required." });
    }

    const userPayload = buildUserPayload(user);
    const token = jwt.sign(userPayload, JWT_SECRET, { expiresIn: "1d" });

    // COOKIE SETUP HERE
    res.cookie("token", token, {
      httpOnly: true,
      secure: false, // true in production with HTTPS
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    console.log(`[LOGIN SUCCESS] ${email} logged in as ${user.role}`);
    res.json({
      message: "Login successful",
      token,
      user: userPayload,
    });
  } catch (error) {
    console.error("[LOGIN ERROR]", error);
    res.status(500).json({ message: "Server error" });
  }
};

const createUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    console.log(`[CREATE USER] Attempt: Email: ${email}, Role: ${role}`);

    if (!name || !email || !password || !role) {
      console.log(`[CREATE USER FAILED] Missing required fields`);
      return res.status(400).json({ message: "Missing required fields" });
    }

    const adminCount = await User.countDocuments({ role: "admin" });
    const isFirstAdmin = adminCount === 0 && role === "admin";

    console.log(
      `[CREATE USER] Total admins in DB: ${adminCount}, IsFirstAdmin: ${isFirstAdmin}`,
    );

    if (!isFirstAdmin && req.user?.role !== "admin") {
      console.log(
        `[CREATE USER FAILED] Authorization denied for ${email}. User role: ${req.user?.role}`,
      );
      return res.status(403).json({ message: "Only admins can create users" });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log(`[CREATE USER FAILED] User already exists: ${email}`);
      return res
        .status(400)
        .json({ message: "User with this email already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = new User({
      name,
      email,
      password: hashedPassword,
      role,
    });

    await user.save();

    const userPayload = buildUserPayload(user);
    const token = isFirstAdmin
      ? jwt.sign(userPayload, JWT_SECRET, { expiresIn: "1d" })
      : null;

    console.log(
      `[CREATE USER SUCCESS] Email: ${email}, Role: ${role}, IsFirstAdmin: ${isFirstAdmin}`,
    );
    res.json({
      message: "User created successfully",
      token,
      user: userPayload,
    });
  } catch (error) {
    console.error("[CREATE USER ERROR]", error);
    res.status(500).json({ message: "Server error" });
  }
};

const getUsers = async (req, res) => {
  try {
    const users = await User.find({})
      .select("-password")
      .sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
      return res
        .status(400)
        .json({ message: "Email and new password are required" });
    }

    if (typeof newPassword !== "string" || newPassword.trim().length < 6) {
      return res
        .status(400)
        .json({ message: "New password must be at least 6 characters" });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res.json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("[RESET PASSWORD ERROR]", error);
    res.status(500).json({ message: "Server error" });
  }
};

const getStudents = async (req, res) => {
  try {
    const students = await Student.find({})
      .select("-password")
      .sort({ createdAt: -1 });
    res.json(students);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

const getCurrentStudent = async (req, res) => {
  try {
    // req.user is set by authenticate middleware
    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Try to find additional student details if they exist
    const student = await Student.findOne({ email: user.email }).select(
      "-password",
    );

    if (!student) {
      return res.json({ ...user.toObject() });
    }

    res.json({
      ...user.toObject(),
      ...student.toObject(),
      studentId: student._id,
      additionalDetails: student,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  loginUser,
  createUser,
  getUsers,
  resetPassword,
  getStudents,
  getCurrentStudent,
};

const User = require("../models/User");
const Student = require("../models/Student");
const Enquiry = require("../models/Enquiry");
const bcrypt = require("bcryptjs");
const sendEmail = require("../utils/sendEmail");

// CREATE ENQUIRY
const createEnquiry = async (req, res) => {
  try {
    const { name, email, phone, course, preferredRoomType } = req.body;

    // Validate required fields
    if (!name || !email || !phone || !course || !preferredRoomType) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "This email is already registered" });
    }

    // Generate temporary password
    const tempPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    // Auto-create User account for login
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: "student",
    });

    // Create enquiry record
    const enquiry = await Enquiry.create({
      name,
      email,
      phone,
      course,
      preferredRoomType,
      status: "New",
    });

    // Send email with login credentials
    const emailMessage = `
      <h2>Welcome to Smart Hostel Management!</h2>
      <p>Dear ${name},</p>
      <p>Thank you for your enquiry! Your application has been received and a temporary account has been created for you.</p>
      <p><strong>You can now login to the system with these credentials:</strong></p>
      <div style="background-color: #f4f4f4; padding: 15px; border-radius: 5px; margin: 15px 0;">
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Temporary Password:</strong> ${tempPassword}</p>
        <p><strong>Login URL:</strong> https://yourdomain.com/login</p>
      </div>
      <p><strong style="color: #d32f2f;">Important:</strong> Please change your password immediately after logging in.</p>
      <p>The admin team will review your application and contact you shortly regarding room availability and further details.</p>
      <p>Best Regards,<br/><strong>Smart Hostel Management Team</strong></p>
    `;

    await sendEmail({
      email,
      subject: "Welcome to Smart Hostel - Your Login Credentials",
      html: emailMessage,
    });

    res.status(201).json({
      message:
        "Enquiry submitted successfully! Check your email for login credentials.",
      enquiry: {
        id: enquiry._id,
        name: enquiry.name,
        email: enquiry.email,
        status: enquiry.status,
      },
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
      },
    });
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
    const enquiry = await Enquiry.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });

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

    console.log("Converting enquiry to student for email:", enquiry.email);

    const existingUser = await User.findOne({ email: enquiry.email });
    const existingStudent = await Student.findOne({ email: enquiry.email });

    if (existingStudent) {
      if (enquiry.status !== "Joined") {
        enquiry.status = "Joined";
        await enquiry.save();
      }

      return res.json({
        message:
          "Student record already exists for this enquiry. Conversion completed.",
        student: existingStudent,
        userAlreadyExists: !!existingUser,
      });
    }

    let user = existingUser;
    let studentPasswordHash = hashedPassword;
    let rawPasswordToSend = rawPassword;
    let passwordMessage =
      "A login account already exists for this email. Use the existing credentials or reset the password if needed.";

    if (!existingUser) {
      user = await User.create({
        name: enquiry.name,
        email: enquiry.email,
        password: hashedPassword,
        role: "student",
      });
      passwordMessage =
        "A new student login account was created and credentials are included.";
    } else {
      studentPasswordHash = existingUser.password;
      rawPasswordToSend = null;
    }

    const student = await Student.create({
      name: enquiry.name,
      phone: enquiry.phone,
      email: enquiry.email,
      course: enquiry.course,
      roomType: enquiry.preferredRoomType,
      password: studentPasswordHash,
      role: "student",
      paymentStatus: "not_assigned", // Payment details not yet sent
      hostelFeeAmount: 0,
      messFeeAmount: 0,
      totalFeeAmount: 0,
      amountDue: 0,
      paymentAssignedDate: null,
      paymentDueDate: null,
    });

    enquiry.status = "Joined";
    await enquiry.save();

    const emailMessage = existingUser
      ? `
      <h2>Welcome to Smart Hostel, ${student.name}!</h2>
      <p>Your admission enquiry has been approved by the admin. You are now officially registered as a student in our system.</p>
      <p>Your login account already exists with this email. Please use the credentials that were sent to you when the enquiry was submitted.</p>
      <p>We will send you your payment details shortly.</p>
      <br/>
      <p>Best Regards,</p>
      <p><strong>Smart Hostel Management Team</strong></p>
    `
      : `
      <h2>Welcome to Smart Hostel, ${student.name}!</h2>
      <p>Your admission enquiry has been approved by the admin. You are now officially registered as a student in our system.</p>
      <p>You can access the student portal using the following credentials:</p>
      <div style="background-color: #f4f4f4; padding: 15px; border-radius: 5px; margin: 15px 0;">
        <p><strong>User ID (Email):</strong> ${student.email}</p>
        <p><strong>Password:</strong> ${rawPasswordToSend}</p>
      </div>
      <p>Please log in and change your password as soon as possible.</p>
      <p>We will send you your payment details shortly.</p>
      <br/>
      <p>Best Regards,</p>
      <p><strong>Smart Hostel Management Team</strong></p>
    `;

    await sendEmail({
      email: student.email,
      subject: "Hostel Admission Approved - Login Credentials",
      html: emailMessage,
    });

    const responsePayload = {
      message:
        "Student created successfully. Payment details need to be sent separately.",
      student: {
        id: student._id,
        name: student.name,
        email: student.email,
        roomType: student.roomType,
        paymentStatus: student.paymentStatus,
      },
      nextStep:
        "Admin needs to send payment details using /api/payments/student/:studentId/send-payment-details",
    };

    if (!existingUser && rawPasswordToSend) {
      responsePayload.loginCredentials = {
        email: student.email,
        password: rawPasswordToSend,
      };
    } else if (existingUser) {
      responsePayload.note =
        "A user account already existed for this email. Existing login credentials remain valid.";
    }

    res.json(responsePayload);
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
  deleteEnquiry,
};

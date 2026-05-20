const Complaint = require("../models/Complaint");
const Student = require("../models/Student");

const getStudentForRequest = async (req) => {
  const student = await Student.findOne({ email: req.user.email });
  if (!student) {
    const error = new Error("Student profile not found");
    error.statusCode = 404;
    throw error;
  }
  return student;
};

// Create a new complaint (Student)
const createComplaint = async (req, res) => {
  try {
    const { title, description, category } = req.body;
    const student = await getStudentForRequest(req);
    
    const complaint = new Complaint({
      studentId: student._id,
      title,
      description,
      category
    });

    await complaint.save();
    res.status(201).json({ message: "Complaint filed successfully", complaint });
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: "Error filing complaint", error: error.message });
  }
};

// Get complaints for a student
const getStudentComplaints = async (req, res) => {
  try {
    const student = await getStudentForRequest(req);
    const complaints = await Complaint.find({ studentId: student._id }).sort({ createdAt: -1 });
    res.json(complaints);
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: "Error fetching complaints", error: error.message });
  }
};

// Get all complaints (Admin)
const getAllComplaints = async (req, res) => {
  try {
    const complaints = await Complaint.find()
      .populate("studentId", "name email roomNumber")
      .sort({ createdAt: -1 });
    res.json(complaints);
  } catch (error) {
    res.status(500).json({ message: "Error fetching complaints", error: error.message });
  }
};

// Get unread complaints count (Admin)
const getUnreadComplaintsCount = async (req, res) => {
  try {
    const count = await Complaint.countDocuments({ isReadByAdmin: false });
    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: "Error fetching unread complaints count", error: error.message });
  }
};

// Mark complaint as read (Admin)
const markComplaintAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const complaint = await Complaint.findByIdAndUpdate(
      id,
      { isReadByAdmin: true },
      { new: true }
    );
    res.json(complaint);
  } catch (error) {
    res.status(500).json({ message: "Error updating complaint", error: error.message });
  }
};

// Update complaint status (Admin)
const updateComplaintStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminReply } = req.body;

    const complaint = await Complaint.findByIdAndUpdate(
      id,
      { status, adminReply, isReadByAdmin: true },
      { new: true }
    );

    res.json({ message: "Complaint updated successfully", complaint });
  } catch (error) {
    res.status(500).json({ message: "Error updating complaint", error: error.message });
  }
};

module.exports = {
  createComplaint,
  getStudentComplaints,
  getAllComplaints,
  getUnreadComplaintsCount,
  markComplaintAsRead,
  updateComplaintStatus
};

const express = require("express");
const router = express.Router();

const {
  createEnquiry,
  getAllEnquiries,
  updateEnquiry,
  convertToStudent,
  deleteEnquiry
} = require("../controllers/enquiryController");

// Public
router.post("/", createEnquiry);

// Admin
router.get("/", getAllEnquiries);
router.put("/:id", updateEnquiry);
router.delete("/:id", deleteEnquiry);

// ✅ Convert Route
router.post("/convert/:id", convertToStudent);

module.exports = router;

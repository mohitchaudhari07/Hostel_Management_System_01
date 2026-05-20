const express = require("express");
const router = express.Router();
const { authenticate, authorize } = require("../middleware/auth");

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
router.get("/", authenticate, authorize("admin"), getAllEnquiries);
router.put("/:id", authenticate, authorize("admin"), updateEnquiry);
router.delete("/:id", authenticate, authorize("admin"), deleteEnquiry);

// ✅ Convert Route
router.post("/convert/:id", authenticate, authorize("admin"), convertToStudent);

module.exports = router;

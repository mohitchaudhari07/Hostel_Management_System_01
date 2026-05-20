const express = require("express");
const router = express.Router();

const { loginUser, createUser, getUsers, resetPassword, getStudents, getCurrentStudent } = require("../controllers/authController");
const { authenticate, optionalAuthenticate, authorize } = require("../middleware/auth");

router.post("/login", loginUser);
router.post("/create-user", optionalAuthenticate, createUser);
router.get("/users", authenticate, authorize("admin"), getUsers);
router.post("/reset-password", authenticate, authorize("admin"), resetPassword);
router.get("/students", authenticate, authorize("admin", "mess", "mess_staff"), getStudents);
router.get("/student-profile", authenticate, authorize("student"), getCurrentStudent);

module.exports = router;

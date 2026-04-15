const express = require("express");
const router = express.Router();

const { loginUser, createUser, getUsers, resetPassword, getStudents } = require("../controllers/authController");

router.post("/login", loginUser);
router.post("/create-user", createUser);
router.get("/users", getUsers);
router.post("/reset-password", resetPassword);
router.get("/students", getStudents);

module.exports = router;

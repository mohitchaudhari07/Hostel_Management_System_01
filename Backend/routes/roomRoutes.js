const express = require("express");
const router = express.Router();

const {
  createRoom,
  getAllRooms,
  getRoomById,
  assignRoomToStudent,
  unassignRoomFromStudent,
  getAvailableRooms,
  updateRoom,
  deleteRoom
} = require("../controllers/roomController");

// Admin routes for room management
router.post("/", createRoom);
router.get("/", getAllRooms);
router.get("/available", getAvailableRooms);
router.get("/:id", getRoomById);
router.put("/:id", updateRoom);
router.delete("/:id", deleteRoom);

// Room assignment routes
router.post("/assign", assignRoomToStudent);
router.post("/unassign", unassignRoomFromStudent);

module.exports = router;
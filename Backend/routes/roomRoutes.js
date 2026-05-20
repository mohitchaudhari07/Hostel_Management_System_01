const express = require("express");
const router = express.Router();
const { authenticate, authorize } = require("../middleware/auth");

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
router.post("/", authenticate, authorize("admin"), createRoom);
router.get("/", authenticate, authorize("admin"), getAllRooms);
router.get("/available", authenticate, authorize("admin"), getAvailableRooms);
router.get("/:id", authenticate, authorize("admin"), getRoomById);
router.put("/:id", authenticate, authorize("admin"), updateRoom);
router.delete("/:id", authenticate, authorize("admin"), deleteRoom);

// Room assignment routes
router.post("/assign", authenticate, authorize("admin"), assignRoomToStudent);
router.post("/unassign", authenticate, authorize("admin"), unassignRoomFromStudent);

module.exports = router;

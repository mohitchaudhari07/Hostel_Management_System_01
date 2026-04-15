const Room = require("../models/Room");
const Student = require("../models/Student");

// CREATE ROOM
const createRoom = async (req, res) => {
  try {
    const { roomNumber, roomType, totalBeds, floor, block, amenities, rentPerMonth } = req.body;

    // Create beds array
    const beds = [];
    for (let i = 1; i <= totalBeds; i++) {
      beds.push({
        bedNumber: i,
        isOccupied: false,
        studentId: null,
        studentName: null,
        studentEmail: null
      });
    }

    const room = await Room.create({
      roomNumber,
      roomType,
      totalBeds,
      availableBeds: totalBeds,
      floor,
      block,
      beds,
      amenities: amenities || [],
      rentPerMonth
    });

    res.status(201).json(room);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET ALL ROOMS
const getAllRooms = async (req, res) => {
  try {
    const rooms = await Room.find({ isActive: true }).sort({ roomNumber: 1 });
    res.json(rooms);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET ROOM BY ID
const getRoomById = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }
    res.json(room);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ASSIGN ROOM/BED TO STUDENT
const assignRoomToStudent = async (req, res) => {
  try {
    const { studentId, roomId, bedNumber } = req.body;

    // Find student
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Check if student already has a room
    if (student.isRoomAssigned) {
      return res.status(400).json({ message: "Student already has a room assigned" });
    }

    // Find room
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    // Check if bed exists and is available
    const bedIndex = room.beds.findIndex(bed => bed.bedNumber === parseInt(bedNumber));
    if (bedIndex === -1) {
      return res.status(404).json({ message: "Bed not found in this room" });
    }

    if (room.beds[bedIndex].isOccupied) {
      return res.status(400).json({ message: "Bed is already occupied" });
    }

    // Assign bed to student
    room.beds[bedIndex].isOccupied = true;
    room.beds[bedIndex].studentId = studentId;
    room.beds[bedIndex].studentName = student.name;
    room.beds[bedIndex].studentEmail = student.email;
    room.availableBeds = room.availableBeds - 1;

    // Update student record
    student.roomId = roomId;
    student.bedId = bedNumber;
    student.roomNumber = room.roomNumber;
    student.floor = room.floor;
    student.block = room.block;
    student.isRoomAssigned = true;
    student.roomAssignedDate = new Date();

    await room.save();
    await student.save();

    res.json({
      message: "Room assigned successfully",
      room,
      student
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// UNASSIGN ROOM/BED FROM STUDENT
const unassignRoomFromStudent = async (req, res) => {
  try {
    const { studentId } = req.body;

    // Find student
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    if (!student.isRoomAssigned) {
      return res.status(400).json({ message: "Student does not have a room assigned" });
    }

    // Find room
    const room = await Room.findById(student.roomId);
    if (room) {
      // Find and free the bed
      const bedIndex = room.beds.findIndex(bed => bed.bedNumber === parseInt(student.bedId));
      if (bedIndex !== -1) {
        room.beds[bedIndex].isOccupied = false;
        room.beds[bedIndex].studentId = null;
        room.beds[bedIndex].studentName = null;
        room.beds[bedIndex].studentEmail = null;
        room.availableBeds = room.availableBeds + 1;
        await room.save();
      }
    }

    // Update student record
    student.roomId = null;
    student.bedId = null;
    student.roomNumber = null;
    student.floor = null;
    student.block = null;
    student.isRoomAssigned = false;
    student.roomAssignedDate = null;

    await student.save();

    res.json({
      message: "Room unassigned successfully",
      student
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET AVAILABLE ROOMS
const getAvailableRooms = async (req, res) => {
  try {
    const rooms = await Room.find({
      isActive: true,
      availableBeds: { $gt: 0 }
    }).sort({ roomNumber: 1 });

    res.json(rooms);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// UPDATE ROOM
const updateRoom = async (req, res) => {
  try {
    const room = await Room.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    res.json(room);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE ROOM (soft delete)
const deleteRoom = async (req, res) => {
  try {
    const room = await Room.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    res.json({ message: "Room deactivated successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createRoom,
  getAllRooms,
  getRoomById,
  assignRoomToStudent,
  unassignRoomFromStudent,
  getAvailableRooms,
  updateRoom,
  deleteRoom
};
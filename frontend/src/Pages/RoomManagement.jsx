import { useEffect, useState } from "react";
import axios from "axios";

function RoomManagement() {
  const [rooms, setRooms] = useState([]);
  const [students, setStudents] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedBed, setSelectedBed] = useState(null);

  // Form states
  const [roomForm, setRoomForm] = useState({
    roomNumber: "",
    roomType: "Double",
    totalBeds: 2,
    floor: 1,
    block: "A",
    amenities: "",
    rentPerMonth: 5000
  });

  useEffect(() => {
    fetchRooms();
    fetchStudents();
  }, []);

  const fetchRooms = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/rooms");
      setRooms(res.data);
    } catch (error) {
      console.error("Error fetching rooms:", error);
    }
  };

  const fetchStudents = async () => {
    try {
      // For now, we'll get students who don't have rooms assigned
      // This would need a proper API endpoint later
      const res = await axios.get("http://localhost:5000/api/auth/students"); // This doesn't exist yet
      setStudents(res.data || []);
    } catch (error) {
      console.error("Error fetching students:", error);
    }
  };

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    try {
      const amenities = roomForm.amenities.split(",").map(item => item.trim());
      const roomData = { ...roomForm, amenities };

      await axios.post("http://localhost:5000/api/rooms", roomData);
      alert("Room created successfully!");
      setShowCreateForm(false);
      setRoomForm({
        roomNumber: "",
        roomType: "Double",
        totalBeds: 2,
        floor: 1,
        block: "A",
        amenities: "",
        rentPerMonth: 5000
      });
      fetchRooms();
    } catch (error) {
      alert("Error creating room: " + (error.response?.data?.message || "Unknown error"));
    }
  };

  const handleAssignRoom = async () => {
    if (!selectedStudent || !selectedRoom || !selectedBed) {
      alert("Please select student, room, and bed");
      return;
    }

    try {
      await axios.post("http://localhost:5000/api/rooms/assign", {
        studentId: selectedStudent,
        roomId: selectedRoom._id,
        bedNumber: selectedBed
      });

      alert("Room assigned successfully!");
      setShowAssignForm(false);
      setSelectedRoom(null);
      setSelectedStudent(null);
      setSelectedBed(null);
      fetchRooms();
      fetchStudents();
    } catch (error) {
      alert("Error assigning room: " + (error.response?.data?.message || "Unknown error"));
    }
  };

  const handleUnassignRoom = async (studentId) => {
    if (!confirm("Are you sure you want to unassign this room?")) return;

    try {
      await axios.post("http://localhost:5000/api/rooms/unassign", {
        studentId
      });

      alert("Room unassigned successfully!");
      fetchRooms();
      fetchStudents();
    } catch (error) {
      alert("Error unassigning room: " + (error.response?.data?.message || "Unknown error"));
    }
  };

  const getAvailableBeds = (room) => {
    return room.beds.filter(bed => !bed.isOccupied);
  };

  return (
    <div style={{ padding: "40px", background: "#f4f6f9", minHeight: "100vh" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h2>Room Management</h2>
        <div>
          <button
            onClick={() => setShowCreateForm(true)}
            style={{
              background: "#3498db",
              color: "white",
              border: "none",
              padding: "10px 20px",
              borderRadius: "5px",
              cursor: "pointer",
              marginRight: "10px"
            }}
          >
            Create Room
          </button>
          <button
            onClick={() => setShowAssignForm(true)}
            style={{
              background: "#27ae60",
              color: "white",
              border: "none",
              padding: "10px 20px",
              borderRadius: "5px",
              cursor: "pointer"
            }}
          >
            Assign Room
          </button>
        </div>
      </div>

      {/* Create Room Form */}
      {showCreateForm && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0,0,0,0.5)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 1000
        }}>
          <div style={{
            background: "white",
            padding: "30px",
            borderRadius: "10px",
            width: "500px",
            maxHeight: "80vh",
            overflowY: "auto"
          }}>
            <h3>Create New Room</h3>
            <form onSubmit={handleCreateRoom}>
              <div style={{ marginBottom: "15px" }}>
                <label>Room Number:</label>
                <input
                  type="text"
                  value={roomForm.roomNumber}
                  onChange={(e) => setRoomForm({...roomForm, roomNumber: e.target.value})}
                  required
                  style={{ width: "100%", padding: "8px", marginTop: "5px" }}
                />
              </div>

              <div style={{ marginBottom: "15px" }}>
                <label>Room Type:</label>
                <select
                  value={roomForm.roomType}
                  onChange={(e) => setRoomForm({...roomForm, roomType: e.target.value})}
                  style={{ width: "100%", padding: "8px", marginTop: "5px" }}
                >
                  <option value="Single">Single</option>
                  <option value="Double">Double</option>
                  <option value="Triple">Triple</option>
                  <option value="Quad">Quad</option>
                </select>
              </div>

              <div style={{ marginBottom: "15px" }}>
                <label>Total Beds:</label>
                <input
                  type="number"
                  value={roomForm.totalBeds}
                  onChange={(e) => setRoomForm({...roomForm, totalBeds: parseInt(e.target.value)})}
                  min="1"
                  max="10"
                  required
                  style={{ width: "100%", padding: "8px", marginTop: "5px" }}
                />
              </div>

              <div style={{ marginBottom: "15px" }}>
                <label>Floor:</label>
                <input
                  type="number"
                  value={roomForm.floor}
                  onChange={(e) => setRoomForm({...roomForm, floor: parseInt(e.target.value)})}
                  min="1"
                  required
                  style={{ width: "100%", padding: "8px", marginTop: "5px" }}
                />
              </div>

              <div style={{ marginBottom: "15px" }}>
                <label>Block:</label>
                <input
                  type="text"
                  value={roomForm.block}
                  onChange={(e) => setRoomForm({...roomForm, block: e.target.value})}
                  required
                  style={{ width: "100%", padding: "8px", marginTop: "5px" }}
                />
              </div>

              <div style={{ marginBottom: "15px" }}>
                <label>Amenities (comma separated):</label>
                <input
                  type="text"
                  value={roomForm.amenities}
                  onChange={(e) => setRoomForm({...roomForm, amenities: e.target.value})}
                  placeholder="AC, Attached Bathroom, Study Table"
                  style={{ width: "100%", padding: "8px", marginTop: "5px" }}
                />
              </div>

              <div style={{ marginBottom: "15px" }}>
                <label>Rent per Month:</label>
                <input
                  type="number"
                  value={roomForm.rentPerMonth}
                  onChange={(e) => setRoomForm({...roomForm, rentPerMonth: parseInt(e.target.value)})}
                  min="0"
                  required
                  style={{ width: "100%", padding: "8px", marginTop: "5px" }}
                />
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
                <button type="submit" style={{
                  background: "#27ae60",
                  color: "white",
                  border: "none",
                  padding: "10px 20px",
                  borderRadius: "5px",
                  cursor: "pointer",
                  flex: 1
                }}>
                  Create Room
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  style={{
                    background: "#95a5a6",
                    color: "white",
                    border: "none",
                    padding: "10px 20px",
                    borderRadius: "5px",
                    cursor: "pointer",
                    flex: 1
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Room Form */}
      {showAssignForm && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0,0,0,0.5)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 1000
        }}>
          <div style={{
            background: "white",
            padding: "30px",
            borderRadius: "10px",
            width: "600px",
            maxHeight: "80vh",
            overflowY: "auto"
          }}>
            <h3>Assign Room to Student</h3>

            <div style={{ marginBottom: "20px" }}>
              <h4>Available Rooms:</h4>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                {rooms.filter(room => room.availableBeds > 0).map(room => (
                  <button
                    key={room._id}
                    onClick={() => setSelectedRoom(room)}
                    style={{
                      padding: "10px",
                      border: selectedRoom?._id === room._id ? "2px solid #3498db" : "1px solid #ddd",
                      borderRadius: "5px",
                      background: selectedRoom?._id === room._id ? "#ecf0f1" : "white",
                      cursor: "pointer"
                    }}
                  >
                    Room {room.roomNumber} ({room.availableBeds} beds available)
                  </button>
                ))}
              </div>
            </div>

            {selectedRoom && (
              <div style={{ marginBottom: "20px" }}>
                <h4>Available Beds in Room {selectedRoom.roomNumber}:</h4>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                  {getAvailableBeds(selectedRoom).map(bed => (
                    <button
                      key={bed.bedNumber}
                      onClick={() => setSelectedBed(bed.bedNumber)}
                      style={{
                        padding: "10px",
                        border: selectedBed === bed.bedNumber ? "2px solid #27ae60" : "1px solid #ddd",
                        borderRadius: "5px",
                        background: selectedBed === bed.bedNumber ? "#d5f4e6" : "white",
                        cursor: "pointer"
                      }}
                    >
                      Bed {bed.bedNumber}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div style={{ marginBottom: "20px" }}>
              <h4>Students without rooms:</h4>
              <div style={{ maxHeight: "200px", overflowY: "auto", border: "1px solid #ddd", padding: "10px" }}>
                {students.filter(student => !student.isRoomAssigned).map(student => (
                  <div
                    key={student._id}
                    onClick={() => setSelectedStudent(student._id)}
                    style={{
                      padding: "8px",
                      margin: "5px 0",
                      border: selectedStudent === student._id ? "2px solid #3498db" : "1px solid #eee",
                      borderRadius: "3px",
                      cursor: "pointer",
                      background: selectedStudent === student._id ? "#ecf0f1" : "white"
                    }}
                  >
                    {student.name} - {student.email}
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
              <button
                onClick={handleAssignRoom}
                disabled={!selectedStudent || !selectedRoom || !selectedBed}
                style={{
                  background: (!selectedStudent || !selectedRoom || !selectedBed) ? "#95a5a6" : "#27ae60",
                  color: "white",
                  border: "none",
                  padding: "10px 20px",
                  borderRadius: "5px",
                  cursor: (!selectedStudent || !selectedRoom || !selectedBed) ? "not-allowed" : "pointer",
                  flex: 1
                }}
              >
                Assign Room
              </button>
              <button
                onClick={() => {
                  setShowAssignForm(false);
                  setSelectedRoom(null);
                  setSelectedStudent(null);
                  setSelectedBed(null);
                }}
                style={{
                  background: "#95a5a6",
                  color: "white",
                  border: "none",
                  padding: "10px 20px",
                  borderRadius: "5px",
                  cursor: "pointer",
                  flex: 1
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rooms List */}
      <div style={{
        background: "white",
        borderRadius: "10px",
        boxShadow: "0 5px 15px rgba(0,0,0,0.1)",
        padding: "20px"
      }}>
        <h3>Room Overview</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "20px" }}>
          {rooms.map(room => (
            <div key={room._id} style={{
              border: "1px solid #ddd",
              borderRadius: "8px",
              padding: "15px",
              background: "#f9f9f9"
            }}>
              <h4>Room {room.roomNumber}</h4>
              <p><strong>Type:</strong> {room.roomType}</p>
              <p><strong>Floor:</strong> {room.floor}, <strong>Block:</strong> {room.block}</p>
              <p><strong>Beds:</strong> {room.totalBeds - room.availableBeds}/{room.totalBeds} occupied</p>
              <p><strong>Rent:</strong> ₹{room.rentPerMonth}/month</p>
              <p><strong>Amenities:</strong> {room.amenities.join(", ") || "None"}</p>

              <div style={{ marginTop: "10px" }}>
                <h5>Bed Status:</h5>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
                  {room.beds.map(bed => (
                    <span
                      key={bed.bedNumber}
                      style={{
                        padding: "4px 8px",
                        borderRadius: "3px",
                        fontSize: "12px",
                        background: bed.isOccupied ? "#e74c3c" : "#27ae60",
                        color: "white"
                      }}
                      title={bed.isOccupied ? `Occupied by ${bed.studentName}` : "Available"}
                    >
                      Bed {bed.bedNumber}
                    </span>
                  ))}
                </div>
              </div>

              {room.beds.some(bed => bed.isOccupied) && (
                <div style={{ marginTop: "10px" }}>
                  <button
                    onClick={() => handleUnassignRoom(room.beds.find(bed => bed.isOccupied)?.studentId)}
                    style={{
                      background: "#e74c3c",
                      color: "white",
                      border: "none",
                      padding: "5px 10px",
                      borderRadius: "3px",
                      cursor: "pointer",
                      fontSize: "12px"
                    }}
                  >
                    Unassign Occupied Bed
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default RoomManagement;
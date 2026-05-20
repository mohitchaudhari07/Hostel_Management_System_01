import { useEffect, useState } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, UserPlus, Home, Bed, Info, CheckCircle, XCircle, Users, LayoutList } from "lucide-react";

export default function RoomManagement() {
  const [rooms, setRooms] = useState([]);
  const [students, setStudents] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedBed, setSelectedBed] = useState(null);

  const [roomForm, setRoomForm] = useState({
    roomNumber: "", roomType: "Double", totalBeds: 2, floor: 1, block: "A", amenities: "", rentPerMonth: 5000
  });

  async function fetchRooms() {
    try {
      const res = await axios.get("/rooms");
      setRooms(res.data);
    } catch (error) { console.error("Error fetching rooms:", error); }
  }

  async function fetchStudents() {
    try {
      const res = await axios.get("/auth/students");
      setStudents(res.data || []);
    } catch (error) { console.error("Error fetching students:", error); }
  }

  useEffect(() => {
    fetchRooms();
    fetchStudents();
  }, []);

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    try {
      const amenities = roomForm.amenities.split(",").map(item => item.trim());
      await axios.post("/rooms", { ...roomForm, amenities });
      setShowCreateForm(false);
      setRoomForm({ roomNumber: "", roomType: "Double", totalBeds: 2, floor: 1, block: "A", amenities: "", rentPerMonth: 5000 });
      fetchRooms();
    } catch (error) {
      alert("Error creating room: " + (error.response?.data?.message || "Unknown error"));
    }
  };

  const handleAssignRoom = async () => {
    if (!selectedStudent || !selectedRoom || !selectedBed) return alert("Please select student, room, and bed");
    try {
      await axios.post("/rooms/assign", { studentId: selectedStudent, roomId: selectedRoom._id, bedNumber: selectedBed });
      setShowAssignForm(false);
      setSelectedRoom(null); setSelectedStudent(null); setSelectedBed(null);
      fetchRooms(); fetchStudents();
    } catch (error) { alert("Error assigning room: " + (error.response?.data?.message || "Unknown error")); }
  };

  const handleUnassignRoom = async (studentId) => {
    if (!confirm("Are you sure you want to unassign this room?")) return;
    try {
      await axios.post("/rooms/unassign", { studentId });
      fetchRooms(); fetchStudents();
    } catch (error) { alert("Error unassigning room: " + (error.response?.data?.message || "Unknown error")); }
  };

  const getAvailableBeds = (room) => room.beds.filter(bed => !bed.isOccupied);

  return (
    <div className="font-sans">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Home className="text-blue-600" /> Room Management
          </h2>
          <p className="text-slate-500 font-medium mt-1">Manage rooms, beds, and student assignments</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setShowCreateForm(true)} className="px-5 py-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-blue-300 hover:text-blue-600 text-slate-700 font-semibold shadow-sm transition-all flex items-center gap-2">
            <Plus size={18} /> Create Room
          </button>
          <button onClick={() => setShowAssignForm(true)} className="px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-semibold shadow-lg shadow-blue-500/30 transition-all flex items-center gap-2">
            <UserPlus size={18} /> Assign Room
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showCreateForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-white p-8 rounded-2xl w-full max-w-lg shadow-2xl overflow-y-auto max-h-[90vh]">
              <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                <Plus className="text-blue-600" /> Create New Room
              </h3>
              <form onSubmit={handleCreateRoom} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Room Number</label>
                    <input type="text" value={roomForm.roomNumber} onChange={(e) => setRoomForm({...roomForm, roomNumber: e.target.value})} required className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Room Type</label>
                    <select value={roomForm.roomType} onChange={(e) => setRoomForm({...roomForm, roomType: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500">
                      <option value="Single">Single</option>
                      <option value="Double">Double</option>
                      <option value="Triple">Triple</option>
                      <option value="Quad">Quad</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Total Beds</label>
                    <input type="number" min="1" max="10" value={roomForm.totalBeds} onChange={(e) => setRoomForm({...roomForm, totalBeds: parseInt(e.target.value)})} required className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Floor</label>
                    <input type="number" min="1" value={roomForm.floor} onChange={(e) => setRoomForm({...roomForm, floor: parseInt(e.target.value)})} required className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Block</label>
                    <input type="text" value={roomForm.block} onChange={(e) => setRoomForm({...roomForm, block: e.target.value})} required className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Rent per Month (₹)</label>
                    <input type="number" min="0" value={roomForm.rentPerMonth} onChange={(e) => setRoomForm({...roomForm, rentPerMonth: parseInt(e.target.value)})} required className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Amenities (comma separated)</label>
                  <input type="text" value={roomForm.amenities} onChange={(e) => setRoomForm({...roomForm, amenities: e.target.value})} placeholder="AC, Attached Bathroom, Study Table" className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                </div>

                <div className="flex gap-3 pt-4">
                  <button type="submit" className="flex-1 bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/30">Create</button>
                  <button type="button" onClick={() => setShowCreateForm(false)} className="flex-1 bg-slate-100 text-slate-700 font-bold py-3 rounded-xl hover:bg-slate-200 transition-colors">Cancel</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}

        {showAssignForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-white p-8 rounded-2xl w-full max-w-2xl shadow-2xl overflow-y-auto max-h-[90vh]">
              <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                <UserPlus className="text-blue-600" /> Assign Room to Student
              </h3>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">1. Select Available Room</label>
                  <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-2 border border-slate-100 rounded-xl bg-slate-50">
                    {rooms.filter(r => r.availableBeds > 0).map(room => (
                      <button key={room._id} onClick={() => { setSelectedRoom(room); setSelectedBed(null); }} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${selectedRoom?._id === room._id ? 'bg-blue-600 text-white shadow-md' : 'bg-white border border-slate-200 text-slate-700 hover:border-blue-300'}`}>
                        Room {room.roomNumber} ({room.availableBeds} beds left)
                      </button>
                    ))}
                    {rooms.filter(r => r.availableBeds > 0).length === 0 && <p className="text-sm text-slate-500 italic p-2">No available rooms</p>}
                  </div>
                </div>

                <AnimatePresence>
                  {selectedRoom && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">2. Select Bed in Room {selectedRoom.roomNumber}</label>
                      <div className="flex flex-wrap gap-2">
                        {getAvailableBeds(selectedRoom).map(bed => (
                          <button key={bed.bedNumber} onClick={() => setSelectedBed(bed.bedNumber)} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 ${selectedBed === bed.bedNumber ? 'bg-emerald-500 text-white shadow-md' : 'bg-white border border-slate-200 text-slate-700 hover:border-emerald-300'}`}>
                            <Bed size={16} /> Bed {bed.bedNumber}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">3. Select Student (Unassigned)</label>
                  <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-200 divide-y divide-slate-100">
                    {students.filter(s => !s.isRoomAssigned).map(student => (
                      <div key={student._id} onClick={() => setSelectedStudent(student._id)} className={`p-3 cursor-pointer transition-colors flex justify-between items-center ${selectedStudent === student._id ? 'bg-blue-50 border-l-4 border-l-blue-600' : 'bg-white hover:bg-slate-50 border-l-4 border-l-transparent'}`}>
                        <div>
                          <p className={`font-bold ${selectedStudent === student._id ? 'text-blue-800' : 'text-slate-800'}`}>{student.name}</p>
                          <p className="text-xs text-slate-500">{student.email}</p>
                        </div>
                        {selectedStudent === student._id && <CheckCircle size={18} className="text-blue-600" />}
                      </div>
                    ))}
                    {students.filter(s => !s.isRoomAssigned).length === 0 && <p className="text-sm text-slate-500 italic p-4 text-center">No unassigned students found</p>}
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-slate-100">
                  <button onClick={handleAssignRoom} disabled={!selectedStudent || !selectedRoom || !selectedBed} className="flex-1 bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed">Assign Room</button>
                  <button onClick={() => { setShowAssignForm(false); setSelectedRoom(null); setSelectedStudent(null); setSelectedBed(null); }} className="flex-1 bg-slate-100 text-slate-700 font-bold py-3 rounded-xl hover:bg-slate-200 transition-colors">Cancel</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 lg:p-8">
        <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
          <LayoutList className="text-blue-600" /> Room Overview
        </h3>

        {rooms.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <Home className="mx-auto text-slate-300 mb-3" size={40} />
            <p className="text-slate-500 font-medium">No rooms created yet. Click "Create Room" to begin.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {rooms.map(room => (
              <motion.div key={room._id} whileHover={{ y: -4 }} className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 border-b border-slate-100 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-blue-600 text-white rounded-lg shadow-sm">
                      <Home size={18} />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 leading-tight">Room {room.roomNumber}</h4>
                      <p className="text-xs font-semibold text-blue-600 tracking-wider uppercase">{room.roomType}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs font-bold px-2 py-1 rounded-md ${room.availableBeds > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                      {room.availableBeds > 0 ? `${room.availableBeds} Left` : 'Full'}
                    </span>
                  </div>
                </div>

                <div className="p-4 flex-1 flex flex-col gap-4">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                      <span className="text-xs text-slate-500 font-semibold block">Floor</span>
                      <span className="font-bold text-slate-700">{room.floor}</span>
                    </div>
                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                      <span className="text-xs text-slate-500 font-semibold block">Block</span>
                      <span className="font-bold text-slate-700">{room.block}</span>
                    </div>
                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 col-span-2">
                      <span className="text-xs text-slate-500 font-semibold block">Rent</span>
                      <span className="font-bold text-slate-700">₹{room.rentPerMonth}/mo</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-xs text-slate-500 font-semibold block mb-1 flex items-center gap-1"><Info size={12} /> Amenities</span>
                    <p className="text-sm font-medium text-slate-700 line-clamp-1">{room.amenities.join(", ") || "None"}</p>
                  </div>

                  <div className="mt-auto">
                    <span className="text-xs text-slate-500 font-semibold block mb-2 flex items-center gap-1"><Users size={12} /> Bed Status ({room.totalBeds - room.availableBeds}/{room.totalBeds})</span>
                    <div className="flex flex-wrap gap-2">
                      {room.beds.map(bed => (
                        <div key={bed.bedNumber} className={`relative group px-2 py-1 rounded-md text-xs font-bold border flex items-center gap-1 ${bed.isOccupied ? 'bg-red-50 text-red-700 border-red-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                          <Bed size={12} /> B{bed.bedNumber}
                          
                          {/* Tooltip for occupant */}
                          {bed.isOccupied && (
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 w-max px-2 py-1 bg-slate-800 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                              {bed.studentName}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {room.beds.some(bed => bed.isOccupied) && (
                    <div className="pt-3 border-t border-slate-100 mt-2">
                      <button onClick={() => handleUnassignRoom(room.beds.find(bed => bed.isOccupied)?.studentId)} className="w-full py-2 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold rounded-lg transition-colors flex justify-center items-center gap-1 border border-red-100">
                        <XCircle size={14} /> Unassign Occupied
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}

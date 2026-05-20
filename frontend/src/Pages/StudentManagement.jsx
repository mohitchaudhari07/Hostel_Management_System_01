import { useEffect, useState } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, Search, Filter, AlertCircle, RefreshCw, X,
  GraduationCap, Home, Bed, Phone, Calendar, Banknote, CreditCard, Clock, CheckCircle2,
  AlertTriangle
} from "lucide-react";

export default function StudentManagement() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPaymentStatus, setFilterPaymentStatus] = useState("all");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [paymentForm, setPaymentForm] = useState({
    hostelFeeAmount: "", messFeeAmount: "", paymentDueDate: ""
  });

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/auth/students");
      setStudents(response.data);
      setError(null);
    } catch (error) {
      console.error("Error fetching students:", error);
      setError("Failed to load students");
    } finally {
      setLoading(false);
    }
  };

  const handleSendPaymentDetails = (student) => {
    setSelectedStudent(student);
    setPaymentForm({
      hostelFeeAmount: "", messFeeAmount: "",
      paymentDueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    });
    setShowPaymentModal(true);
  };

  const handleSubmitPaymentDetails = async () => {
    if (!paymentForm.hostelFeeAmount || !paymentForm.messFeeAmount || !paymentForm.paymentDueDate) return alert("Please fill in all required fields");
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      if (!user.id) return alert("Authentication required. Please login again.");

      await axios.post(
        `/payments/student/${selectedStudent._id}/send-payment-details`,
        { hostelFeeAmount: parseFloat(paymentForm.hostelFeeAmount), messFeeAmount: parseFloat(paymentForm.messFeeAmount), paymentDueDate: paymentForm.paymentDueDate },
        { headers: { "x-user-id": user.id, "x-user-role": user.role } }
      );
      setShowPaymentModal(false);
      setSelectedStudent(null);
      fetchStudents();
    } catch (error) { alert("Error sending payment details: " + (error.response?.data?.message || "Unknown error")); }
  };

  const handleUnassignRoom = async (studentId) => {
    if (!confirm("Are you sure you want to unassign this student's room?")) return;
    try {
      await axios.post("/rooms/unassign", { studentId });
      fetchStudents();
    } catch (error) { alert("Error unassigning room: " + (error.response?.data?.message || "Unknown error")); }
  };

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) || student.email.toLowerCase().includes(searchTerm.toLowerCase()) || (student.roomNumber && student.roomNumber.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesRoomFilter = filterStatus === "all" || (filterStatus === "assigned" && student.isRoomAssigned) || (filterStatus === "unassigned" && !student.isRoomAssigned);
    const matchesPaymentFilter = filterPaymentStatus === "all" || student.paymentStatus === filterPaymentStatus;
    return matchesSearch && matchesRoomFilter && matchesPaymentFilter;
  });

  const getPaymentStatusBadge = (status) => {
    const badges = {
      "paid": <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1"><CheckCircle2 size={14}/> Paid</span>,
      "partial": <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1"><CreditCard size={14}/> Partial</span>,
      "pending": <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1"><Clock size={14}/> Pending</span>,
      "overdue": <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1"><AlertTriangle size={14}/> Overdue</span>,
      "not_assigned": <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1"><Banknote size={14}/> Not Sent</span>
    };
    return badges[status] || badges["not_assigned"];
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-200 shadow-sm">
      <RefreshCw className="animate-spin text-blue-600 mb-4" size={48} />
      <p className="text-slate-500 font-medium">Loading students...</p>
    </div>
  );

  if (error) return (
    <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-red-200 shadow-sm text-center">
      <AlertCircle className="text-red-500 mb-4" size={64} />
      <h3 className="text-2xl font-bold text-slate-800 mb-2">Failed to Load Students</h3>
      <p className="text-slate-500 mb-6">{error}</p>
      <button onClick={fetchStudents} className="px-6 py-3 bg-red-50 text-red-700 font-bold rounded-xl hover:bg-red-100 transition-colors">Retry</button>
    </div>
  );

  return (
    <div className="space-y-6 font-sans">
      

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input type="text" placeholder="Search by name, email, or room..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium text-slate-700" />
        </div>
        <div className="flex gap-4">
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-1 rounded-xl border border-slate-200">
            <Home size={18} className="text-slate-400" />
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="bg-transparent outline-none text-slate-700 font-semibold py-1.5 cursor-pointer">
              <option value="all">All Rooms</option>
              <option value="assigned">Assigned</option>
              <option value="unassigned">Unassigned</option>
            </select>
          </div>
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-1 rounded-xl border border-slate-200">
            <Banknote size={18} className="text-slate-400" />
            <select value={filterPaymentStatus} onChange={(e) => setFilterPaymentStatus(e.target.value)} className="bg-transparent outline-none text-slate-700 font-semibold py-1.5 cursor-pointer">
              <option value="all">All Payments</option>
              <option value="not_assigned">Not Assigned</option>
              <option value="pending">Pending</option>
              <option value="partial">Partial</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: "Total Students", value: students.length, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Room Assigned", value: students.filter(s => s.isRoomAssigned).length, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Waiting Room", value: students.filter(s => !s.isRoomAssigned).length, color: "text-amber-600", bg: "bg-amber-50" },
          { label: "Payment Not Sent", value: students.filter(s => s.paymentStatus === "not_assigned").length, color: "text-slate-600", bg: "bg-slate-100" },
          { label: "Payment Complete", value: students.filter(s => s.paymentStatus === "paid").length, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Payment Pending", value: students.filter(s => ["pending", "partial", "overdue"].includes(s.paymentStatus)).length, color: "text-red-600", bg: "bg-red-50" }
        ].map((stat, idx) => (
          <div key={idx} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 text-center">
            <p className={`text-2xl font-black ${stat.color}`}>{stat.value}</p>
            <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-wide">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredStudents.length === 0 ? (
          <div className="col-span-full py-20 bg-white rounded-2xl border border-slate-200 shadow-sm text-center">
            <Users className="mx-auto text-slate-300 mb-4" size={64} />
            <h3 className="text-xl font-bold text-slate-800">No students found</h3>
            <p className="text-slate-500">Try adjusting your search or filter criteria.</p>
          </div>
        ) : (
          filteredStudents.map(student => (
            <motion.div key={student._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col">
              <div className="p-5 border-b border-slate-100 flex items-start gap-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xl shadow-md shrink-0">
                  {student.name.substring(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-slate-800 truncate">{student.name}</h3>
                  <p className="text-sm font-medium text-slate-500 truncate">{student.email}</p>
                  <div className="flex gap-2 mt-2">
                    {student.isRoomAssigned ? (
                      <span className="bg-indigo-100 text-indigo-700 px-2.5 py-0.5 rounded-full text-xs font-bold flex items-center gap-1">
                        <Home size={12}/> Room {student.roomNumber}
                      </span>
                    ) : (
                      <span className="bg-slate-100 text-slate-500 px-2.5 py-0.5 rounded-full text-xs font-bold flex items-center gap-1">
                        <Home size={12}/> No Room
                      </span>
                    )}
                    {getPaymentStatusBadge(student.paymentStatus)}
                  </div>
                </div>
              </div>

              <div className="p-5 flex-1 bg-slate-50/50">
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                    <span className="text-slate-500 font-medium flex items-center gap-2"><Phone size={14}/> Phone</span>
                    <span className="font-semibold text-slate-800">{student.phone || "N/A"}</span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                    <span className="text-slate-500 font-medium flex items-center gap-2"><GraduationCap size={14}/> Course</span>
                    <span className="font-semibold text-slate-800">{student.course || "N/A"}</span>
                  </div>
                  {student.isRoomAssigned && (
                    <div className="flex justify-between items-center pb-2 border-b border-slate-100 bg-indigo-50/50 -mx-5 px-5 py-2">
                      <span className="text-indigo-600 font-medium flex items-center gap-2"><Bed size={14}/> Allocation</span>
                      <span className="font-bold text-indigo-800">Bed {student.bedId} (Fl: {student.floor}, Bl: {student.block})</span>
                    </div>
                  )}
                  {student.paymentStatus !== "not_assigned" && (
                    <div className="space-y-2 pt-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-500">Hostel Fee</span>
                        <span className="font-semibold">₹{student.hostelFeeAmount}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-500">Mess Fee</span>
                        <span className="font-semibold">₹{student.messFeeAmount}</span>
                      </div>
                      <div className="flex justify-between items-center bg-slate-100 p-2 rounded-lg mt-1">
                        <span className="font-bold text-slate-700">Total Due</span>
                        <span className="font-black text-red-600">₹{student.amountDue}</span>
                      </div>
                      <div className="text-right text-[10px] font-bold text-slate-400 mt-1 uppercase">
                        Due: {student.paymentDueDate ? new Date(student.paymentDueDate).toLocaleDateString() : "N/A"}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-4 border-t border-slate-100 bg-white grid grid-cols-2 gap-2">
                {student.paymentStatus === "not_assigned" ? (
                  <button onClick={() => handleSendPaymentDetails(student)} className="col-span-2 py-2 bg-blue-50 text-blue-700 font-bold rounded-xl hover:bg-blue-100 transition-colors flex items-center justify-center gap-2">
                    <Banknote size={16} /> Send Payment Details
                  </button>
                ) : (
                  <button className="col-span-2 py-2 bg-slate-50 text-slate-400 font-bold rounded-xl cursor-not-allowed flex items-center justify-center gap-2">
                    <CheckCircle2 size={16} /> Payment Sent
                  </button>
                )}
                
                {student.isRoomAssigned && (
                  <button onClick={() => handleUnassignRoom(student._id)} className="col-span-2 py-2 mt-2 bg-red-50 text-red-600 font-bold rounded-xl hover:bg-red-100 transition-colors flex items-center justify-center gap-2">
                    <X size={16} /> Unassign Room
                  </button>
                )}
              </div>
            </motion.div>
          ))
        )}
      </div>

      <AnimatePresence>
        {showPaymentModal && selectedStudent && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-white p-8 rounded-2xl w-full max-w-md shadow-2xl overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <Banknote className="text-emerald-600" /> Payment Details
                </h3>
                <button onClick={() => setShowPaymentModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                  <X size={24} />
                </button>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-6 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
                  {selectedStudent.name.substring(0,2).toUpperCase()}
                </div>
                <div>
                  <p className="font-bold text-slate-800 leading-tight">{selectedStudent.name}</p>
                  <p className="text-xs text-slate-500">{selectedStudent.email}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Hostel Fee (₹)</label>
                  <input type="number" value={paymentForm.hostelFeeAmount} onChange={(e) => setPaymentForm({...paymentForm, hostelFeeAmount: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" placeholder="0.00" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Mess Fee (₹)</label>
                  <input type="number" value={paymentForm.messFeeAmount} onChange={(e) => setPaymentForm({...paymentForm, messFeeAmount: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" placeholder="0.00" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Due Date</label>
                  <input type="date" value={paymentForm.paymentDueDate} onChange={(e) => setPaymentForm({...paymentForm, paymentDueDate: e.target.value})} min={new Date().toISOString().split('T')[0]} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                </div>

                <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl text-center mt-2">
                  <p className="text-sm font-semibold text-emerald-700">Total Amount Due</p>
                  <p className="text-3xl font-black text-emerald-600">₹{(parseFloat(paymentForm.hostelFeeAmount || 0) + parseFloat(paymentForm.messFeeAmount || 0)).toFixed(2)}</p>
                </div>

                <div className="flex gap-3 pt-4 border-t border-slate-100">
                  <button onClick={handleSubmitPaymentDetails} className="flex-1 bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/30">Send to Student</button>
                  <button onClick={() => setShowPaymentModal(false)} className="flex-1 bg-slate-100 text-slate-700 font-bold py-3 rounded-xl hover:bg-slate-200 transition-colors">Cancel</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
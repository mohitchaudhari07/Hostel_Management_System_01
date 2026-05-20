import { useState, useEffect } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { 
  MessageSquareWarning, CheckCircle, Clock, 
  AlertCircle, X, Send, Search, Filter 
} from "lucide-react";

export default function AdminComplaints() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [adminReply, setAdminReply] = useState("");
  const [status, setStatus] = useState("in_progress");
  const [filter, setFilter] = useState("all");
  
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const headers = { "x-user-id": user.id, "x-user-role": user.role };

  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/complaints", { headers });
      setComplaints(res.data);
    } catch (error) {
      console.error("Error fetching complaints", error);
    } finally {
      setLoading(false);
    }
  };

  const openComplaint = async (complaint) => {
    setSelectedComplaint(complaint);
    setAdminReply(complaint.adminReply || "");
    setStatus(complaint.status);
    
    if (!complaint.isReadByAdmin) {
      try {
        await axios.put(`/complaints/${complaint._id}/read`, {}, { headers });
        setComplaints(complaints.map(c => c._id === complaint._id ? { ...c, isReadByAdmin: true } : c));
      } catch (error) {
        console.error("Failed to mark as read", error);
      }
    }
  };

  const updateComplaint = async () => {
    try {
      await axios.put(`/complaints/${selectedComplaint._id}`, {
        status,
        adminReply
      }, { headers });
      
      alert("Complaint updated successfully");
      setSelectedComplaint(null);
      fetchComplaints();
    } catch (error) {
      alert("Failed to update complaint");
    }
  };

  const filteredComplaints = complaints.filter(c => {
    if (filter === "all") return true;
    if (filter === "unread") return !c.isReadByAdmin;
    return c.status === filter;
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: "Total Complaints", value: complaints.length, icon: MessageSquareWarning, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Unread", value: complaints.filter(c => !c.isReadByAdmin).length, icon: AlertCircle, color: "text-red-600", bg: "bg-red-50" },
          { label: "In Progress", value: complaints.filter(c => c.status === "in_progress").length, icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
          { label: "Resolved", value: complaints.filter(c => c.status === "resolved").length, icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-50" }
        ].map((stat, idx) => (
          <div key={idx} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
              <stat.icon size={24} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-500">{stat.label}</h3>
              <p className={`text-2xl font-black ${stat.color}`}>{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
          <h2 className="text-xl font-bold text-slate-800">Complaints List</h2>
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-slate-400" />
            <select 
              value={filter} 
              onChange={(e) => setFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-sm font-bold text-slate-700 px-3 py-2 rounded-xl outline-none"
            >
              <option value="all">All Complaints</option>
              <option value="unread">Unread Only</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-10"><p className="text-slate-500 font-medium">Loading complaints...</p></div>
        ) : filteredComplaints.length === 0 ? (
          <div className="text-center py-10"><p className="text-slate-500 font-medium">No complaints found.</p></div>
        ) : (
          <div className="space-y-4">
            {filteredComplaints.map(complaint => (
              <div 
                key={complaint._id} 
                onClick={() => openComplaint(complaint)}
                className={`p-5 rounded-xl border cursor-pointer transition-all ${
                  !complaint.isReadByAdmin ? 'bg-blue-50/50 border-blue-200 hover:border-blue-400' : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-3">
                    {!complaint.isReadByAdmin && <span className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse"></span>}
                    <h4 className={`font-bold text-lg ${!complaint.isReadByAdmin ? 'text-blue-900' : 'text-slate-800'}`}>
                      {complaint.title}
                    </h4>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase ${
                    complaint.status === 'resolved' ? 'bg-emerald-100 text-emerald-700' :
                    complaint.status === 'in_progress' ? 'bg-amber-100 text-amber-700' :
                    'bg-slate-100 text-slate-700'
                  }`}>
                    {complaint.status.replace('_', ' ')}
                  </span>
                </div>
                <p className="text-slate-600 text-sm line-clamp-2 mb-3">{complaint.description}</p>
                <div className="flex items-center gap-4 text-xs font-semibold text-slate-400">
                  <span className="capitalize">Category: {complaint.category}</span>
                  <span>From: {complaint.studentId?.name || "Unknown"} (Room {complaint.studentId?.roomNumber || "N/A"})</span>
                  <span>Date: {new Date(complaint.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedComplaint && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h3 className="font-bold text-xl text-slate-800">Complaint Details</h3>
                <button onClick={() => setSelectedComplaint(null)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
              </div>
              
              <div className="p-6 overflow-y-auto flex-1 space-y-6">
                <div>
                  <div className="flex justify-between items-start">
                    <h4 className="text-2xl font-bold text-slate-900 mb-2">{selectedComplaint.title}</h4>
                    <span className="px-3 py-1 bg-slate-100 rounded-lg text-xs font-bold text-slate-600 uppercase">{selectedComplaint.category}</span>
                  </div>
                  <p className="text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-100 mt-2 whitespace-pre-wrap">{selectedComplaint.description}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white p-4 rounded-xl border border-slate-200">
                    <p className="text-xs font-bold text-slate-400 uppercase mb-1">Student Details</p>
                    <p className="font-bold text-slate-800">{selectedComplaint.studentId?.name || "Unknown"}</p>
                    <p className="text-sm text-slate-600">{selectedComplaint.studentId?.email}</p>
                    <p className="text-sm font-semibold text-blue-600 mt-1">Room: {selectedComplaint.studentId?.roomNumber || "N/A"}</p>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-slate-200">
                    <p className="text-xs font-bold text-slate-400 uppercase mb-1">Time & Status</p>
                    <p className="font-bold text-slate-800">Filed on {new Date(selectedComplaint.createdAt).toLocaleDateString()}</p>
                    <p className="text-sm text-slate-600">{new Date(selectedComplaint.createdAt).toLocaleTimeString()}</p>
                  </div>
                </div>

                <div className="border-t border-slate-200 pt-6">
                  <h5 className="font-bold text-slate-800 mb-3">Admin Response</h5>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Update Status</label>
                      <select 
                        value={status} 
                        onChange={(e) => setStatus(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500/20 outline-none font-medium"
                      >
                        <option value="pending">Pending</option>
                        <option value="in_progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Reply Message</label>
                      <textarea 
                        rows="3"
                        value={adminReply}
                        onChange={(e) => setAdminReply(e.target.value)}
                        placeholder="Type your response to the student here..."
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500/20 outline-none resize-none"
                      ></textarea>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                <button onClick={() => setSelectedComplaint(null)} className="px-6 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl transition-colors">
                  Close
                </button>
                <button onClick={updateComplaint} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors flex items-center gap-2 shadow-lg shadow-blue-500/30">
                  <Send size={16} /> Send Update
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

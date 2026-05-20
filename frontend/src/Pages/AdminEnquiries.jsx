import { useEffect, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import {
  Mail,
  Trash2,
  UserCheck,
  Inbox,
  MessageSquare,
  Phone,
  MapPin,
  Search,
  Calendar,
} from "lucide-react";

export default function AdminEnquiries() {
  const [enquiries, setEnquiries] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  async function fetchEnquiries() {
    try {
      const res = await axios.get("/enquiries");
      setEnquiries(res.data);
    } catch (error) {
      console.error("Error fetching enquiries:", error);
    }
  }

  useEffect(() => {
    fetchEnquiries();
  }, []);

  const updateEnquiry = async (id, status, notes) => {
    try {
      await axios.put(`/enquiries/${id}`, { status, notes });
      fetchEnquiries();
    } catch (error) {
      console.error("Error updating enquiry:", error);
    }
  };

  const convertToStudent = async (id) => {
    try {
      const res = await axios.post(`/enquiries/convert/${id}`);
      const credentials = res.data.loginCredentials;
      const baseMessage = "🎉 Student conversion completed successfully.";

      if (credentials) {
        alert(
          `${baseMessage}\n\nEmail: ${credentials.email}\nPassword: ${credentials.password}`,
        );
      } else {
        alert(
          `${baseMessage}\n\n${res.data.note || "A login account already exists for this email. Please use the existing credentials."}`,
        );
      }

      fetchEnquiries();
    } catch (error) {
      alert(
        "Conversion failed: " +
          (error.response?.data?.message || "Unknown error"),
      );
    }
  };

  const deleteEnquiry = async (id) => {
    if (
      window.confirm(
        "Are you sure you want to delete this enquiry? This action cannot be undone.",
      )
    ) {
      try {
        await axios.delete(`/enquiries/${id}`);
        fetchEnquiries();
      } catch (error) {
        alert(
          "Failed to delete enquiry: " +
            (error.response?.data?.message || "Unknown error"),
        );
      }
    }
  };

  const filteredEnquiries = enquiries.filter(
    (enq) =>
      enq.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      enq.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      enq.phone?.includes(searchTerm),
  );

  const getStatusStyle = (status) => {
    switch (status) {
      case "New":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "Contacted":
        return "bg-amber-100 text-amber-700 border-amber-200";
      case "Interested":
        return "bg-purple-100 text-purple-700 border-purple-200";
      case "Final":
        return "bg-indigo-100 text-indigo-700 border-indigo-200";
      case "Joined":
        return "bg-emerald-100 text-emerald-700 border-emerald-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  return (
    <div className="font-sans space-y-6">
      

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            size={20}
          />
          <input
            type="text"
            placeholder="Search enquiries by name, email, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium text-slate-700 bg-slate-50 focus:bg-white transition-colors"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredEnquiries.length === 0 ? (
          <div className="col-span-full py-20 bg-white rounded-2xl border border-slate-200 shadow-sm text-center">
            <Inbox className="mx-auto text-slate-300 mb-4" size={64} />
            <h3 className="text-xl font-bold text-slate-800">
              No enquiries found
            </h3>
            <p className="text-slate-500">
              When students submit enquiries, they will appear here.
            </p>
          </div>
        ) : (
          filteredEnquiries.map((enq, idx) => (
            <motion.div
              key={enq._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col"
            >
              <div className="p-5 border-b border-slate-100 flex justify-between items-start">
                <div className="min-w-0 flex-1">
                  <h3 className="text-lg font-bold text-slate-800 truncate pr-4">
                    {enq.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Mail size={14} className="text-slate-400 shrink-0" />
                    <span className="text-sm font-medium text-slate-500 truncate">
                      {enq.email || "No email"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <Phone size={14} className="text-slate-400 shrink-0" />
                    <span className="text-sm font-medium text-slate-500">
                      {enq.phone || "No phone"}
                    </span>
                  </div>
                </div>
                <div
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${getStatusStyle(enq.status)}`}
                >
                  {enq.status}
                </div>
              </div>

              <div className="p-5 flex-1 bg-slate-50/50 flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                    <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block mb-1 flex items-center gap-1">
                      Course
                    </span>
                    <span className="font-bold text-slate-700 truncate">
                      {enq.course || "N/A"}
                    </span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                    <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block mb-1 flex items-center gap-1">
                      Room
                    </span>
                    <span className="font-bold text-slate-700 truncate">
                      {enq.preferredRoomType || "Any"}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-slate-500 flex items-center gap-1 uppercase tracking-wide">
                    <MessageSquare size={12} /> Admin Notes
                  </label>
                  <textarea
                    defaultValue={enq.notes}
                    onBlur={(e) =>
                      updateEnquiry(enq._id, enq.status, e.target.value)
                    }
                    placeholder="Add notes about this enquiry..."
                    className="w-full h-20 px-3 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm resize-none bg-white"
                  />
                </div>
              </div>

              <div className="p-4 border-t border-slate-100 bg-white grid grid-cols-2 gap-2 items-center">
                <div className="col-span-2 sm:col-span-1">
                  <select
                    value={enq.status}
                    onChange={(e) =>
                      updateEnquiry(enq._id, e.target.value, enq.notes)
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm font-bold text-slate-700 bg-slate-50 cursor-pointer"
                  >
                    <option value="New">Status: New</option>
                    <option value="Contacted">Status: Contacted</option>
                    <option value="Interested">Status: Interested</option>
                    <option value="Final">Status: Final</option>
                    <option value="Joined">Status: Joined</option>
                  </select>
                </div>

                <div className="col-span-2 sm:col-span-1 flex gap-2">
                  {enq.status === "Final" ? (
                    <button
                      onClick={() => convertToStudent(enq._id)}
                      className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-colors flex justify-center items-center gap-1 shadow-md shadow-indigo-500/20"
                    >
                      <UserCheck size={14} /> Convert
                    </button>
                  ) : (
                    <div className="flex-1"></div>
                  )}

                  <button
                    onClick={() => deleteEnquiry(enq._id)}
                    className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition-colors border border-red-100 flex items-center justify-center shrink-0"
                    title="Delete Enquiry"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}

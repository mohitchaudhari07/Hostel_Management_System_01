import { useState, useEffect } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { CheckCircle, XCircle, Calendar, TrendingUp, Clock } from "lucide-react";

export default function AttendanceCard({ studentId }) {
  const [attendance, setAttendance] = useState([]);
  const [stats, setStats] = useState({ total: 0, present: 0, absent: 0, percentage: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAttendance();
  }, [studentId]);

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const today = new Date();
      const year = today.getFullYear();
      const month = today.getMonth() + 1;

      const response = await axios.get(
        `/attendance/student/${studentId}?month=${month}&year=${year}`
      );

      setAttendance(response.data.attendance || []);
      setStats(response.data.stats || { total: 0, present: 0, absent: 0 });

      const percentage = response.data.stats?.total > 0
        ? Math.round((response.data.stats.present / response.data.stats.total) * 100)
        : 0;
      setStats(prev => ({ ...prev, percentage }));
    } catch (error) {
      console.error("Error fetching attendance:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const formatDuration = (minutes) => {
    if (!minutes) return "N/A";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  return (
    <div className="flex flex-col gap-6 font-sans">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: CheckCircle, label: "Present", value: stats.present, color: "text-emerald-600", bg: "bg-emerald-50" },
          { icon: XCircle, label: "Absent", value: stats.absent, color: "text-red-600", bg: "bg-red-50" },
          { icon: Calendar, label: "Total Days", value: stats.total, color: "text-blue-600", bg: "bg-blue-50" },
          { icon: TrendingUp, label: "Attendance %", value: `${stats.percentage}%`, color: "text-indigo-600", bg: "bg-indigo-50" }
        ].map((stat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`p-4 rounded-2xl flex items-center gap-4 border border-slate-100 ${stat.bg}`}
          >
            <div className={`p-2 rounded-xl bg-white shadow-sm ${stat.color}`}>
              <stat.icon size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">{stat.label}</p>
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Today's Status */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Calendar size={20} className="text-blue-600" />
          Today's Attendance
        </h3>
        {(() => {
          const today = new Date().toISOString().split('T')[0];
          const todayRecord = attendance.find(record => new Date(record.date).toISOString().split('T')[0] === today);

          if (!todayRecord) {
            return (
              <div className="text-center py-12 px-4 bg-slate-50 rounded-xl border border-slate-100 border-dashed">
                <Clock className="mx-auto text-slate-300 mb-3" size={40} />
                <p className="text-slate-500 font-medium">No attendance recorded yet today</p>
              </div>
            );
          }

          const isPresent = todayRecord.status === "Present";

          return (
            <div className={`p-5 rounded-xl border ${isPresent ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}>
              <div className="flex justify-between items-center mb-4">
                <span className={`px-4 py-1.5 rounded-full text-sm font-semibold flex items-center gap-2 ${isPresent ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                  {isPresent ? <CheckCircle size={16} /> : <XCircle size={16} />}
                  {isPresent ? "Present" : "Absent"}
                </span>
                <span className="text-sm font-medium text-slate-600">
                  {new Date(todayRecord.date).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                </span>
              </div>

              {isPresent && (
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-white p-3 rounded-lg shadow-sm border border-emerald-100/50">
                    <p className="text-xs font-semibold text-emerald-600 uppercase mb-1">Check-in</p>
                    <p className="text-slate-800 font-bold">{formatTime(todayRecord.checkInTime)}</p>
                  </div>
                  <div className="bg-white p-3 rounded-lg shadow-sm border border-emerald-100/50">
                    <p className="text-xs font-semibold text-emerald-600 uppercase mb-1">Check-out</p>
                    <p className="text-slate-800 font-bold">{formatTime(todayRecord.checkOutTime)}</p>
                  </div>
                  <div className="bg-white p-3 rounded-lg shadow-sm border border-emerald-100/50">
                    <p className="text-xs font-semibold text-emerald-600 uppercase mb-1">Duration</p>
                    <p className="text-slate-800 font-bold">{formatDuration(todayRecord.duration)}</p>
                  </div>
                </div>
              )}
            </div>
          );
        })()}
      </div>

      {/* Attendance List */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <h3 className="text-lg font-bold text-slate-800 mb-4">Current Month Attendance</h3>
        
        {loading ? (
          <div className="text-center py-10 text-slate-500">Loading attendance...</div>
        ) : attendance.length === 0 ? (
          <div className="text-center py-10 text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            No attendance records yet for this month
          </div>
        ) : (
          <div className="space-y-3">
            {attendance.map((record) => (
              <div key={record._id} className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-xl border border-slate-100 bg-slate-50 hover:bg-slate-100 transition-colors">
                <div className="flex-1 w-full flex justify-between sm:justify-start sm:gap-8 items-center">
                  <div>
                    <p className="font-bold text-slate-800">
                      {new Date(record.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${record.status === "Present" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                    {record.status === "Present" ? <CheckCircle size={14} /> : <XCircle size={14} />}
                    {record.status}
                  </span>
                </div>
                
                {record.status === "Present" && (
                  <div className="flex items-center gap-4 text-sm w-full sm:w-auto mt-2 sm:mt-0 justify-between sm:justify-end bg-white sm:bg-transparent p-2 sm:p-0 rounded-lg sm:rounded-none shadow-sm sm:shadow-none border border-slate-100 sm:border-none">
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-600 font-semibold bg-emerald-50 px-2 py-1 rounded-md">In: {formatTime(record.checkInTime)}</span>
                      {record.checkOutTime && (
                        <span className="text-slate-600 font-semibold bg-slate-100 px-2 py-1 rounded-md">Out: {formatTime(record.checkOutTime)}</span>
                      )}
                    </div>
                    {record.duration && (
                      <span className="text-indigo-600 font-semibold bg-indigo-50 px-2 py-1 rounded-md">
                        {formatDuration(record.duration)}
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

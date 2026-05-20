import { useState, useEffect } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { 
  BarChart3, Calendar, Users, TrendingUp, RefreshCw, AlertCircle, 
  CheckCircle2, XCircle, UserCheck, AlertTriangle
} from "lucide-react";

export default function AttendanceAnalytics() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(
        `/attendance/analytics?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`
      );
      setAnalytics(response.data);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      setError("Failed to load attendance analytics");
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (field, value) => {
    setDateRange(prev => ({ ...prev, [field]: value }));
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-200 shadow-sm">
      <RefreshCw className="animate-spin text-blue-600 mb-4" size={48} />
      <p className="text-slate-500 font-medium">Loading analytics data...</p>
    </div>
  );

  if (error) return (
    <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-red-200 shadow-sm text-center">
      <AlertCircle className="text-red-500 mb-4" size={64} />
      <h3 className="text-2xl font-bold text-slate-800 mb-2">Failed to Load Analytics</h3>
      <p className="text-slate-500 mb-6">{error}</p>
      <button onClick={fetchAnalytics} className="px-6 py-3 bg-red-50 text-red-700 font-bold rounded-xl hover:bg-red-100 transition-colors">Retry</button>
    </div>
  );

  return (
    <div className="font-sans space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <BarChart3 className="text-blue-600" /> Attendance Analytics
          </h2>
          <p className="text-slate-500 font-medium mt-1">Comprehensive attendance insights and reports</p>
        </div>
        
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Start Date</label>
            <input type="date" value={dateRange.startDate} onChange={(e) => handleDateChange('startDate', e.target.value)} className="px-4 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-slate-50 font-medium text-slate-700" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">End Date</label>
            <input type="date" value={dateRange.endDate} onChange={(e) => handleDateChange('endDate', e.target.value)} className="px-4 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-slate-50 font-medium text-slate-700" />
          </div>
          <button onClick={fetchAnalytics} className="px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold rounded-xl transition-colors flex items-center gap-2">
            <RefreshCw size={16} /> Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-br from-indigo-50 to-blue-50 p-6 rounded-2xl border border-indigo-100 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center shadow-sm">
            <Calendar className="text-indigo-600" size={24} />
          </div>
          <div>
            <p className="text-sm font-bold text-indigo-900/60 uppercase tracking-wider">Total Days</p>
            <p className="text-3xl font-black text-indigo-900">{analytics?.summary?.totalDays || 0}</p>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-gradient-to-br from-emerald-50 to-teal-50 p-6 rounded-2xl border border-emerald-100 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center shadow-sm">
            <Users className="text-emerald-600" size={24} />
          </div>
          <div>
            <p className="text-sm font-bold text-emerald-900/60 uppercase tracking-wider">Total Students</p>
            <p className="text-3xl font-black text-emerald-900">{analytics?.summary?.totalStudents || 0}</p>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-gradient-to-br from-amber-50 to-orange-50 p-6 rounded-2xl border border-amber-100 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center shadow-sm">
            <TrendingUp className="text-amber-600" size={24} />
          </div>
          <div>
            <p className="text-sm font-bold text-amber-900/60 uppercase tracking-wider">Avg Attendance</p>
            <p className="text-3xl font-black text-amber-900">{analytics?.summary?.averageAttendance?.toFixed(1) || 0}%</p>
          </div>
        </motion.div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2"><TrendingUp size={20} className="text-blue-600"/> Daily Attendance Trends</h3>
          
          {analytics?.dailyStats?.length > 0 ? (
            <div className="h-64 flex items-end gap-2 pb-6 border-b border-slate-100">
              {analytics.dailyStats.slice(-14).map((day, index) => {
                const presentPct = (day.present / day.total) * 100 || 0;
                const partialPct = (day.partial / day.total) * 100 || 0;
                const absentPct = (day.absent / day.total) * 100 || 0;
                
                return (
                  <div key={day.date} className="flex-1 flex flex-col items-center gap-2 group relative">
                    {/* Tooltip */}
                    <div className="absolute bottom-full mb-2 bg-slate-800 text-white text-xs p-2 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 w-max text-center">
                      <p className="font-bold">{new Date(day.date).toLocaleDateString()}</p>
                      <p className="text-emerald-400">Present: {day.present}</p>
                      <p className="text-amber-400">Partial: {day.partial}</p>
                      <p className="text-red-400">Absent: {day.absent}</p>
                    </div>

                    <div className="w-full h-48 flex flex-col justify-end rounded-md overflow-hidden bg-slate-100">
                      <motion.div initial={{ height: 0 }} animate={{ height: `${presentPct}%` }} transition={{ duration: 0.5, delay: index * 0.05 }} className="w-full bg-emerald-500"></motion.div>
                      <motion.div initial={{ height: 0 }} animate={{ height: `${partialPct}%` }} transition={{ duration: 0.5, delay: index * 0.05 }} className="w-full bg-amber-500"></motion.div>
                      <motion.div initial={{ height: 0 }} animate={{ height: `${absentPct}%` }} transition={{ duration: 0.5, delay: index * 0.05 }} className="w-full bg-red-500"></motion.div>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 -rotate-45 origin-top-left mt-2">
                      {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400">
              <BarChart3 size={48} className="mb-4 opacity-50" />
              <p className="font-medium">No attendance data for this period</p>
            </div>
          )}

          <div className="flex justify-center gap-6 mt-6">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-600"><div className="w-3 h-3 rounded bg-emerald-500"></div> Present</div>
            <div className="flex items-center gap-2 text-sm font-bold text-slate-600"><div className="w-3 h-3 rounded bg-amber-500"></div> Partial</div>
            <div className="flex items-center gap-2 text-sm font-bold text-slate-600"><div className="w-3 h-3 rounded bg-red-500"></div> Absent</div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2"><UserCheck size={20} className="text-blue-600"/> Top Performers</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            <div className="space-y-2">
              {analytics?.studentStats?.sort((a,b) => b.percentage - a.percentage).slice(0, 10).map((student, idx) => (
                <div key={student.student._id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">
                      {idx + 1}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-800 text-sm truncate">{student.student.name}</p>
                      <p className="text-[10px] font-bold text-slate-400">Total: {student.total} days</p>
                    </div>
                  </div>
                  <div className={`px-2 py-1 rounded-md text-xs font-bold ${student.percentage >= 75 ? 'bg-emerald-100 text-emerald-700' : student.percentage >= 60 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                    {student.percentage}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2"><Users size={20} className="text-blue-600"/> Student Performance Matrix</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200">
                <th className="p-4 font-bold">Student Name</th>
                <th className="p-4 font-bold text-center">Total Days</th>
                <th className="p-4 font-bold text-center text-emerald-600"><CheckCircle2 size={14} className="inline mr-1"/> Present</th>
                <th className="p-4 font-bold text-center text-amber-600"><AlertTriangle size={14} className="inline mr-1"/> Partial</th>
                <th className="p-4 font-bold text-center text-red-600"><XCircle size={14} className="inline mr-1"/> Absent</th>
                <th className="p-4 font-bold text-right">Attendance %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {analytics?.studentStats?.map((student) => (
                <tr key={student.student._id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-4">
                    <p className="font-bold text-slate-800">{student.student.name}</p>
                    <p className="text-xs text-slate-500">{student.student.email}</p>
                  </td>
                  <td className="p-4 text-center font-bold text-slate-600">{student.total}</td>
                  <td className="p-4 text-center font-bold text-emerald-600 bg-emerald-50/30">{student.present}</td>
                  <td className="p-4 text-center font-bold text-amber-600 bg-amber-50/30">{student.partial}</td>
                  <td className="p-4 text-center font-bold text-red-600 bg-red-50/30">{student.absent}</td>
                  <td className="p-4 text-right">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${student.percentage >= 75 ? 'bg-emerald-100 text-emerald-700' : student.percentage >= 60 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                      {student.percentage}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
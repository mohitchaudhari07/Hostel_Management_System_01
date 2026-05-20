import { useState, useEffect } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Coffee, Sun, Moon, CheckCircle, Calendar, 
  Loader2, AlertCircle, Utensils, UserCheck, 
  UtensilsCrossed, Settings, LayoutDashboard
} from "lucide-react";
import DashboardLayout from "../components/layout/DashboardLayout";

export default function MessStaffDashboard() {
  const user = JSON.parse(localStorage.getItem("user")) || {};
  const [weekMenus, setWeekMenus] = useState([]);
  const [attendanceSummary, setAttendanceSummary] = useState(null);
  const [currentDay] = useState(new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase());
  const [loading, setLoading] = useState(true);
  const [activeMenu, setActiveMenu] = useState("dashboard");

  useEffect(() => {
    fetchMenus();
    fetchAttendanceSummary();
  }, []);

  const fetchMenus = async () => {
    try {
      const response = await axios.get("/mess/menus", {
        headers: { "x-user-id": user.id, "x-user-role": user.role }
      });
      setWeekMenus(response.data);
    } catch (error) {
      console.error("Error fetching menus:", error);
    }
  };

  const fetchAttendanceSummary = async () => {
    try {
      const response = await axios.get("/mess/attendance/summary", {
        headers: { "x-user-id": user.id, "x-user-role": user.role }
      });
      setAttendanceSummary(response.data.summary);
    } catch (error) {
      console.error("Error fetching attendance summary:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateMenuStatus = async (menuId, day, meal, status) => {
    try {
      await axios.put(`/mess/menus/${menuId}`, { day, meal, status }, {
        headers: { "x-user-id": user.id, "x-user-role": user.role }
      });
      fetchMenus();
    } catch (error) {
      alert("Error updating menu status: " + (error.response?.data?.message || "Unknown error"));
    }
  };

  const markAttendance = async (mealType) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      await axios.post("/mess/attendance", {
        date: today,
        mealType,
        attendees: []
      }, {
        headers: { "x-user-id": user.id, "x-user-role": user.role }
      });
      alert("Attendance marked successfully!");
      fetchAttendanceSummary();
    } catch (error) {
      alert("Error marking attendance: " + (error.response?.data?.message || "Unknown error"));
    }
  };

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center font-sans">
        <Loader2 className="animate-spin text-blue-600 mb-4" size={48} />
        <p className="text-slate-600 font-medium">Loading mess staff dashboard...</p>
      </div>
    );
  }

  return (
    <DashboardLayout menuItems={menuItems} activeMenu={activeMenu} setActiveMenu={setActiveMenu} user={user}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Mess Staff Dashboard</h1>
          <p className="text-slate-500 font-medium mt-1">Manage attendance and track daily food preparation</p>
        </div>

        {/* Quick Actions & Attendance Summary */}
        <div className="grid lg:grid-cols-2 gap-6">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
              <UserCheck className="text-blue-600" /> Mark Attendance
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { type: 'breakfast', icon: Coffee, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', hover: 'hover:bg-amber-100 hover:border-amber-300' },
                { type: 'lunch', icon: Sun, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', hover: 'hover:bg-emerald-100 hover:border-emerald-300' },
                { type: 'dinner', icon: Moon, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-200', hover: 'hover:bg-indigo-100 hover:border-indigo-300' }
              ].map(meal => (
                <button
                  key={meal.type}
                  onClick={() => markAttendance(meal.type)}
                  className={`flex flex-col items-center justify-center gap-3 p-4 rounded-xl border transition-all ${meal.bg} ${meal.border} ${meal.hover} group`}
                >
                  <meal.icon size={28} className={`${meal.color} group-hover:scale-110 transition-transform`} />
                  <span className={`font-bold uppercase text-xs tracking-wider ${meal.color}`}>{meal.type}</span>
                </button>
              ))}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl shadow-sm border border-slate-700 p-6 text-white">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <CheckCircle className="text-emerald-400" /> Today's Attendance Counts
            </h2>
            <div className="grid grid-cols-3 gap-4">
              {[
                { title: 'Breakfast', count: attendanceSummary?.breakfast || 0, color: 'text-amber-400', icon: Coffee },
                { title: 'Lunch', count: attendanceSummary?.lunch || 0, color: 'text-emerald-400', icon: Sun },
                { title: 'Dinner', count: attendanceSummary?.dinner || 0, color: 'text-indigo-400', icon: Moon }
              ].map((stat, i) => (
                <div key={i} className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                  <stat.icon size={20} className={`${stat.color} mb-2`} />
                  <p className="text-3xl font-black">{stat.count}</p>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mt-1">{stat.title}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Weekly Menu and Status */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
            <UtensilsCrossed className="text-blue-600" /> Kitchen Preparation Status
          </h2>
          
          {weekMenus.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <Utensils className="mx-auto text-slate-300 mb-3" size={40} />
              <p className="text-slate-500 font-medium">No active menus available to manage</p>
            </div>
          ) : (
            <div className="space-y-6">
              {weekMenus.map(menu => (
                <div key={menu._id} className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center gap-3">
                    <Calendar className="text-slate-500" size={20} />
                    <h3 className="font-bold text-slate-800">
                      Week of {new Date(menu.weekOf).toLocaleDateString()}
                    </h3>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {['monday','tuesday','wednesday','thursday','friday','saturday','sunday'].map(d => {
                        const isCurrent = d === currentDay;
                        return (
                          <div key={d} className={`rounded-xl border p-5 ${isCurrent ? 'bg-amber-50/50 border-amber-200 shadow-sm' : 'bg-white border-slate-200'}`}>
                            <h4 className={`font-bold text-lg mb-4 flex items-center gap-2 ${isCurrent ? 'text-amber-600' : 'text-slate-800'}`}>
                              {d.charAt(0).toUpperCase() + d.slice(1)}
                              {isCurrent && <span className="bg-amber-100 text-amber-600 text-xs px-2 py-0.5 rounded-full">Today</span>}
                            </h4>
                            
                            <div className="space-y-4">
                              {['breakfast', 'lunch', 'dinner'].map(meal => (
                                <div key={meal} className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                                  <div className="flex justify-between items-start mb-2">
                                    <span className="text-xs font-bold uppercase text-slate-500 tracking-wider">{meal}</span>
                                  </div>
                                  <p className="text-sm font-semibold text-slate-800 mb-3 line-clamp-2">
                                    {menu.days?.[d]?.[meal] || 'No items'}
                                  </p>
                                  <select
                                    value={menu.days?.[d]?.[`${meal}Status`] || 'pending'}
                                    onChange={(e) => updateMenuStatus(menu._id, d, meal, e.target.value)}
                                    className={`w-full text-xs font-bold rounded-lg px-2 py-2 outline-none border focus:ring-2 focus:ring-blue-500/20 transition-colors ${
                                      menu.days?.[d]?.[`${meal}Status`] === 'served' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                      menu.days?.[d]?.[`${meal}Status`] === 'ready' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                      menu.days?.[d]?.[`${meal}Status`] === 'preparing' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                      'bg-slate-100 text-slate-600 border-slate-200'
                                    }`}
                                  >
                                    <option value="pending">Pending</option>
                                    <option value="preparing">Preparing</option>
                                    <option value="ready">Ready</option>
                                    <option value="served">Served</option>
                                  </select>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </DashboardLayout>
  );
}

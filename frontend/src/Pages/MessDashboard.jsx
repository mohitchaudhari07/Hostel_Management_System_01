import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { 
  LayoutDashboard, Utensils, Users, ClipboardList, 
  Coffee, Beef, EggFried, MessageSquareWarning, 
  AlertCircle, RefreshCw, Calendar, Info, Sparkles
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import MessSmartAdmin from "./MessSmartAdmin";
import MessMenuManagement from "./MessMenuManagement";
import DashboardLayout from "../components/layout/DashboardLayout";

const SAMPLE_DASHBOARD = {
  totalStudents: 250,
  messRegistered: 220,
  breakfast: 180,
  lunch: 195,
  dinner: 200,
  complaints: 4,
  menu: "Aloo Paratha / Dal Chawal / Paneer Tikka",
};

export default function MessDashboard() {
  const navigate = useNavigate();
  const user = useMemo(() => JSON.parse(localStorage.getItem("user") || "{}"), []);
  const [metrics, setMetrics] = useState(SAMPLE_DASHBOARD);
  const [todayDate, setTodayDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [activeMenu, setActiveMenu] = useState("overview");

  useEffect(() => {
    const today = new Date();
    setTodayDate(
      today.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })
    );

    refreshDashboard();
    const interval = setInterval(refreshDashboard, 30 * 1000);
    return () => clearInterval(interval);
  }, []);

  const authHeaders = user?.id && user?.role ? { "x-user-id": user.id, "x-user-role": user.role } : {};

  const refreshDashboard = async () => {
    try {
      setLoading(true);
      setError(null);

      const [studentsRes, mealRes, menuRes, complaintsRes] = await Promise.allSettled([
        axios.get("/auth/students"),
        axios.get("/mess/attendance", {
          params: { date: new Date().toISOString().split("T")[0] },
          headers: authHeaders,
        }),
        axios.get("/mess/menus", { headers: authHeaders }),
        axios.get("/mess/feedbacks", { headers: authHeaders }),
      ]);

      let totalStudents = SAMPLE_DASHBOARD.totalStudents;
      let messRegistered = SAMPLE_DASHBOARD.messRegistered;
      if (studentsRes.status === "fulfilled" && Array.isArray(studentsRes.value.data)) {
        const students = studentsRes.value.data;
        totalStudents = students.length;
        messRegistered = students.filter(s => (s.messFeeAmount || 0) > 0 || (s.messFeePaid || 0) > 0).length;
      }

      let breakfast = SAMPLE_DASHBOARD.breakfast;
      let lunch = SAMPLE_DASHBOARD.lunch;
      let dinner = SAMPLE_DASHBOARD.dinner;
      if (mealRes.status === "fulfilled" && Array.isArray(mealRes.value.data?.attendance)) {
        const records = mealRes.value.data.attendance;
        breakfast = records.filter(r => r.meals?.breakfast?.attended).length;
        lunch = records.filter(r => r.meals?.lunch?.attended).length;
        dinner = records.filter(r => r.meals?.dinner?.attended).length;
      }

      let complaints = SAMPLE_DASHBOARD.complaints;
      if (complaintsRes.status === "fulfilled" && Array.isArray(complaintsRes.value.data?.feedbacks)) {
        complaints = complaintsRes.value.data.feedbacks.length;
      }

      let menu = SAMPLE_DASHBOARD.menu;
      if (menuRes.status === "fulfilled" && Array.isArray(menuRes.value.data?.menus)) {
        const todayName = new Date().toLocaleDateString("en-US", { weekday: "long" });
        const todays = menuRes.value.data.menus
          .flatMap(week => week.days || [])
          .find(d => d.day?.toLowerCase() === todayName.toLowerCase());
        if (todays?.items?.length) {
          menu = todays.items.join(" / ");
        }
      }

      setMetrics({ totalStudents, messRegistered, breakfast, lunch, dinner, complaints, menu });
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Mess dashboard load failed", err);
      setError("Live data unavailable. Showing sample numbers.");
      setMetrics(SAMPLE_DASHBOARD);
    } finally {
      setLoading(false);
    }
  };

  const menuItems = [
    { id: "overview", label: "Dashboard", icon: LayoutDashboard },
    { id: "menu", label: "Weekly Menu", icon: Utensils },
    { id: "ai", label: "AI Analytics", icon: Sparkles },
  ];

  return (
    <DashboardLayout menuItems={menuItems} activeMenu={activeMenu} setActiveMenu={setActiveMenu} user={user}>
      {activeMenu === "overview" && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-800">Mess Dashboard</h1>
              <p className="text-slate-500 font-medium mt-1">Overview • Auto-updates every 30s</p>
            </div>
            <button
              onClick={refreshDashboard}
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-700 font-semibold shadow-sm transition-colors"
            >
              <RefreshCw size={18} className={`${loading ? "animate-spin text-blue-500" : ""}`} />
              {loading ? "Updating..." : "Refresh"}
            </button>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between md:items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                <Calendar size={24} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Today</p>
                <p className="text-lg font-bold text-slate-800">{todayDate}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100 font-semibold text-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              {loading ? "Syncing..." : `Live · ${lastUpdated.toLocaleTimeString("en-US")}`}
            </div>
          </div>

          {error && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3 text-red-700">
              <AlertCircle className="shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold">Error loading live data</h3>
                <p className="text-sm font-medium opacity-90">{error}</p>
              </div>
            </motion.div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { label: "Total Hostel Students", value: metrics.totalStudents, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
              { label: "Students Registered for Mess", value: metrics.messRegistered, icon: ClipboardList, color: "text-indigo-600", bg: "bg-indigo-50" },
              { label: "Today Breakfast Count", value: metrics.breakfast, icon: Coffee, color: "text-amber-600", bg: "bg-amber-50" },
              { label: "Today Lunch Count", value: metrics.lunch, icon: EggFried, color: "text-emerald-600", bg: "bg-emerald-50" },
              { label: "Today Dinner Count", value: metrics.dinner, icon: Beef, color: "text-purple-600", bg: "bg-purple-50" },
              { label: "Pending Complaints", value: metrics.complaints, icon: MessageSquareWarning, color: "text-orange-600", bg: "bg-orange-50" }
            ].map((metric, idx) => (
              <motion.div key={idx} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-xl ${metric.bg} ${metric.color}`}>
                    <metric.icon size={24} />
                  </div>
                  <span className="text-sm font-bold text-slate-500 leading-tight">{metric.label}</span>
                </div>
                <div className={`text-4xl font-black ${metric.color}`}>{metric.value}</div>
              </motion.div>
            ))}

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="lg:col-span-3 bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-6 rounded-2xl shadow-lg shadow-blue-500/20">
              <div className="flex items-center gap-3 mb-3">
                <Utensils size={24} />
                <h3 className="text-xl font-bold">Today's Menu</h3>
              </div>
              <p className="text-lg font-medium text-blue-50">{metrics.menu}</p>
            </motion.div>
          </div>

          <div className="flex flex-wrap gap-3">
            {[
              "Real-time: counts update when meals are marked",
              "Auto-refresh: every 30s",
              "Manual refresh available"
            ].map((info, i) => (
              <div key={i} className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-sm font-semibold border border-slate-200">
                <Info size={16} /> {info}
              </div>
            ))}
          </div>
        </div>
      )}

      {activeMenu === "menu" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <MessMenuManagement embedded />
        </motion.div>
      )}

      {activeMenu === "ai" && (
        <div className="space-y-4">
          <button
            type="button"
            onClick={() => navigate("/mess/ai-analytics")}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold text-sm"
          >
            Open Full AI Analytics
          </button>
          <MessSmartAdmin embedded />
        </div>
      )}
    </DashboardLayout>
  );
}

import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { Bar, Doughnut, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import {
  BarChart3,
  Brain,
  RefreshCw,
  Sun,
  Moon,
  Loader2,
  TrendingUp,
  Utensils,
  ArrowLeft,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { cn } from "../lib/utils";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

export default function MessSmartAdmin({ embedded = false }) {
  const navigate = useNavigate();
  const { darkMode, toggleTheme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [demand, setDemand] = useState(null);
  const [weeklySuggestions, setWeeklySuggestions] = useState(null);
  const [syncing, setSyncing] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [aRes, dRes] = await Promise.all([
        axios.get("/mess-ai/analytics"),
        axios.get("/mess-ai/demand-prediction"),
      ]);
      setAnalytics(aRes.data.analytics);
      setDemand(dRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 45000);
    return () => clearInterval(t);
  }, [load]);

  const syncMenu = async () => {
    setSyncing(true);
    try {
      await axios.post("/mess-ai/food-items/sync");
      await load();
    } finally {
      setSyncing(false);
    }
  };

  const fetchWeeklyAI = async () => {
    try {
      const res = await axios.post("/mess-ai/weekly-suggestions");
      setWeeklySuggestions(res.data);
    } catch {
      alert("Could not generate weekly suggestions");
    }
  };

  const pageBg = darkMode
    ? "bg-gradient-to-br from-slate-950 via-indigo-950 to-violet-950 min-h-full"
    : "bg-gradient-to-br from-slate-50 via-blue-50 to-violet-50 min-h-full";

  const card = cn(
    "rounded-2xl border p-6 shadow-lg",
    darkMode ? "bg-slate-900/90 border-slate-700" : "bg-white border-slate-200",
  );

  const textMain = darkMode ? "text-white" : "text-slate-900";
  const textMuted = darkMode ? "text-slate-400" : "text-slate-500";

  const popularityData = {
    labels: (analytics?.topMeals || []).map((m) => m.name?.slice(0, 12)),
    datasets: [
      {
        label: "Popularity Score",
        data: (analytics?.topMeals || []).map((m) => m.popularityScore || 0),
        backgroundColor: "rgba(99, 102, 241, 0.7)",
        borderRadius: 8,
      },
    ],
  };

  const starData = {
    labels: (analytics?.starDistribution || []).map((s) => `${s.star}★`),
    datasets: [
      {
        data: (analytics?.starDistribution || []).map((s) => s.count),
        backgroundColor: ["#f87171", "#fb923c", "#fbbf24", "#a3e635", "#34d399"],
      },
    ],
  };

  const sentimentData = {
    labels: (analytics?.sentimentBreakdown || []).map((s) => s.sentiment),
    datasets: [
      {
        label: "Reviews",
        data: (analytics?.sentimentBreakdown || []).map((s) => s.count),
        borderColor: "#8b5cf6",
        backgroundColor: "rgba(139, 92, 246, 0.2)",
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const demandChart = {
    labels: (demand?.predictions || []).map((p) => p.mealSlot),
    datasets: [
      {
        label: "Estimated plates",
        data: (demand?.predictions || []).map((p) => p.totalEstimated),
        backgroundColor: ["#6366f1", "#8b5cf6", "#a855f7"],
        borderRadius: 10,
      },
    ],
  };

  const content = (
    <div className={cn("p-6 space-y-6", !embedded && pageBg)}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-violet-500">HostelSync AI</p>
          <h1 className={cn("text-2xl font-bold", textMain)}>Mess Analytics & Demand Intelligence</h1>
          <p className={cn("text-sm", textMuted)}>Real-time food insights for mess managers</p>
        </div>
        <div className="flex gap-2">
          {!embedded && (
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="p-2.5 rounded-xl border border-slate-300 dark:border-slate-600"
            >
              <ArrowLeft size={18} />
            </button>
          )}
          <button type="button" onClick={toggleTheme} className="p-2.5 rounded-xl border border-violet-500/40">
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button
            type="button"
            onClick={syncMenu}
            disabled={syncing}
            className="px-4 py-2 rounded-xl bg-slate-800 text-white text-sm disabled:opacity-50"
          >
            {syncing ? "Syncing..." : "Sync Menu Items"}
          </button>
          <button
            type="button"
            onClick={fetchWeeklyAI}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm flex items-center gap-2"
          >
            <Brain size={16} /> AI Weekly Menu
          </button>
          <button type="button" onClick={load} className="p-2.5 rounded-xl border border-violet-500/40">
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {loading && !analytics ? (
        <motion.div className="flex justify-center py-16">
          <Loader2 className="animate-spin text-violet-500" size={36} />
        </motion.div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Food Items", value: analytics?.totals?.foodItems || 0, icon: Utensils },
              { label: "Total Ratings", value: analytics?.totals?.ratings || 0, icon: BarChart3 },
              { label: "Reviews", value: analytics?.totals?.reviews || 0, icon: Brain },
              { label: "Avg Rating", value: analytics?.avgRating || "—", icon: TrendingUp },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className={card}
              >
                <stat.icon className="text-violet-500 mb-2" size={22} />
                <p className={cn("text-2xl font-bold", textMain)}>{stat.value}</p>
                <p className={cn("text-sm", textMuted)}>{stat.label}</p>
              </motion.div>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <div className={card}>
              <h3 className={cn("font-bold mb-4", textMain)}>Meal Popularity</h3>
              <Bar data={popularityData} options={{ responsive: true, plugins: { legend: { display: false } } }} />
            </div>
            <div className={card}>
              <h3 className={cn("font-bold mb-4", textMain)}>Star Distribution</h3>
              <Doughnut data={starData} />
            </div>
            <div className={card}>
              <h3 className={cn("font-bold mb-4", textMain)}>Review Sentiment Insights</h3>
              <Line data={sentimentData} options={{ responsive: true }} />
            </div>
            <div className={card}>
              <h3 className={cn("font-bold mb-4", textMain)}>Demand Prediction (Wastage Control)</h3>
              <Bar data={demandChart} options={{ responsive: true, plugins: { legend: { display: false } } }} />
              <div className="mt-4 space-y-2">
                {(demand?.predictions || []).map((slot) => (
                  <div key={slot.mealSlot} className={cn("text-sm rounded-lg p-2", darkMode ? "bg-slate-800" : "bg-slate-50")}>
                    <span className="font-semibold capitalize">{slot.mealSlot}</span>: ~{slot.totalEstimated} plates
                    <ul className="mt-1 text-xs text-violet-500">
                      {(slot.items || []).slice(0, 3).map((it, j) => (
                        <li key={j}>
                          {it.name} — {it.estimatedPlates} est. · wastage: {it.wastageRisk}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className={card}>
            <h3 className={cn("font-bold mb-4", textMain)}>Recent Reviews (AI Sentiment)</h3>
            <div className="space-y-3 max-h-64 overflow-y-auto custom-scrollbar">
              {(analytics?.recentReviews || []).map((r) => (
                <div
                  key={r._id}
                  className={cn(
                    "p-3 rounded-xl border text-sm",
                    r.sentiment === "positive"
                      ? "border-emerald-500/30 bg-emerald-500/10"
                      : r.sentiment === "negative"
                        ? "border-rose-500/30 bg-rose-500/10"
                        : "border-slate-500/20",
                  )}
                >
                  <span className="font-medium capitalize text-violet-500">{r.sentiment}</span>
                  <p className={cn("mt-1", textMain)}>{r.text}</p>
                  {r.aiSummary && <p className={cn("text-xs mt-1", textMuted)}>AI: {r.aiSummary}</p>}
                </div>
              ))}
            </div>
          </div>

          {weeklySuggestions?.suggestions && (
            <div className={card}>
              <h3 className={cn("font-bold mb-2", textMain)}>AI Weekly Menu Suggestions</h3>
              <p className={cn("text-sm mb-4", textMuted)}>{weeklySuggestions.notes}</p>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                {weeklySuggestions.suggestions.map((day) => (
                  <div key={day.day} className={cn("p-3 rounded-xl text-sm", darkMode ? "bg-slate-800" : "bg-indigo-50")}>
                    <p className="font-bold capitalize">{day.day}</p>
                    <p className="text-xs mt-1">B: {(day.breakfast || []).join(", ")}</p>
                    <p className="text-xs">L: {(day.lunch || []).join(", ")}</p>
                    <p className="text-xs">D: {(day.dinner || []).join(", ")}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );

  return content;
}

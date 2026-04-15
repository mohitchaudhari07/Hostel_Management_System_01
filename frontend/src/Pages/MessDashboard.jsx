import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import MessMenuManagement from "./MessMenuManagement";

const SAMPLE_DASHBOARD = {
  totalStudents: 250,
  messRegistered: 220,
  breakfast: 180,
  lunch: 195,
  dinner: 200,
  complaints: 4,
  menu: "Aloo Paratha / Dal Chawal / Paneer Tikka",
};

function MessDashboard() {
  const user = useMemo(
    () => JSON.parse(localStorage.getItem("user") || "{}"),
    []
  );
  const [metrics, setMetrics] = useState(SAMPLE_DASHBOARD);
  const [todayDate, setTodayDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [activeTab, setActiveTab] = useState("overview"); // "overview" | "menu"

  useEffect(() => {
    const today = new Date();
    setTodayDate(
      today.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    );

    refreshDashboard();
    const interval = setInterval(refreshDashboard, 30 * 1000); // near real-time
    return () => clearInterval(interval);
  }, []);

  const authHeaders =
    user?.id && user?.role
      ? { "x-user-id": user.id, "x-user-role": user.role }
      : {};

  const refreshDashboard = async () => {
    try {
      setLoading(true);
      setError(null);

      const [studentsRes, mealRes, menuRes, complaintsRes] = await Promise.allSettled([
        axios.get("http://localhost:5000/api/auth/students"),
        axios.get("http://localhost:5000/api/mess/attendance", {
          params: { date: new Date().toISOString().split("T")[0] },
          headers: authHeaders,
        }),
        axios.get("http://localhost:5000/api/mess/menus", { headers: authHeaders }),
        axios.get("http://localhost:5000/api/mess/feedbacks", { headers: authHeaders }),
      ]);

      // Total students & mess-registered approximation
      let totalStudents = SAMPLE_DASHBOARD.totalStudents;
      let messRegistered = SAMPLE_DASHBOARD.messRegistered;
      if (studentsRes.status === "fulfilled" && Array.isArray(studentsRes.value.data)) {
        const students = studentsRes.value.data;
        totalStudents = students.length;
        messRegistered = students.filter(
          (s) => (s.messFeeAmount || 0) > 0 || (s.messFeePaid || 0) > 0
        ).length;
      }

      // Meal counts
      let breakfast = SAMPLE_DASHBOARD.breakfast;
      let lunch = SAMPLE_DASHBOARD.lunch;
      let dinner = SAMPLE_DASHBOARD.dinner;
      if (
        mealRes.status === "fulfilled" &&
        Array.isArray(mealRes.value.data?.attendance)
      ) {
        const records = mealRes.value.data.attendance;
        breakfast = records.filter((r) => r.meals?.breakfast?.attended).length;
        lunch = records.filter((r) => r.meals?.lunch?.attended).length;
        dinner = records.filter((r) => r.meals?.dinner?.attended).length;
      }

      // Complaints/feedback
      let complaints = SAMPLE_DASHBOARD.complaints;
      if (
        complaintsRes.status === "fulfilled" &&
        Array.isArray(complaintsRes.value.data?.feedbacks)
      ) {
        complaints = complaintsRes.value.data.feedbacks.length;
      }

      // Today's menu
      let menu = SAMPLE_DASHBOARD.menu;
      if (
        menuRes.status === "fulfilled" &&
        Array.isArray(menuRes.value.data?.menus)
      ) {
        const todayName = new Date().toLocaleDateString("en-US", {
          weekday: "long",
        });
        const todays = menuRes.value.data.menus
          .flatMap((week) => week.days || [])
          .find((d) => d.day?.toLowerCase() === todayName.toLowerCase());
        if (todays?.items?.length) {
          menu = todays.items.join(" / ");
        }
      }

      setMetrics({
        totalStudents,
        messRegistered,
        breakfast,
        lunch,
        dinner,
        complaints,
        menu,
      });
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Mess dashboard load failed", err);
      setError("Live data unavailable. Showing sample numbers.");
      setMetrics(SAMPLE_DASHBOARD);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    window.location.href = "/";
  };

  return (
    <div style={styles.shell}>
      <aside style={styles.sidebar}>
        <div style={styles.brand}>
          <div style={styles.brandIcon}>🍽️</div>
          <div>
            <div style={styles.brandTitle}>Mess Desk</div>
            <div style={styles.brandSub}>Live Service</div>
          </div>
        </div>
        <nav style={styles.nav}>
          <button
            style={{ ...styles.navItem, ...(activeTab === "overview" ? styles.navActive : {}) }}
            onClick={() => setActiveTab("overview")}
          >
            📊 Dashboard
          </button>
          <button
            style={{ ...styles.navItem, ...(activeTab === "menu" ? styles.navActive : {}) }}
            onClick={() => setActiveTab("menu")}
          >
            🍱 Weekly Menu
          </button>
        </nav>
        <div style={styles.sidebarFooter}>
          <button style={styles.logoutBtn} onClick={handleLogout}>🚪 Logout</button>
        </div>
      </aside>

      <main style={styles.main}>
        <div style={styles.topbar}>
          <div>
            <h1 style={styles.title}>Mess Dashboard</h1>
            <p style={styles.subtitle}>Overview • Auto-updates every 30s</p>
          </div>
          <div style={styles.actions}>
            <button
              style={{ ...styles.secondaryBtn, ...(activeTab === "menu" ? styles.navActive : {}) }}
              onClick={() => setActiveTab(activeTab === "menu" ? "overview" : "menu")}
            >
              {activeTab === "menu" ? "← Back to Overview" : "🍱 Weekly Menu"}
            </button>
            {activeTab === "overview" && (
              <button style={styles.refreshBtn} onClick={refreshDashboard} disabled={loading}>
                {loading ? "⟳ Updating..." : "⟳ Refresh"}
              </button>
            )}
          </div>
        </div>

        {activeTab === "overview" && (
          <>
            <div style={styles.dateCard}>
              <div style={styles.dateLeft}>
                <div style={styles.dateIcon}>📅</div>
                <div>
                  <p style={styles.dateLabel}>Today</p>
                  <p style={styles.dateValue}>{todayDate}</p>
                </div>
              </div>
              <div style={styles.updatePill}>
                <span style={styles.dotLive}></span>
                {loading ? "Syncing…" : `Live · ${lastUpdated.toLocaleTimeString("en-US")}`}
              </div>
            </div>

            {error && (
              <div style={styles.errorCard}>
                <div style={styles.errorIcon}>⚠️</div>
                <h3>Error loading live data</h3>
                <p>{error}</p>
              </div>
            )}

            <div style={styles.metricsGrid}>
              {metricCard("Total Hostel Students", metrics.totalStudents, "#1E3A8A", "👥")}
              {metricCard("Students Registered for Mess", metrics.messRegistered, "#2563EB", "📝")}
              {metricCard("Today Breakfast Count", metrics.breakfast, "#0EA5E9", "🍳")}
              {metricCard("Today Lunch Count", metrics.lunch, "#10B981", "🍛")}
              {metricCard("Today Dinner Count", metrics.dinner, "#8B5CF6", "🍲")}
              {metricCard("Pending Complaints", metrics.complaints, "#F97316", "📨")}
              <div style={styles.menuCard}>
                <div style={styles.menuHeader}>
                  <span style={styles.menuIcon}>🍽️</span>
                  <span style={styles.menuTitle}>Today's Menu</span>
                </div>
                <p style={styles.menuBody}>{metrics.menu}</p>
              </div>
            </div>

            <div style={styles.infoRow}>
              <div style={styles.infoBadge}>Real-time: counts update when meals are marked</div>
              <div style={styles.infoBadge}>Auto-refresh: every 30s</div>
              <div style={styles.infoBadge}>Manual refresh available</div>
            </div>
          </>
        )}

        {activeTab === "menu" && (
          <div style={styles.menuPanel}>
            <MessMenuManagement embedded />
          </div>
        )}
      </main>
    </div>
  );
}

const metricCard = (label, value, color, icon) => (
  <div style={{ ...styles.metricCard, borderColor: color, boxShadow: `0 12px 30px ${color}22` }}>
    <div style={styles.metricTop}>
      <div style={{ ...styles.metricIcon, background: color }}>{icon}</div>
      <span style={styles.metricLabel}>{label}</span>
    </div>
    <div style={{ ...styles.metricValue, color }}>{value}</div>
  </div>
);

const styles = {
  shell: {
    minHeight: "100vh",
    background: "radial-gradient(circle at 20% 20%, #0f172a 0%, #0b1224 25%, #0b1020 60%, #091023 100%)",
    display: "grid",
    gridTemplateColumns: "260px 1fr",
  },
  sidebar: {
    background: "rgba(9,12,24,0.9)",
    backdropFilter: "blur(8px)",
    borderRight: "1px solid rgba(255,255,255,0.06)",
    padding: "22px 18px",
    display: "flex",
    flexDirection: "column",
    gap: "22px",
    boxShadow: "12px 0 32px rgba(0,0,0,0.35)",
  },
  brand: { display: "flex", gap: "12px", alignItems: "center" },
  brandIcon: {
    width: "44px",
    height: "44px",
    borderRadius: "12px",
    background: "linear-gradient(135deg,#1d4ed8,#3b82f6)",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "22px",
    boxShadow: "0 8px 18px rgba(59,130,246,0.25)",
  },
  brandTitle: { color: "white", fontWeight: 800, fontSize: "16px" },
  brandSub: { color: "#94a3b8", fontSize: "12px" },
  nav: { display: "flex", flexDirection: "column", gap: "8px" },
  navItem: {
    border: "1px solid #1f2937",
    background: "transparent",
    color: "#e2e8f0",
    padding: "12px",
    borderRadius: "12px",
    textAlign: "left",
    cursor: "pointer",
    fontWeight: 700,
  },
  navActive: {
    background: "linear-gradient(135deg,#22d3ee22,#3b82f622)",
    borderColor: "#3b82f6",
    color: "white",
  },
  sidebarFooter: { marginTop: "auto" },
  main: {
    padding: "26px",
    color: "#0b1021",
  },
  topbar: {
    background: "linear-gradient(135deg, rgba(255,255,255,0.97), rgba(243,246,255,0.95))",
    borderRadius: "18px",
    padding: "18px 22px",
    marginBottom: "18px",
    boxShadow: "0 18px 48px rgba(0,0,0,0.15)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "16px",
  },
  title: { margin: 0, fontSize: "26px", fontWeight: 800, color: "#0f172a" },
  subtitle: { margin: 0, color: "#475569", fontSize: "14px", fontWeight: 600 },
  actions: { display: "flex", gap: "10px", alignItems: "center" },
  refreshBtn: {
    padding: "10px 16px",
    borderRadius: "10px",
    border: "none",
    background: "linear-gradient(135deg,#2563eb,#0ea5e9)",
    color: "white",
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: "0 10px 24px rgba(37,99,235,0.35)",
  },
  logoutBtn: {
    padding: "10px 16px",
    borderRadius: "10px",
    border: "none",
    background: "linear-gradient(135deg,#ef4444,#dc2626)",
    color: "white",
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: "0 10px 24px rgba(239,68,68,0.35)",
  },
  sidebarLogout: {
    width: "100%",
  },
  secondaryBtn: {
    padding: "10px 16px",
    borderRadius: "10px",
    border: "1px solid #cbd5e1",
    background: "white",
    color: "#0f172a",
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: "0 8px 20px rgba(15,23,42,0.08)",
  },
  mainContent: {
    maxWidth: "1100px",
    margin: "0 auto",
  },
  dateCard: {
    background: "rgba(255, 255, 255, 0.96)",
    borderRadius: "16px",
    padding: "16px 18px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "18px",
    boxShadow: "0 12px 28px rgba(0,0,0,0.12)",
  },
  dateLeft: { display: "flex", alignItems: "center", gap: "12px" },
  dateIcon: { fontSize: "30px" },
  dateLabel: { margin: 0, color: "#6b7280", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 700 },
  dateValue: { margin: 0, color: "#0f172a", fontSize: "18px", fontWeight: 800 },
  updatePill: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    background: "#ecfeff",
    color: "#0ea5e9",
    padding: "8px 12px",
    borderRadius: "999px",
    fontWeight: 700,
    fontSize: "12px",
    border: "1px solid #bae6fd",
  },
  dotLive: {
    width: "8px",
    height: "8px",
    background: "#0ea5e9",
    borderRadius: "50%",
    boxShadow: "0 0 0 6px rgba(14,165,233,0.15)",
  },
  metricsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: "16px",
  },
  metricCard: {
    background: "white",
    borderRadius: "16px",
    padding: "16px",
    border: "1px solid rgba(0,0,0,0.04)",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  metricTop: { display: "flex", alignItems: "center", gap: "10px" },
  metricIcon: {
    width: "44px",
    height: "44px",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "white",
    fontSize: "22px",
  },
  metricLabel: { fontSize: "14px", color: "#4b5563", fontWeight: 700 },
  metricValue: { fontSize: "40px", fontWeight: 900, lineHeight: 1, marginTop: "4px" },
  menuCard: {
    background: "linear-gradient(135deg,#0ea5e9 0%,#8b5cf6 100%)",
    color: "white",
    borderRadius: "16px",
    padding: "18px",
    boxShadow: "0 14px 30px rgba(139,92,246,0.35)",
  },
  menuHeader: { display: "flex", alignItems: "center", gap: "10px" },
  menuIcon: { fontSize: "22px" },
  menuTitle: { fontSize: "16px", fontWeight: 800, letterSpacing: "0.3px" },
  menuBody: { marginTop: "8px", fontSize: "15px", fontWeight: 700 },
  infoRow: {
    marginTop: "18px",
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
  },
  infoBadge: {
    background: "#f1f5f9",
    color: "#0f172a",
    padding: "10px 12px",
    borderRadius: "12px",
    fontWeight: 700,
    fontSize: "13px",
    border: "1px solid #e2e8f0",
  },
  errorCard: {
    background: "#fff1f2",
    color: "#be123c",
    borderRadius: "12px",
    padding: "14px",
    marginBottom: "14px",
    border: "1px solid #fecdd3",
  },
  errorIcon: { fontSize: "22px", marginRight: "8px" },
};

export default MessDashboard;

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const EMPTY_DAY = { breakfast: "", lunch: "", dinner: "" };
const WEEK_TEMPLATE = {
  Monday: { ...EMPTY_DAY },
  Tuesday: { ...EMPTY_DAY },
  Wednesday: { ...EMPTY_DAY },
  Thursday: { ...EMPTY_DAY },
  Friday: { ...EMPTY_DAY },
  Saturday: { ...EMPTY_DAY },
  Sunday: { ...EMPTY_DAY },
};

function MessMenuManagement({ embedded = false }) {
  const user = useMemo(() => JSON.parse(localStorage.getItem("user") || "{}"), []);
  const navigate = useNavigate();

  const [weekOf, setWeekOf] = useState(getMonday(new Date()).toISOString().split("T")[0]);
  const [days, setDays] = useState(WEEK_TEMPLATE);
  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [imagePreview, setImagePreview] = useState(null);

  const headers =
    user?.id && user?.role
      ? { "x-user-id": user.id, "x-user-role": user.role }
      : {};

  useEffect(() => {
    fetchMenus();
  }, []);

  const fetchMenus = async () => {
    try {
      setLoading(true);
      const res = await axios.get("http://localhost:5000/api/mess/menus", { headers });
      const list = res.data?.menus || [];
      setMenus(list);
      if (list.length) {
        hydrateFormFromMenu(list[0]);
      }
    } catch (err) {
      console.error("Failed to load menus", err);
      setMessage("Unable to load menus. You can still create one.");
    } finally {
      setLoading(false);
    }
  };

  const hydrateFormFromMenu = (menu) => {
    if (!menu) return;
    const map = menu.days || {};
    const next = { ...WEEK_TEMPLATE };
    Object.entries(map).forEach(([day, val]) => {
      next[capitalize(day)] = {
        breakfast: (val.breakfast || []).join(" + "),
        lunch: (val.lunch || []).join(" + "),
        dinner: (val.dinner || []).join(" + "),
      };
    });
    setWeekOf(menu.weekOf?.slice(0, 10) || weekOf);
    setDays(next);
  };

  const handleChange = (day, meal, value) => {
    setDays((prev) => ({
      ...prev,
      [day]: { ...prev[day], [meal]: value },
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage("");

      const payload = {
        weekOf,
        days: Object.fromEntries(
          Object.entries(days).map(([day, meals]) => [
            day.toLowerCase(),
            {
              breakfast: splitMeals(meals.breakfast),
              lunch: splitMeals(meals.lunch),
              dinner: splitMeals(meals.dinner),
            },
          ])
        ),
      };

      await axios.post("http://localhost:5000/api/mess/menus", payload, { headers });
      setMessage("Menu saved successfully.");
      fetchMenus();
    } catch (err) {
      console.error("Save failed", err);
      setMessage(err.response?.data?.message || "Failed to save menu");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      setSaving(true);
      await axios.delete(`http://localhost:5000/api/mess/menus/${id}`, { headers });
      setMessage("Menu deleted.");
      fetchMenus();
    } catch (err) {
      setMessage(err.response?.data?.message || "Delete failed");
    } finally {
      setSaving(false);
    }
  };

  const Container = ({ children }) =>
    embedded ? (
      <div style={s.cardEmbed}>{children}</div>
    ) : (
      <div style={s.container}>{children}</div>
    );

  return (
    <Container>
      {!embedded && (
        <div style={s.topbar}>
          <div>
            <h1 style={s.title}>Weekly Menu Management</h1>
            <p style={s.subtitle}>Add, edit, and publish this week’s meals. Optional food images are local-only preview.</p>
          </div>
          <div style={s.actions}>
            <button style={s.outlineBtn} onClick={() => navigate("/mess")}>← Back to Dashboard</button>
            <button style={s.primaryBtn} onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save Menu"}
            </button>
          </div>
        </div>
      )}

      <div style={embedded ? s.cardEmbedInner : s.card}>
        <div style={s.formRow}>
          <label>Week Of</label>
          <input
            type="date"
            value={weekOf}
            onChange={(e) => setWeekOf(e.target.value)}
            style={s.input}
          />
          <span style={s.helpText}>Starts on Monday. Used to version menus.</span>
        </div>

        <div style={s.formRow}>
          <label>Food image (optional, preview only)</label>
          <input
            type="file"
            accept="image/*"
            style={s.input}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return setImagePreview(null);
              const reader = new FileReader();
              reader.onload = (ev) => setImagePreview(ev.target?.result);
              reader.readAsDataURL(file);
            }}
          />
          <span style={s.helpText}>Not uploaded to server; for your visual check.</span>
        </div>

        {imagePreview && (
          <div style={s.imagePreview}>
            <img src={imagePreview} alt="Preview" style={{ maxHeight: 160, borderRadius: 12 }} />
          </div>
        )}

        <div style={s.table}>
          <div style={s.thead}>
            <div>Day</div>
            <div>Breakfast</div>
            <div>Lunch</div>
            <div>Dinner</div>
          </div>
          {Object.keys(days).map((day) => (
            <div key={day} style={s.row}>
              <div style={s.dayCell}>{day}</div>
              {["breakfast", "lunch", "dinner"].map((meal) => (
                <div key={meal} style={s.cell}>
                  <input
                    type="text"
                    placeholder="Items separated by +"
                    value={days[day][meal]}
                    onChange={(e) => handleChange(day, meal, e.target.value)}
                    style={s.input}
                  />
                </div>
              ))}
            </div>
          ))}
        </div>

        <div style={s.noteRow}>
          <div style={s.badge}>Features</div>
          <span>Add / Edit / Delete menu lines. Meal counts stay real-time via dashboard.</span>
        </div>

        {message && <div style={s.message}>{message}</div>}
      </div>

      <div style={embedded ? s.listCardEmbed : s.listCard}>
        <div style={s.listHeader}>
          <h3 style={{ margin: 0 }}>Saved Menus</h3>
          <span style={s.muted}>Click to load, trash to delete</span>
        </div>
        {loading ? (
          <div style={s.muted}>Loading menus…</div>
        ) : menus.length === 0 ? (
          <div style={s.muted}>No menus yet.</div>
        ) : (
          <div style={s.menuGrid}>
            {menus.map((m) => (
              <div key={m._id} style={s.menuCard} onClick={() => hydrateFormFromMenu(m)}>
                <div style={s.menuTop}>
                  <div>
                    <div style={s.menuWeek}>Week of {m.weekOf?.slice(0, 10)}</div>
                    <div style={s.menuMeta}>{Object.keys(m.days || {}).length} days configured</div>
                  </div>
                  <button
                    style={s.trashBtn}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(m._id);
                    }}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {!embedded && (
        <div style={{ marginTop: 12, textAlign: "right" }}>
          <button style={s.primaryBtn} onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Menu"}
          </button>
        </div>
      )}
    </Container>
  );
}

function splitMeals(str) {
  if (!str) return [];
  return str
    .split("+")
    .map((t) => t.trim())
    .filter(Boolean);
}

function getMonday(d) {
  const date = new Date(d);
  const day = date.getDay();
  const diff = (day === 0 ? -6 : 1) - day; // adjust when day is Sunday
  date.setDate(date.getDate() + diff);
  return date;
}

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const s = {
  container: { padding: "24px", background: "#0f172a", minHeight: "100vh", color: "#e2e8f0" },
  cardEmbed: { background: "transparent", padding: 0, color: "#0f172a" },
  cardEmbedInner: {
    background: "linear-gradient(135deg,#0b1224 0%, #0d172f 100%)",
    border: "1px solid rgba(255,255,255,0.05)",
    borderRadius: "16px",
    padding: "16px",
    color: "#e2e8f0",
    boxShadow: "0 16px 38px rgba(0,0,0,0.18)",
  },
  topbar: {
    display: "flex",
    justifyContent: "space-between",
    gap: "16px",
    alignItems: "center",
    marginBottom: "18px",
  },
  title: { margin: 0, fontSize: "26px", fontWeight: 800, color: "white" },
  subtitle: { margin: "6px 0 0", color: "#94a3b8" },
  actions: { display: "flex", gap: "10px" },
  outlineBtn: {
    padding: "10px 14px",
    borderRadius: "10px",
    border: "1px solid #334155",
    background: "transparent",
    color: "#e2e8f0",
    cursor: "pointer",
  },
  primaryBtn: {
    padding: "10px 16px",
    borderRadius: "10px",
    border: "none",
    background: "linear-gradient(135deg,#22d3ee,#3b82f6)",
    color: "#0b1021",
    fontWeight: 800,
    cursor: "pointer",
    boxShadow: "0 12px 30px rgba(59,130,246,0.35)",
  },
  card: {
    background: "linear-gradient(135deg,#0d162c 0%, #0e182f 60%, #0c1428 100%)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: "16px",
    padding: "18px",
    marginBottom: "18px",
    boxShadow: "0 22px 48px rgba(0,0,0,0.32)",
  },
  formRow: { display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" },
  input: {
    background: "rgba(255,255,255,0.08)",
    color: "#e2e8f0",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "10px",
    padding: "11px",
    width: "100%",
    boxShadow: "inset 0 1px 2px rgba(0,0,0,0.25)",
  },
  helpText: { color: "#94a3b8", fontSize: "12px" },
  table: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: "10px",
    marginTop: "12px",
  },
  thead: {
    display: "grid",
    gridTemplateColumns: "140px 1fr 1fr 1fr",
    gap: "10px",
    color: "#cbd5e1",
    fontWeight: 800,
    fontSize: "13px",
  },
  row: {
    display: "grid",
    gridTemplateColumns: "140px 1fr 1fr 1fr",
    gap: "10px",
    alignItems: "center",
  },
  dayCell: { fontWeight: 800, color: "#e2e8f0", letterSpacing: "0.3px" },
  cell: {},
  noteRow: { marginTop: "12px", display: "flex", alignItems: "center", gap: "10px" },
  badge: { background: "#1d4ed8", color: "white", padding: "6px 10px", borderRadius: "999px", fontWeight: 800, fontSize: "12px" },
  message: {
    marginTop: "10px",
    background: "#0f172a",
    border: "1px solid #334155",
    padding: "10px",
    borderRadius: "8px",
    color: "#e2e8f0",
  },
  listCard: {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "14px",
    padding: "16px",
    boxShadow: "0 18px 40px rgba(0,0,0,0.25)",
  },
  listHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" },
  muted: { color: "#94a3b8" },
  menuGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: "10px" },
  menuCard: {
    background: "#0b1329",
    border: "1px solid #1f2937",
    borderRadius: "12px",
    padding: "12px",
    cursor: "pointer",
    boxShadow: "0 12px 24px rgba(0,0,0,0.25)",
  },
  menuTop: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  menuWeek: { color: "white", fontWeight: 800 },
  menuMeta: { color: "#94a3b8", fontSize: "12px" },
  trashBtn: {
    background: "transparent",
    border: "1px solid #ef4444",
    color: "#ef4444",
    borderRadius: "8px",
    cursor: "pointer",
    padding: "4px 8px",
  },
  imagePreview: {
    marginTop: "8px",
    border: "1px solid #1f2937",
    padding: "8px",
    borderRadius: "12px",
    background: "#0b1329",
    display: "inline-block",
  },
};

export default MessMenuManagement;

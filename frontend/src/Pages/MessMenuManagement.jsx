import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Save, Image as ImageIcon, CalendarDays, Trash2, UtensilsCrossed, AlertCircle, Loader2 } from "lucide-react";

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
  const [message, setMessage] = useState({ type: "", text: "" });
  const [imagePreview, setImagePreview] = useState(null);

  const headers = user?.id && user?.role ? { "x-user-id": user.id, "x-user-role": user.role } : {};

  useEffect(() => {
    fetchMenus();
  }, []);

  const fetchMenus = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/mess/menus", { headers });
      const list = res.data?.menus || [];
      setMenus(list);
      if (list.length) {
        hydrateFormFromMenu(list[0]);
      }
    } catch (err) {
      console.error("Failed to load menus", err);
      setMessage({ type: "error", text: "Unable to load menus. You can still create one." });
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
      setMessage({ type: "", text: "" });

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

      await axios.post("/mess/menus", payload, { headers });
      setMessage({ type: "success", text: "Menu saved successfully." });
      fetchMenus();
    } catch (err) {
      console.error("Save failed", err);
      setMessage({ type: "error", text: err.response?.data?.message || "Failed to save menu" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      setSaving(true);
      await axios.delete(`/mess/menus/${id}`, { headers });
      setMessage({ type: "success", text: "Menu deleted." });
      fetchMenus();
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.message || "Delete failed" });
    } finally {
      setSaving(false);
    }
  };

  const Container = ({ children }) =>
    embedded ? (
      <div className="w-full">{children}</div>
    ) : (
      <div className="min-h-screen bg-slate-50 p-6 lg:p-10 font-sans">{children}</div>
    );

  return (
    <Container>
      {!embedded && (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Weekly Menu Management</h1>
            <p className="text-slate-500 mt-2">Add, edit, and publish this week's meals. Optional food images are local-only preview.</p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate("/mess")}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 font-medium flex items-center gap-2 transition-colors shadow-sm"
            >
              <ArrowLeft size={18} />
              Back
            </button>
            <button 
              onClick={handleSave} 
              disabled={saving}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium flex items-center gap-2 transition-all shadow-lg shadow-blue-500/30 disabled:opacity-70"
            >
              {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
              Save Menu
            </button>
          </div>
        </div>
      )}

      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-8 ${embedded ? 'p-5' : 'p-6 lg:p-8'}`}
      >
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <CalendarDays size={18} className="text-blue-500" /> Week Of
            </label>
            <input
              type="date"
              value={weekOf}
              onChange={(e) => setWeekOf(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-slate-700"
            />
            <p className="text-xs text-slate-500 mt-1">Starts on Monday. Used to version menus.</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <ImageIcon size={18} className="text-blue-500" /> Food Image <span className="text-slate-400 font-normal">(optional preview)</span>
            </label>
            <input
              type="file"
              accept="image/*"
              className="w-full px-4 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200 transition-all cursor-pointer"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return setImagePreview(null);
                const reader = new FileReader();
                reader.onload = (ev) => setImagePreview(ev.target?.result);
                reader.readAsDataURL(file);
              }}
            />
            <p className="text-xs text-slate-500 mt-1">Not uploaded to server; for your visual check.</p>
          </div>
        </div>

        <AnimatePresence>
          {imagePreview && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-8 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-2 inline-block shadow-sm"
            >
              <img src={imagePreview} alt="Preview" className="max-h-48 rounded-xl object-cover" />
            </motion.div>
          )}
        </AnimatePresence>

        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            {/* Table Header */}
            <div className="grid grid-cols-[140px_1fr_1fr_1fr] gap-4 mb-4 px-4 py-3 bg-slate-50 rounded-xl border border-slate-100">
              <div className="font-bold text-slate-700 text-sm uppercase tracking-wider">Day</div>
              <div className="font-bold text-slate-700 text-sm uppercase tracking-wider">Breakfast</div>
              <div className="font-bold text-slate-700 text-sm uppercase tracking-wider">Lunch</div>
              <div className="font-bold text-slate-700 text-sm uppercase tracking-wider">Dinner</div>
            </div>

            {/* Table Body */}
            <div className="space-y-3">
              {Object.keys(days).map((day) => (
                <div key={day} className="grid grid-cols-[140px_1fr_1fr_1fr] gap-4 items-center px-4 py-2 hover:bg-slate-50/50 rounded-xl transition-colors group border border-transparent hover:border-slate-100">
                  <div className="font-bold text-slate-800 flex items-center gap-2">
                    <div className="w-1.5 h-6 bg-blue-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    {day}
                  </div>
                  {["breakfast", "lunch", "dinner"].map((meal) => (
                    <div key={meal}>
                      <input
                        type="text"
                        placeholder="Items separated by +"
                        value={days[day][meal]}
                        onChange={(e) => handleChange(day, meal, e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-slate-700 text-sm bg-white"
                      />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 flex items-center gap-3 p-4 bg-indigo-50 border border-indigo-100 rounded-xl">
          <div className="px-3 py-1 bg-indigo-600 text-white text-xs font-bold rounded-full uppercase tracking-wide">
            Features
          </div>
          <span className="text-sm font-medium text-indigo-800">Add / Edit / Delete menu lines. Meal counts stay real-time via dashboard.</span>
        </div>

        <AnimatePresence>
          {message.text && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`mt-6 p-4 rounded-xl flex items-center gap-3 text-sm font-medium ${
                message.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              }`}
            >
              <AlertCircle size={18} />
              {message.text}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className={`bg-white rounded-2xl shadow-sm border border-slate-200 ${embedded ? 'p-5' : 'p-6 lg:p-8'}`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-2">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <UtensilsCrossed size={20} className="text-blue-600" />
            Saved Menus
          </h3>
          <span className="text-sm font-medium text-slate-500">Click to load, trash to delete</span>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12 text-slate-400">
            <Loader2 className="animate-spin" size={32} />
          </div>
        ) : menus.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 rounded-xl border border-slate-200 border-dashed">
            <UtensilsCrossed className="mx-auto text-slate-300 mb-3" size={40} />
            <p className="text-slate-500 font-medium">No menus saved yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {menus.map((m) => (
              <motion.div 
                key={m._id} 
                whileHover={{ y: -2 }}
                onClick={() => hydrateFormFromMenu(m)}
                className="bg-slate-50 border border-slate-200 rounded-xl p-4 cursor-pointer hover:border-blue-400 hover:shadow-md transition-all group"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-white rounded-lg shadow-sm text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      <CalendarDays size={18} />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800">Week of</h4>
                      <p className="text-sm font-medium text-slate-600">{m.weekOf?.slice(0, 10)}</p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(m._id);
                    }}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
                <div className="mt-3 text-xs font-semibold text-slate-500 uppercase tracking-wide bg-white inline-block px-2 py-1 rounded-md border border-slate-100 shadow-sm">
                  {Object.keys(m.days || {}).length} days configured
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {embedded && (
        <div className="mt-6 flex justify-end">
          <button 
            onClick={handleSave} 
            disabled={saving}
            className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center gap-2 transition-all shadow-lg shadow-blue-500/30 disabled:opacity-70"
          >
            {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
            Save Menu
          </button>
        </div>
      )}
    </Container>
  );
}

function splitMeals(str) {
  if (!str) return [];
  return str.split("+").map((t) => t.trim()).filter(Boolean);
}

function getMonday(d) {
  const date = new Date(d);
  const day = date.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
  date.setDate(date.getDate() + diff);
  return date;
}

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export default MessMenuManagement;

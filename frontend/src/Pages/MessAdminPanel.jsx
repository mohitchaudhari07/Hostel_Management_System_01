import { useState, useEffect } from "react";
import axios from "axios";
import { Bar, Line, Pie } from "react-chartjs-2";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, 
  LineElement, PointElement, ArcElement, Title, Tooltip, Legend 
} from 'chart.js';
import { 
  Utensils, Wallet, CalendarDays, UserPlus, FileBarChart, 
  Edit, PlusCircle, CheckCircle, Save, XCircle, AlertCircle 
} from "lucide-react";

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend);

export default function MessAdminPanel() {
  const user = JSON.parse(localStorage.getItem("user")) || {};
  const [fees, setFees] = useState([]);
  const [weekMenus, setWeekMenus] = useState([]);
  const [selectedMenu, setSelectedMenu] = useState(null);
  const [users, setUsers] = useState([]);
  const [reports, setReports] = useState(null);
  const [attendanceSummary, setAttendanceSummary] = useState(null);

  const [feeForm, setFeeForm] = useState({ 
    feeType: "monthly", period: "", feeAmount: 0, pricingModel: "monthly_flat", 
    perPlateVeg: 0, perPlateNonVeg: 0, perMealBreakfastVeg: 0, perMealBreakfastNonVeg: 0, 
    perMealLunchVeg: 0, perMealLunchNonVeg: 0, perMealDinnerVeg: 0, perMealDinnerNonVeg: 0, 
    mealCategories: ["both"], dueDate: "" 
  });
  const [editingFee, setEditingFee] = useState(null);
  const [currentDay] = useState(new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase());

  const headers = { "x-user-id": user.id, "x-user-role": user.role || "admin" };

  async function fetchFees() {
    try {
      const res = await axios.get("/mess/fees", { headers });
      setFees(res.data.fees || []);
    } catch (e) { console.error(e); }
  }

  const createFee = async () => {
    try {
      const body = {
        feeType: feeForm.feeType, period: feeForm.period, feeAmount: feeForm.feeAmount, pricingModel: feeForm.pricingModel,
        perPlateRates: { veg: feeForm.perPlateVeg, nonVeg: feeForm.perPlateNonVeg },
        perMealRates: {
          breakfast: { veg: feeForm.perMealBreakfastVeg, nonVeg: feeForm.perMealBreakfastNonVeg },
          lunch: { veg: feeForm.perMealLunchVeg, nonVeg: feeForm.perMealLunchNonVeg },
          dinner: { veg: feeForm.perMealDinnerVeg, nonVeg: feeForm.perMealDinnerNonVeg }
        },
        mealCategories: feeForm.mealCategories, dueDate: feeForm.dueDate, createdBy: user.id
      };
      await axios.post("/mess/fees", body, { headers });
      fetchFees();
      resetFeeForm();
      alert("Fee created");
    } catch (e) { console.error(e); alert("Failed to create fee"); }
  };

  const updateFee = async () => {
    if (!editingFee) return;
    try {
      const body = {
        feeAmount: feeForm.feeAmount, pricingModel: feeForm.pricingModel,
        perPlateRates: { veg: feeForm.perPlateVeg, nonVeg: feeForm.perPlateNonVeg },
        perMealRates: {
          breakfast: { veg: feeForm.perMealBreakfastVeg, nonVeg: feeForm.perMealBreakfastNonVeg },
          lunch: { veg: feeForm.perMealLunchVeg, nonVeg: feeForm.perMealLunchNonVeg },
          dinner: { veg: feeForm.perMealDinnerVeg, nonVeg: feeForm.perMealDinnerNonVeg }
        },
        mealCategories: feeForm.mealCategories, dueDate: feeForm.dueDate
      };
      await axios.put(`/mess/fees/${editingFee._id}`, body, { headers });
      fetchFees();
      resetFeeForm();
      setEditingFee(null);
      alert("Fee updated");
    } catch (e) { console.error(e); alert("Failed to update fee"); }
  };

  const editFee = (fee) => {
    setEditingFee(fee);
    setFeeForm({
      feeType: fee.feeType, period: fee.period, feeAmount: fee.feeAmount, pricingModel: fee.pricingModel,
      perPlateVeg: fee.perPlateRates?.veg || 0, perPlateNonVeg: fee.perPlateRates?.nonVeg || 0,
      perMealBreakfastVeg: fee.perMealRates?.breakfast?.veg || 0, perMealBreakfastNonVeg: fee.perMealRates?.breakfast?.nonVeg || 0,
      perMealLunchVeg: fee.perMealRates?.lunch?.veg || 0, perMealLunchNonVeg: fee.perMealRates?.lunch?.nonVeg || 0,
      perMealDinnerVeg: fee.perMealRates?.dinner?.veg || 0, perMealDinnerNonVeg: fee.perMealRates?.dinner?.nonVeg || 0,
      mealCategories: fee.mealCategories, dueDate: fee.dueDate ? new Date(fee.dueDate).toISOString().split('T')[0] : ""
    });
  };

  const resetFeeForm = () => {
    setFeeForm({ feeType: "monthly", period: "", feeAmount: 0, pricingModel: "monthly_flat", perPlateVeg: 0, perPlateNonVeg: 0, perMealBreakfastVeg: 0, perMealBreakfastNonVeg: 0, perMealLunchVeg: 0, perMealLunchNonVeg: 0, perMealDinnerVeg: 0, perMealDinnerNonVeg: 0, mealCategories: ["both"], dueDate: "" });
  };

  async function fetchAttendanceSummary() {
    try {
      const res = await axios.get("/mess/attendance/summary", { headers });
      setAttendanceSummary(res.data.summary);
    } catch (e) { console.error(e); }
  }

  async function fetchMenus() {
    try {
      const res = await axios.get("/mess/menus", { headers });
      setWeekMenus(res.data.menus || []);
    } catch (e) { console.error(e); }
  }

  const createMenu = async () => {
    const weekOf = prompt("Enter week start date (YYYY-MM-DD)");
    if (!weekOf) return;
    try {
      await axios.post("/mess/menus", { weekOf }, { headers });
      fetchMenus();
      alert("Menu created (empty) - edit via API or future UI");
    } catch (e) { console.error(e); alert("Failed to create menu"); }
  };

  const editMenu = (menu) => {
    const daysObj = {};
    if (menu.days) {
      for (const [k,v] of Object.entries(menu.days)) {
        daysObj[k] = { breakfast: (v.breakfast || []).join(', '), lunch: (v.lunch || []).join(', '), dinner: (v.dinner || []).join(', ') };
      }
    }
    setSelectedMenu({ ...menu, days: daysObj, specialSundayMenu: { breakfast: (menu.specialSundayMenu?.breakfast||[]).join(', '), lunch: (menu.specialSundayMenu?.lunch||[]).join(', '), dinner: (menu.specialSundayMenu?.dinner||[]).join(', ') } });
  };

  const saveMenu = async () => {
    if (!selectedMenu) return;
    try {
      const daysPayload = {};
      for (const day of Object.keys(selectedMenu.days || {})) {
        const val = selectedMenu.days[day];
        daysPayload[day] = {
          breakfast: val.breakfast ? val.breakfast.split(',').map(s=>s.trim()).filter(Boolean) : [],
          lunch: val.lunch ? val.lunch.split(',').map(s=>s.trim()).filter(Boolean) : [],
          dinner: val.dinner ? val.dinner.split(',').map(s=>s.trim()).filter(Boolean) : []
        };
      }
      const special = selectedMenu.specialSundayMenu || {};
      const payload = { days: daysPayload, specialSundayMenu: { breakfast: special.breakfast ? special.breakfast.split(',').map(s=>s.trim()).filter(Boolean) : [], lunch: special.lunch ? special.lunch.split(',').map(s=>s.trim()).filter(Boolean) : [], dinner: special.dinner ? special.dinner.split(',').map(s=>s.trim()).filter(Boolean) : [] }, notes: selectedMenu.notes };

      await axios.put(`/mess/menus/${selectedMenu._id}`, payload, { headers });
      alert('Menu saved');
      setSelectedMenu(null);
      fetchMenus();
    } catch (e) { console.error(e); alert('Failed to save menu'); }
  };

  async function fetchUsers() {
    try {
      const res = await axios.get("/auth/students");
      setUsers(res.data || []);
    } catch (e) { console.error(e); }
  }

  useEffect(() => {
    fetchFees();
    fetchMenus();
    fetchUsers();
    fetchAttendanceSummary();
  }, []);

  const assignManager = async (userId) => {
    try {
      await axios.post(`/mess/assign-manager/${userId}`, {}, { headers });
      alert("Assigned as mess manager");
    } catch (e) { console.error(e); alert("Failed to assign manager"); }
  };

  const fetchReports = async () => {
    try {
      const res = await axios.get("/mess/reports", { headers });
      setReports(res.data);
    } catch (e) { console.error(e); alert("Failed to fetch reports"); }
  };

  return (
    <div className="font-sans">
      <div className="grid lg:grid-cols-2 gap-6">
        
        {/* Fee Structure Card */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col gap-6">
          <div>
            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Wallet className="text-blue-600" /> Set Mess Fee Structure
            </h3>
            <p className="text-slate-500 text-sm mt-1">Configure monthly fees or per-plate pricing</p>
          </div>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Fee Type</label>
                <select className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" value={feeForm.feeType} onChange={(e)=>setFeeForm({...feeForm, feeType: e.target.value})}>
                  <option value="monthly">Monthly</option>
                  <option value="semester">Semester</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Period</label>
                <input className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" placeholder="e.g. 2026-02" value={feeForm.period} onChange={(e)=>setFeeForm({...feeForm, period:e.target.value})} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Fee Amount (₹)</label>
                <input className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" type="number" placeholder="3000" value={feeForm.feeAmount} onChange={(e)=>setFeeForm({...feeForm, feeAmount:parseFloat(e.target.value)})} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Pricing Model</label>
                <select className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" value={feeForm.pricingModel} onChange={(e)=>setFeeForm({...feeForm, pricingModel:e.target.value})}>
                  <option value="monthly_flat">Monthly Flat</option>
                  <option value="per_plate">Per Plate</option>
                  <option value="per_meal">Per Meal</option>
                </select>
              </div>
            </div>

            {feeForm.pricingModel === 'per_plate' && (
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Veg Rate (₹)</label>
                  <input className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" type="number" value={feeForm.perPlateVeg} onChange={(e)=>setFeeForm({...feeForm, perPlateVeg:parseFloat(e.target.value)})} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Non-Veg Rate (₹)</label>
                  <input className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" type="number" value={feeForm.perPlateNonVeg} onChange={(e)=>setFeeForm({...feeForm, perPlateNonVeg:parseFloat(e.target.value)})} />
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 items-end">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Due Date</label>
                <input className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" type="date" value={feeForm.dueDate} onChange={(e)=>setFeeForm({...feeForm, dueDate: e.target.value})} />
              </div>
              <div>
                {editingFee ? (
                  <div className="flex gap-2">
                    <button className="flex-1 bg-blue-600 text-white font-bold py-2 rounded-xl hover:bg-blue-700 transition-colors" onClick={updateFee}>Update</button>
                    <button className="flex-1 bg-slate-200 text-slate-700 font-bold py-2 rounded-xl hover:bg-slate-300 transition-colors" onClick={()=>{resetFeeForm(); setEditingFee(null);}}>Cancel</button>
                  </div>
                ) : (
                  <button className="w-full bg-blue-600 text-white font-bold py-2 rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/30" onClick={createFee}>Create Fee</button>
                )}
              </div>
            </div>
          </div>

          {fees.length > 0 && (
            <div className="mt-4">
              <h4 className="font-bold text-slate-800 mb-3">Existing Fee Structures</h4>
              <div className="space-y-2">
                {fees.map(f => (
                  <div key={f._id} className="flex justify-between items-center p-3 bg-slate-50 border border-slate-100 rounded-xl">
                    <div>
                      <span className="font-bold text-slate-800 mr-3">{f.period}</span>
                      <span className="text-emerald-600 font-bold mr-3">₹{f.feeAmount}</span>
                      <span className="text-xs bg-white border border-slate-200 px-2 py-1 rounded-md text-slate-500 uppercase">{f.pricingModel.replace('_', ' ')}</span>
                    </div>
                    <button className="text-blue-600 hover:text-blue-800 font-bold text-sm" onClick={()=>editFee(f)}>Edit</button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>

        {/* Weekly Menu Card */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col gap-6">
          <div>
            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <CalendarDays className="text-blue-600" /> Create Weekly Menu
            </h3>
            <p className="text-slate-500 text-sm mt-1">Plan breakfast, lunch, dinner for each day</p>
          </div>

          <button className="w-full border-2 border-dashed border-blue-200 text-blue-600 font-bold py-3 rounded-xl hover:bg-blue-50 hover:border-blue-400 transition-colors flex items-center justify-center gap-2" onClick={createMenu}>
            <PlusCircle size={20} /> Create New Weekly Menu
          </button>

          {weekMenus.length > 0 && (
            <div>
              <h4 className="font-bold text-slate-800 mb-3">Saved Menus</h4>
              <div className="space-y-2">
                {weekMenus.map(w => (
                  <div key={w._id} className="flex justify-between items-center p-3 bg-slate-50 border border-slate-100 rounded-xl">
                    <span className="font-semibold text-slate-700">Week of {new Date(w.weekOf).toLocaleDateString()}</span>
                    <button className="text-blue-600 hover:text-blue-800 font-bold text-sm" onClick={()=>editMenu(w)}>Edit Menu</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <AnimatePresence>
            {selectedMenu && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="bg-slate-50 border border-slate-200 p-4 rounded-xl overflow-hidden mt-4">
                <h4 className="font-bold text-slate-800 mb-4">Editing Menu: {new Date(selectedMenu.weekOf).toLocaleDateString()}</h4>
                
                <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                  {['monday','tuesday','wednesday','thursday','friday','saturday','sunday'].map(d => (
                    <div key={d} className={`p-4 rounded-xl border ${d === currentDay ? 'bg-white border-blue-300 shadow-sm' : 'bg-white border-slate-200'}`}>
                      <h5 className={`font-bold mb-3 flex items-center gap-2 ${d === currentDay ? 'text-blue-600' : 'text-slate-700'}`}>
                        {d.charAt(0).toUpperCase() + d.slice(1)} {d === currentDay && <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">Today</span>}
                      </h5>
                      <div className="space-y-2">
                        {['breakfast', 'lunch', 'dinner'].map(meal => (
                          <div key={meal} className="flex flex-col">
                            <label className="text-xs font-semibold text-slate-500 uppercase">{meal}</label>
                            <input className="w-full px-3 py-1.5 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm" placeholder="Items..." value={selectedMenu.days?.[d]?.[meal] || ''} onChange={(e)=>setSelectedMenu(s=>({ ...s, days: { ...s.days, [d]: { ...(s.days?.[d]||{}), [meal]: e.target.value } } }))} />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex gap-2">
                  <button className="flex-1 bg-blue-600 text-white font-bold py-2 rounded-xl hover:bg-blue-700 transition-colors" onClick={saveMenu}>Save Changes</button>
                  <button className="flex-1 bg-slate-200 text-slate-700 font-bold py-2 rounded-xl hover:bg-slate-300 transition-colors" onClick={()=>setSelectedMenu(null)}>Cancel</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Assign Manager Card */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col gap-6 lg:col-span-2">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <UserPlus className="text-blue-600" /> Assign Mess Manager
              </h3>
              <p className="text-slate-500 text-sm mt-1">Grant mess dashboard access with restricted permissions</p>
            </div>
            <select className="px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 w-full md:w-96" onChange={(e) => { if (e.target.value) assignManager(e.target.value); e.target.value = ''; }}>
              <option value="">Select user to assign as mess manager...</option>
              {users.map(u => (
                <option key={u._id} value={u._id}>{u.name} — {u.email}</option>
              ))}
            </select>
          </div>
        </motion.div>

        {/* Reports Card */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col gap-6 lg:col-span-2">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <FileBarChart className="text-blue-600" /> View Reports
              </h3>
              <p className="text-slate-500 text-sm mt-1">Monitor attendance, consumption, expenses, and feedback</p>
            </div>
            <button className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 px-5 rounded-xl transition-colors border border-slate-200" onClick={fetchReports}>
              Fetch Latest Reports
            </button>
          </div>

          {reports && attendanceSummary && (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              
              <div className="bg-slate-50 p-5 rounded-xl border border-slate-100 col-span-1 lg:col-span-2">
                <h4 className="font-bold text-slate-800 mb-4 text-center">Meal-wise Attendance (30 Days)</h4>
                <Bar
                  data={{
                    labels: ['Breakfast', 'Lunch', 'Dinner'],
                    datasets: [{
                      label: 'Total Meals Served',
                      data: [attendanceSummary.breakfast, attendanceSummary.lunch, attendanceSummary.dinner],
                      backgroundColor: ['#f59e0b', '#10b981', '#6366f1'],
                      borderRadius: 6
                    }]
                  }}
                  options={{ responsive: true, plugins: { legend: { display: false } } }}
                />
              </div>

              <div className="bg-slate-50 p-5 rounded-xl border border-slate-100 flex flex-col justify-center">
                <h4 className="font-bold text-slate-800 mb-4 text-center">Today's Summary</h4>
                <div className="space-y-4">
                  <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-100 text-center">
                    <p className="text-3xl font-black text-blue-600">{reports.dailyAttendance}</p>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Students Present</p>
                  </div>
                  <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-100 text-center">
                    <p className="text-3xl font-black text-emerald-600">₹{reports.foodConsumption.totalAmount}</p>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Food Revenue</p>
                  </div>
                  <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-100 text-center">
                    <p className="text-3xl font-black text-amber-500">{reports.feedbackRatings.average ? reports.feedbackRatings.average.toFixed(1) : 'N/A'}</p>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Avg Rating</p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 p-5 rounded-xl border border-slate-100">
                <h4 className="font-bold text-slate-800 mb-4 text-center">Feedback Distribution</h4>
                <Pie
                  data={{
                    labels: ['1 Star', '2 Stars', '3 Stars', '4 Stars', '5 Stars'],
                    datasets: [{
                      data: [2, 3, 5, 8, Math.max(1, reports.feedbackRatings.count - 18)],
                      backgroundColor: ['#ef4444', '#f97316', '#f59e0b', '#eab308', '#22c55e'],
                    }]
                  }}
                  options={{ responsive: true, plugins: { legend: { position: 'bottom' } } }}
                />
              </div>

            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

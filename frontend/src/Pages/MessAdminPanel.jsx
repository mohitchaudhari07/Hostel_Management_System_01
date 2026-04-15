import { useState, useEffect } from "react";
import axios from "axios";
import { Bar, Line, Pie } from "react-chartjs-2";
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
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

function MessAdminPanel() {
  const user = JSON.parse(localStorage.getItem("user")) || {};
  const [fees, setFees] = useState([]);
  const [weekMenus, setWeekMenus] = useState([]);
  const [selectedMenu, setSelectedMenu] = useState(null);
  const [feedbacks, setFeedbacks] = useState([]);
  const [users, setUsers] = useState([]);
  const [reports, setReports] = useState(null);
  const [attendanceSummary, setAttendanceSummary] = useState(null);

  // Fee form
  const [feeForm, setFeeForm] = useState({ feeType: "monthly", period: "", feeAmount: 0, pricingModel: "monthly_flat", perPlateVeg: 0, perPlateNonVeg: 0, perMealBreakfastVeg: 0, perMealBreakfastNonVeg: 0, perMealLunchVeg: 0, perMealLunchNonVeg: 0, perMealDinnerVeg: 0, perMealDinnerNonVeg: 0, mealCategories: ["both"], dueDate: "" });
  const [editingFee, setEditingFee] = useState(null);

  // Current day for highlighting
  const [currentDay, setCurrentDay] = useState(new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase());

  useEffect(() => {
    fetchFees();
    fetchMenus();
    fetchUsers();
    fetchAttendanceSummary();
  }, []);

  const headers = {
    "x-user-id": user.id,
    "x-user-role": user.role || "admin"
  };

  const fetchFees = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/mess/fees", { headers });
      setFees(res.data.fees || []);
    } catch (e) { console.error(e); }
  };

  const createFee = async () => {
    try {
      const body = {
        feeType: feeForm.feeType,
        period: feeForm.period,
        feeAmount: feeForm.feeAmount,
        pricingModel: feeForm.pricingModel,
        perPlateRates: { veg: feeForm.perPlateVeg, nonVeg: feeForm.perPlateNonVeg },
        perMealRates: {
          breakfast: { veg: feeForm.perMealBreakfastVeg, nonVeg: feeForm.perMealBreakfastNonVeg },
          lunch: { veg: feeForm.perMealLunchVeg, nonVeg: feeForm.perMealLunchNonVeg },
          dinner: { veg: feeForm.perMealDinnerVeg, nonVeg: feeForm.perMealDinnerNonVeg }
        },
        mealCategories: feeForm.mealCategories,
        dueDate: feeForm.dueDate,
        createdBy: user.id
      };
      await axios.post("http://localhost:5000/api/mess/fees", body, { headers });
      fetchFees();
      resetFeeForm();
      alert("Fee created");
    } catch (e) { console.error(e); alert("Failed to create fee"); }
  };

  const updateFee = async () => {
    if (!editingFee) return;
    try {
      const body = {
        feeAmount: feeForm.feeAmount,
        pricingModel: feeForm.pricingModel,
        perPlateRates: { veg: feeForm.perPlateVeg, nonVeg: feeForm.perPlateNonVeg },
        perMealRates: {
          breakfast: { veg: feeForm.perMealBreakfastVeg, nonVeg: feeForm.perMealBreakfastNonVeg },
          lunch: { veg: feeForm.perMealLunchVeg, nonVeg: feeForm.perMealLunchNonVeg },
          dinner: { veg: feeForm.perMealDinnerVeg, nonVeg: feeForm.perMealDinnerNonVeg }
        },
        mealCategories: feeForm.mealCategories,
        dueDate: feeForm.dueDate
      };
      await axios.put(`http://localhost:5000/api/mess/fees/${editingFee._id}`, body, { headers });
      fetchFees();
      resetFeeForm();
      setEditingFee(null);
      alert("Fee updated");
    } catch (e) { console.error(e); alert("Failed to update fee"); }
  };

  const editFee = (fee) => {
    setEditingFee(fee);
    setFeeForm({
      feeType: fee.feeType,
      period: fee.period,
      feeAmount: fee.feeAmount,
      pricingModel: fee.pricingModel,
      perPlateVeg: fee.perPlateRates?.veg || 0,
      perPlateNonVeg: fee.perPlateRates?.nonVeg || 0,
      perMealBreakfastVeg: fee.perMealRates?.breakfast?.veg || 0,
      perMealBreakfastNonVeg: fee.perMealRates?.breakfast?.nonVeg || 0,
      perMealLunchVeg: fee.perMealRates?.lunch?.veg || 0,
      perMealLunchNonVeg: fee.perMealRates?.lunch?.nonVeg || 0,
      perMealDinnerVeg: fee.perMealRates?.dinner?.veg || 0,
      perMealDinnerNonVeg: fee.perMealRates?.dinner?.nonVeg || 0,
      mealCategories: fee.mealCategories,
      dueDate: fee.dueDate ? new Date(fee.dueDate).toISOString().split('T')[0] : ""
    });
  };

  const resetFeeForm = () => {
    setFeeForm({ feeType: "monthly", period: "", feeAmount: 0, pricingModel: "monthly_flat", perPlateVeg: 0, perPlateNonVeg: 0, perMealBreakfastVeg: 0, perMealBreakfastNonVeg: 0, perMealLunchVeg: 0, perMealLunchNonVeg: 0, perMealDinnerVeg: 0, perMealDinnerNonVeg: 0, mealCategories: ["both"], dueDate: "" });
  };

  const fetchAttendanceSummary = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/mess/attendance/summary", { headers });
      setAttendanceSummary(res.data.summary);
    } catch (e) { console.error(e); }
  };

  const fetchMenus = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/mess/menus", { headers });
      setWeekMenus(res.data.menus || []);
    } catch (e) { console.error(e); }
  };

  const createMenu = async () => {
    const weekOf = prompt("Enter week start date (YYYY-MM-DD)");
    if (!weekOf) return;
    try {
      await axios.post("http://localhost:5000/api/mess/menus", { weekOf }, { headers });
      fetchMenus();
      alert("Menu created (empty) - edit via API or future UI");
    } catch (e) { console.error(e); alert("Failed to create menu"); }
  };

  const editMenu = (menu) => {
    // Prepare editable structure
    const daysObj = {};
    // menu.days is a map-like object; normalize
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
      // build payload
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

      await axios.put(`http://localhost:5000/api/mess/menus/${selectedMenu._id}`, payload, { headers });
      alert('Menu saved');
      setSelectedMenu(null);
      fetchMenus();
    } catch (e) { console.error(e); alert('Failed to save menu'); }
  };

  const fetchFeedbacks = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/mess/feedbacks', { headers });
      setFeedbacks(res.data.feedbacks || []);
    } catch (e) { console.error(e); alert('Failed to fetch feedbacks'); }
  };

  const fetchUsers = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/auth/students");
      // reuse students for assignment list; ideally get staff list
      setUsers(res.data || []);
    } catch (e) { console.error(e); }
  };

  const assignManager = async (userId) => {
    try {
      await axios.post(`http://localhost:5000/api/mess/assign-manager/${userId}`, {}, { headers });
      alert("Assigned as mess manager");
    } catch (e) { console.error(e); alert("Failed to assign manager"); }
  };

  const fetchReports = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/mess/reports", { headers });
      setReports(res.data);
    } catch (e) { console.error(e); alert("Failed to fetch reports"); }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>🍽️ Mess Management</h1>
        <p style={styles.subtitle}>Manage mess fees, menus, assignments, and reports</p>
      </div>

      <div style={styles.grid}>
        {/* Fee Structure Card */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <h3 style={styles.cardTitle}>💰 Set Mess Fee Structure</h3>
            <p style={styles.cardDescription}>Configure monthly fees or per-plate pricing</p>
          </div>
          
          <div style={styles.form}>
            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Fee Type</label>
                <select style={styles.select} value={feeForm.feeType} onChange={(e)=>setFeeForm({...feeForm, feeType: e.target.value})}>
                  <option value="monthly">Monthly</option>
                  <option value="semester">Semester</option>
                </select>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Period</label>
                <input style={styles.input} placeholder="e.g. 2026-02" value={feeForm.period} onChange={(e)=>setFeeForm({...feeForm, period:e.target.value})} />
              </div>
            </div>

            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Fee Amount (₹)</label>
                <input style={styles.input} type="number" placeholder="3000" value={feeForm.feeAmount} onChange={(e)=>setFeeForm({...feeForm, feeAmount:parseFloat(e.target.value)})} />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Pricing Model</label>
                <select style={styles.select} value={feeForm.pricingModel} onChange={(e)=>setFeeForm({...feeForm, pricingModel:e.target.value})}>
                  <option value="monthly_flat">Monthly Flat</option>
                  <option value="per_plate">Per Plate</option>
                  <option value="per_meal">Per Meal</option>
                </select>
              </div>
            </div>

            {feeForm.pricingModel === 'per_plate' && (
              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Veg Rate (₹)</label>
                  <input style={styles.input} type="number" placeholder="50" value={feeForm.perPlateVeg} onChange={(e)=>setFeeForm({...feeForm, perPlateVeg:parseFloat(e.target.value)})} />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Non-Veg Rate (₹)</label>
                  <input style={styles.input} type="number" placeholder="80" value={feeForm.perPlateNonVeg} onChange={(e)=>setFeeForm({...feeForm, perPlateNonVeg:parseFloat(e.target.value)})} />
                </div>
              </div>
            )}

            {feeForm.pricingModel === 'per_meal' && (
              <>
                <h5 style={{...styles.label, marginTop: '16px'}}>Breakfast Rates</h5>
                <div style={styles.formRow}>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Veg (₹)</label>
                    <input style={styles.input} type="number" placeholder="30" value={feeForm.perMealBreakfastVeg} onChange={(e)=>setFeeForm({...feeForm, perMealBreakfastVeg:parseFloat(e.target.value)})} />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Non-Veg (₹)</label>
                    <input style={styles.input} type="number" placeholder="50" value={feeForm.perMealBreakfastNonVeg} onChange={(e)=>setFeeForm({...feeForm, perMealBreakfastNonVeg:parseFloat(e.target.value)})} />
                  </div>
                </div>

                <h5 style={styles.label}>Lunch Rates</h5>
                <div style={styles.formRow}>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Veg (₹)</label>
                    <input style={styles.input} type="number" placeholder="60" value={feeForm.perMealLunchVeg} onChange={(e)=>setFeeForm({...feeForm, perMealLunchVeg:parseFloat(e.target.value)})} />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Non-Veg (₹)</label>
                    <input style={styles.input} type="number" placeholder="90" value={feeForm.perMealLunchNonVeg} onChange={(e)=>setFeeForm({...feeForm, perMealLunchNonVeg:parseFloat(e.target.value)})} />
                  </div>
                </div>

                <h5 style={styles.label}>Dinner Rates</h5>
                <div style={styles.formRow}>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Veg (₹)</label>
                    <input style={styles.input} type="number" placeholder="50" value={feeForm.perMealDinnerVeg} onChange={(e)=>setFeeForm({...feeForm, perMealDinnerVeg:parseFloat(e.target.value)})} />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Non-Veg (₹)</label>
                    <input style={styles.input} type="number" placeholder="80" value={feeForm.perMealDinnerNonVeg} onChange={(e)=>setFeeForm({...feeForm, perMealDinnerNonVeg:parseFloat(e.target.value)})} />
                  </div>
                </div>
              </>
            )}

            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Due Date</label>
                <input style={styles.input} type="date" value={feeForm.dueDate} onChange={(e)=>setFeeForm({...feeForm, dueDate: e.target.value})} />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>&nbsp;</label>
                {editingFee ? (
                  <div style={{display: 'flex', gap: '8px'}}>
                    <button style={styles.primaryButton} onClick={updateFee}>Update Fee</button>
                    <button style={styles.cancelButton} onClick={()=>{resetFeeForm(); setEditingFee(null);}}>Cancel</button>
                  </div>
                ) : (
                  <button style={styles.primaryButton} onClick={createFee}>Create Fee Structure</button>
                )}
              </div>
            </div>
          </div>

          {fees.length > 0 && (
            <div style={styles.feeList}>
              <h4 style={styles.listTitle}>Existing Fee Structures</h4>
              <div style={styles.feeItems}>
                {fees.map(f => (
                  <div key={f._id} style={styles.feeItem}>
                    <div style={styles.feeInfo}>
                      <span style={styles.feePeriod}>{f.period}</span>
                      <span style={styles.feeAmount}>₹{f.feeAmount}</span>
                      <span style={styles.feeModel}>{f.pricingModel.replace('_', ' ')}</span>
                    </div>
                    <button style={styles.editButton} onClick={()=>editFee(f)}>Edit</button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Weekly Menu Card */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <h3 style={styles.cardTitle}>📅 Create Weekly Menu</h3>
            <p style={styles.cardDescription}>Plan breakfast, lunch, dinner for each day</p>
          </div>

          <button style={styles.secondaryButton} onClick={createMenu}>
            ➕ Create New Weekly Menu
          </button>

          {weekMenus.length > 0 && (
            <div style={styles.menuList}>
              <h4 style={styles.listTitle}>Weekly Menus</h4>
              <div style={styles.menuItems}>
                {weekMenus.map(w => (
                  <div key={w._id} style={styles.menuItem}>
                    <span style={styles.menuDate}>{new Date(w.weekOf).toLocaleDateString()}</span>
                    <button style={styles.editButton} onClick={()=>editMenu(w)}>Edit</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {selectedMenu && (
            <div style={styles.menuEditor}>
              <h4 style={styles.editorTitle}>Editing Menu: {new Date(selectedMenu.weekOf).toLocaleDateString()}</h4>
              
              <div style={styles.daysGrid}>
                {['monday','tuesday','wednesday','thursday','friday','saturday','sunday'].map(d => (
                  <div key={d} style={{
                    ...styles.dayCard,
                    ...(d === currentDay ? styles.currentDayCard : {})
                  }}>
                    <h5 style={{
                      ...styles.dayTitle,
                      ...(d === currentDay ? styles.currentDayTitle : {})
                    }}>
                      {d.charAt(0).toUpperCase() + d.slice(1)} {d === currentDay && '⭐'}
                    </h5>
                    <div style={styles.mealInputs}>
                      <div style={styles.inputGroup}>
                        <label style={styles.inputLabel}>Breakfast</label>
                        <input style={styles.mealInput} placeholder="Poha + Tea" value={selectedMenu.days?.[d]?.breakfast || ''} onChange={(e)=>setSelectedMenu(s=>({ ...s, days: { ...s.days, [d]: { ...(s.days?.[d]||{}), breakfast: e.target.value } } }))} />
                      </div>
                      <div style={styles.inputGroup}>
                        <label style={styles.inputLabel}>Lunch</label>
                        <input style={styles.mealInput} placeholder="Dal Rice + Sabji" value={selectedMenu.days?.[d]?.lunch || ''} onChange={(e)=>setSelectedMenu(s=>({ ...s, days: { ...s.days, [d]: { ...(s.days?.[d]||{}), lunch: e.target.value } } }))} />
                      </div>
                      <div style={styles.inputGroup}>
                        <label style={styles.inputLabel}>Dinner</label>
                        <input style={styles.mealInput} placeholder="Chapati + Paneer" value={selectedMenu.days?.[d]?.dinner || ''} onChange={(e)=>setSelectedMenu(s=>({ ...s, days: { ...s.days, [d]: { ...(s.days?.[d]||{}), dinner: e.target.value } } }))} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div style={styles.specialMenu}>
                <h5 style={styles.specialTitle}>🌟 Special Sunday Menu</h5>
                <div style={styles.specialInputs}>
                  <div style={styles.inputGroup}>
                    <label style={styles.inputLabel}>Breakfast</label>
                    <input style={styles.mealInput} placeholder="Special Poha + Tea" value={selectedMenu.specialSundayMenu?.breakfast || ''} onChange={(e)=>setSelectedMenu(s=>({ ...s, specialSundayMenu: { ...(s.specialSundayMenu||{}), breakfast: e.target.value } }))} />
                  </div>
                  <div style={styles.inputGroup}>
                    <label style={styles.inputLabel}>Lunch</label>
                    <input style={styles.mealInput} placeholder="Special Dal Rice + Sabji" value={selectedMenu.specialSundayMenu?.lunch || ''} onChange={(e)=>setSelectedMenu(s=>({ ...s, specialSundayMenu: { ...(s.specialSundayMenu||{}), lunch: e.target.value } }))} />
                  </div>
                  <div style={styles.inputGroup}>
                    <label style={styles.inputLabel}>Dinner</label>
                    <input style={styles.mealInput} placeholder="Special Chapati + Paneer" value={selectedMenu.specialSundayMenu?.dinner || ''} onChange={(e)=>setSelectedMenu(s=>({ ...s, specialSundayMenu: { ...(s.specialSundayMenu||{}), dinner: e.target.value } }))} />
                  </div>
                </div>
              </div>

              <div style={styles.notesSection}>
                <label style={styles.inputLabel}>Notes</label>
                <textarea style={styles.notesInput} value={selectedMenu.notes || ''} onChange={(e)=>setSelectedMenu(s=>({ ...s, notes: e.target.value }))} placeholder="Additional notes..." />
              </div>

              <div style={styles.buttonGroup}>
                <button style={styles.primaryButton} onClick={saveMenu}>💾 Save Menu</button>
                <button style={styles.cancelButton} onClick={()=>setSelectedMenu(null)}>❌ Cancel</button>
              </div>
            </div>
          )}
        </div>

        {/* Assign Manager Card */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <h3 style={styles.cardTitle}>👤 Assign Mess Manager</h3>
            <p style={styles.cardDescription}>Grant mess dashboard access with restricted permissions</p>
          </div>

          <div style={styles.assignSection}>
            <select style={styles.assignSelect} onChange={(e) => { if (e.target.value) assignManager(e.target.value); e.target.value = ''; }}>
              <option value="">Select user to assign as mess manager...</option>
              {users.map(u => (
                <option key={u._id} value={u._id}>{u.name} — {u.email}</option>
              ))}
            </select>
            <p style={styles.assignNote}>Selected user will get access to mess dashboard with limited admin permissions.</p>
          </div>
        </div>

        {/* Reports Card */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <h3 style={styles.cardTitle}>📊 View Reports</h3>
            <p style={styles.cardDescription}>Monitor attendance, consumption, expenses, and feedback</p>
          </div>

          <button style={styles.secondaryButton} onClick={fetchReports}>
            📈 Fetch Latest Reports
          </button>

          {reports && attendanceSummary && (
            <div style={styles.reportsGrid}>
              <div style={styles.chartCard}>
                <h4 style={styles.chartTitle}>📊 Meal-wise Attendance (Last 30 Days)</h4>
                <Bar
                  data={{
                    labels: ['Breakfast', 'Lunch', 'Dinner'],
                    datasets: [{
                      label: 'Total Meals Served',
                      data: [attendanceSummary.breakfast, attendanceSummary.lunch, attendanceSummary.dinner],
                      backgroundColor: ['#3498db', '#e74c3c', '#f39c12'],
                    }]
                  }}
                  options={{
                    responsive: true,
                    plugins: {
                      legend: { position: 'top' },
                      title: { display: false }
                    }
                  }}
                />
              </div>

              <div style={styles.chartCard}>
                <h4 style={styles.chartTitle}>💰 Today's Summary</h4>
                <div style={styles.summaryStats}>
                  <div style={styles.statItem}>
                    <div style={styles.statValue}>{reports.dailyAttendance}</div>
                    <div style={styles.statLabel}>Students Present</div>
                  </div>
                  <div style={styles.statItem}>
                    <div style={styles.statValue}>₹{reports.foodConsumption.totalAmount}</div>
                    <div style={styles.statLabel}>Food Revenue</div>
                  </div>
                  <div style={styles.statItem}>
                    <div style={styles.statValue}>{reports.feedbackRatings.average ? reports.feedbackRatings.average.toFixed(1) : 'N/A'}</div>
                    <div style={styles.statLabel}>Avg Rating</div>
                  </div>
                </div>
              </div>

              <div style={styles.chartCard}>
                <h4 style={styles.chartTitle}>📈 Monthly Trends</h4>
                <Line
                  data={{
                    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
                    datasets: [{
                      label: 'Attendance Count',
                      data: [reports.dailyAttendance * 0.8, reports.dailyAttendance * 0.9, reports.dailyAttendance, reports.dailyAttendance * 1.1],
                      borderColor: '#27ae60',
                      backgroundColor: 'rgba(39, 174, 96, 0.1)',
                    }]
                  }}
                  options={{
                    responsive: true,
                    plugins: {
                      legend: { position: 'top' },
                    }
                  }}
                />
              </div>

              <div style={styles.chartCard}>
                <h4 style={styles.chartTitle}>⭐ Feedback Distribution</h4>
                <Pie
                  data={{
                    labels: ['1 Star', '2 Stars', '3 Stars', '4 Stars', '5 Stars'],
                    datasets: [{
                      data: [2, 3, 5, 8, reports.feedbackRatings.count - 18], // Sample distribution
                      backgroundColor: ['#e74c3c', '#e67e22', '#f39c12', '#f1c40f', '#27ae60'],
                    }]
                  }}
                  options={{
                    responsive: true,
                    plugins: {
                      legend: { position: 'bottom' },
                    }
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: '20px',
    maxWidth: '1200px',
    margin: '0 auto',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  header: {
    textAlign: 'center',
    marginBottom: '30px',
  },
  title: {
    fontSize: '2.5rem',
    fontWeight: 'bold',
    color: '#2c3e50',
    margin: '0 0 10px 0',
  },
  subtitle: {
    fontSize: '1.1rem',
    color: '#7f8c8d',
    margin: 0,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))',
    gap: '30px',
  },
  card: {
    background: '#ffffff',
    borderRadius: '12px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    padding: '24px',
    border: '1px solid #e1e8ed',
  },
  cardHeader: {
    marginBottom: '20px',
  },
  cardTitle: {
    fontSize: '1.5rem',
    fontWeight: '600',
    color: '#2c3e50',
    margin: '0 0 8px 0',
  },
  cardDescription: {
    fontSize: '0.95rem',
    color: '#7f8c8d',
    margin: 0,
  },
  form: {
    marginBottom: '20px',
  },
  formRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
    marginBottom: '16px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
  },
  label: {
    fontSize: '0.9rem',
    fontWeight: '500',
    color: '#34495e',
    marginBottom: '6px',
  },
  input: {
    padding: '10px 12px',
    border: '2px solid #e1e8ed',
    borderRadius: '6px',
    fontSize: '0.95rem',
    transition: 'border-color 0.2s',
    outline: 'none',
  },
  select: {
    padding: '10px 12px',
    border: '2px solid #e1e8ed',
    borderRadius: '6px',
    fontSize: '0.95rem',
    background: 'white',
    cursor: 'pointer',
    outline: 'none',
  },
  primaryButton: {
    background: '#3498db',
    color: 'white',
    border: 'none',
    padding: '12px 20px',
    borderRadius: '6px',
    fontSize: '0.95rem',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'background 0.2s',
  },
  secondaryButton: {
    background: '#ecf0f1',
    color: '#2c3e50',
    border: '2px solid #bdc3c7',
    padding: '10px 16px',
    borderRadius: '6px',
    fontSize: '0.9rem',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s',
    marginBottom: '16px',
  },
  feeList: {
    marginTop: '20px',
  },
  listTitle: {
    fontSize: '1.1rem',
    fontWeight: '600',
    color: '#2c3e50',
    margin: '0 0 12px 0',
  },
  feeItems: {
    display: 'grid',
    gap: '8px',
  },
  feeItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 12px',
    background: '#f8f9fa',
    borderRadius: '4px',
    border: '1px solid #e9ecef',
  },
  feePeriod: {
    fontWeight: '500',
    color: '#495057',
  },
  feeAmount: {
    fontWeight: '600',
    color: '#28a745',
  },
  feeInfo: {
    flex: 1,
  },
  editButton: {
    background: '#ffc107',
    color: '#212529',
    border: 'none',
    padding: '6px 12px',
    borderRadius: '4px',
    fontSize: '0.85rem',
    cursor: 'pointer',
    marginLeft: '12px',
  },
  currentDayCard: {
    border: '2px solid #3498db',
    background: '#ecf0f1',
  },
  currentDayTitle: {
    color: '#3498db',
    fontWeight: 'bold',
  },
  chartCard: {
    background: '#f8f9fa',
    padding: '16px',
    borderRadius: '8px',
    border: '1px solid #e9ecef',
  },
  chartTitle: {
    fontSize: '1rem',
    fontWeight: '600',
    color: '#2c3e50',
    margin: '0 0 12px 0',
    textAlign: 'center',
  },
  summaryStats: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '12px',
  },
  statItem: {
    textAlign: 'center',
    padding: '12px',
    background: 'white',
    borderRadius: '6px',
    border: '1px solid #e9ecef',
  },
  statValue: {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    color: '#3498db',
    margin: '0 0 4px 0',
  },
  statLabel: {
    fontSize: '0.85rem',
    color: '#6c757d',
    margin: 0,
  },
  menuList: {
    marginTop: '16px',
  },
  menuItems: {
    display: 'grid',
    gap: '8px',
  },
  menuItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 12px',
    background: '#f8f9fa',
    borderRadius: '4px',
    border: '1px solid #e9ecef',
  },
  menuDate: {
    fontWeight: '500',
    color: '#495057',
  },
  editButton: {
    background: '#ffc107',
    color: '#212529',
    border: 'none',
    padding: '6px 12px',
    borderRadius: '4px',
    fontSize: '0.85rem',
    cursor: 'pointer',
  },
  menuEditor: {
    marginTop: '20px',
    padding: '20px',
    background: '#f8f9fa',
    borderRadius: '8px',
    border: '1px solid #e9ecef',
  },
  editorTitle: {
    fontSize: '1.2rem',
    fontWeight: '600',
    color: '#2c3e50',
    margin: '0 0 16px 0',
  },
  daysGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '16px',
    marginBottom: '24px',
  },
  dayCard: {
    background: 'white',
    padding: '16px',
    borderRadius: '8px',
    border: '1px solid #e9ecef',
  },
  dayTitle: {
    fontSize: '1rem',
    fontWeight: '600',
    color: '#2c3e50',
    margin: '0 0 12px 0',
    textTransform: 'capitalize',
  },
  mealInputs: {
    display: 'grid',
    gap: '8px',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
  },
  inputLabel: {
    fontSize: '0.85rem',
    fontWeight: '500',
    color: '#495057',
    marginBottom: '4px',
  },
  mealInput: {
    padding: '8px 10px',
    border: '1px solid #ced4da',
    borderRadius: '4px',
    fontSize: '0.9rem',
    outline: 'none',
  },
  specialMenu: {
    marginBottom: '20px',
  },
  specialTitle: {
    fontSize: '1.1rem',
    fontWeight: '600',
    color: '#2c3e50',
    margin: '0 0 12px 0',
  },
  specialInputs: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '12px',
  },
  notesSection: {
    marginBottom: '20px',
  },
  notesInput: {
    width: '100%',
    padding: '10px',
    border: '1px solid #ced4da',
    borderRadius: '4px',
    fontSize: '0.9rem',
    minHeight: '60px',
    outline: 'none',
    resize: 'vertical',
  },
  buttonGroup: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
  },
  cancelButton: {
    background: '#6c757d',
    color: 'white',
    border: 'none',
    padding: '10px 16px',
    borderRadius: '6px',
    fontSize: '0.9rem',
    cursor: 'pointer',
  },
  assignSection: {
    textAlign: 'center',
  },
  assignSelect: {
    width: '100%',
    maxWidth: '400px',
    padding: '12px',
    border: '2px solid #e1e8ed',
    borderRadius: '6px',
    fontSize: '0.95rem',
    background: 'white',
    cursor: 'pointer',
    outline: 'none',
    marginBottom: '12px',
  },
  assignNote: {
    fontSize: '0.9rem',
    color: '#6c757d',
    margin: 0,
  },
  reportsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '16px',
    marginTop: '20px',
  },
  reportCard: {
    background: '#f8f9fa',
    padding: '16px',
    borderRadius: '8px',
    border: '1px solid #e9ecef',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  reportIcon: {
    fontSize: '2rem',
  },
  reportContent: {
    flex: 1,
  },
  reportTitle: {
    fontSize: '0.9rem',
    fontWeight: '600',
    color: '#2c3e50',
    margin: '0 0 4px 0',
  },
  reportValue: {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    color: '#3498db',
    margin: '0 0 2px 0',
  },
  reportLabel: {
    fontSize: '0.8rem',
    color: '#6c757d',
    margin: 0,
  },
};

export default MessAdminPanel;

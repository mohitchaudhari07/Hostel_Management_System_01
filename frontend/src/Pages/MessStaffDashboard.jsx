import { useState, useEffect } from "react";
import axios from "axios";

function MessStaffDashboard() {
  const user = JSON.parse(localStorage.getItem("user")) || {};
  const [weekMenus, setWeekMenus] = useState([]);
  const [selectedMenu, setSelectedMenu] = useState(null);
  const [attendanceSummary, setAttendanceSummary] = useState(null);
  const [currentDay, setCurrentDay] = useState(new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMenus();
    fetchAttendanceSummary();
  }, []);

  const fetchMenus = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/mess/menus", {
        headers: {
          "x-user-id": user.id,
          "x-user-role": user.role
        }
      });
      setWeekMenus(response.data);
    } catch (error) {
      console.error("Error fetching menus:", error);
    }
  };

  const fetchAttendanceSummary = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/mess/attendance/summary", {
        headers: {
          "x-user-id": user.id,
          "x-user-role": user.role
        }
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
      await axios.put(`http://localhost:5000/api/mess/menus/${menuId}`, {
        day,
        meal,
        status
      }, {
        headers: {
          "x-user-id": user.id,
          "x-user-role": user.role
        }
      });
      fetchMenus();
    } catch (error) {
      alert("Error updating menu status: " + (error.response?.data?.message || "Unknown error"));
    }
  };

  const markAttendance = async (mealType) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      await axios.post("http://localhost:5000/api/mess/attendance", {
        date: today,
        mealType,
        attendees: [] // This will be handled by the backend or separate interface
      }, {
        headers: {
          "x-user-id": user.id,
          "x-user-role": user.role
        }
      });
      alert("Attendance marked successfully!");
      fetchAttendanceSummary();
    } catch (error) {
      alert("Error marking attendance: " + (error.response?.data?.message || "Unknown error"));
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    window.location.href = "/";
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p>Loading mess staff dashboard...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>Mess Staff Dashboard</h1>
        <div style={styles.userInfo}>
          <span>Welcome, {user.name}</span>
          <button onClick={handleLogout} style={styles.logoutBtn}>Logout</button>
        </div>
      </header>

      <div style={styles.content}>
        {/* Attendance Summary */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Today's Attendance Summary</h2>
          {attendanceSummary && (
            <div style={styles.attendanceGrid}>
              <div style={styles.attendanceCard}>
                <h3>Breakfast</h3>
                <p style={styles.attendanceNumber}>{attendanceSummary.breakfast}</p>
              </div>
              <div style={styles.attendanceCard}>
                <h3>Lunch</h3>
                <p style={styles.attendanceNumber}>{attendanceSummary.lunch}</p>
              </div>
              <div style={styles.attendanceCard}>
                <h3>Dinner</h3>
                <p style={styles.attendanceNumber}>{attendanceSummary.dinner}</p>
              </div>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Quick Actions</h2>
          <div style={styles.actionGrid}>
            <button onClick={() => markAttendance('breakfast')} style={styles.actionBtn}>
              Mark Breakfast Attendance
            </button>
            <button onClick={() => markAttendance('lunch')} style={styles.actionBtn}>
              Mark Lunch Attendance
            </button>
            <button onClick={() => markAttendance('dinner')} style={styles.actionBtn}>
              Mark Dinner Attendance
            </button>
          </div>
        </div>

        {/* Weekly Menu */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Weekly Menu</h2>
          {weekMenus.length === 0 ? (
            <p>No menus available</p>
          ) : (
            <div style={styles.menuGrid}>
              {weekMenus.map(menu => (
                <div key={menu._id} style={styles.menuCard}>
                  <h3 style={styles.menuTitle}>
                    Week of {new Date(menu.weekOf).toLocaleDateString()}
                  </h3>
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
                        <div style={styles.mealSection}>
                          <div style={styles.mealItem}>
                            <span>Breakfast: {menu.days?.[d]?.breakfast || 'N/A'}</span>
                            <select
                              value={menu.days?.[d]?.breakfastStatus || 'pending'}
                              onChange={(e) => updateMenuStatus(menu._id, d, 'breakfast', e.target.value)}
                              style={styles.statusSelect}
                            >
                              <option value="pending">Pending</option>
                              <option value="preparing">Preparing</option>
                              <option value="ready">Ready</option>
                              <option value="served">Served</option>
                            </select>
                          </div>
                          <div style={styles.mealItem}>
                            <span>Lunch: {menu.days?.[d]?.lunch || 'N/A'}</span>
                            <select
                              value={menu.days?.[d]?.lunchStatus || 'pending'}
                              onChange={(e) => updateMenuStatus(menu._id, d, 'lunch', e.target.value)}
                              style={styles.statusSelect}
                            >
                              <option value="pending">Pending</option>
                              <option value="preparing">Preparing</option>
                              <option value="ready">Ready</option>
                              <option value="served">Served</option>
                            </select>
                          </div>
                          <div style={styles.mealItem}>
                            <span>Dinner: {menu.days?.[d]?.dinner || 'N/A'}</span>
                            <select
                              value={menu.days?.[d]?.dinnerStatus || 'pending'}
                              onChange={(e) => updateMenuStatus(menu._id, d, 'dinner', e.target.value)}
                              style={styles.statusSelect}
                            >
                              <option value="pending">Pending</option>
                              <option value="preparing">Preparing</option>
                              <option value="ready">Ready</option>
                              <option value="served">Served</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f4f6f9',
  },
  header: {
    backgroundColor: '#2c3e50',
    color: 'white',
    padding: '20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
  },
  title: {
    margin: 0,
    fontSize: '24px',
    fontWeight: 'bold',
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
  },
  logoutBtn: {
    backgroundColor: '#e74c3c',
    color: 'white',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  content: {
    padding: '20px',
  },
  section: {
    backgroundColor: 'white',
    borderRadius: '10px',
    padding: '20px',
    marginBottom: '20px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
  },
  sectionTitle: {
    margin: '0 0 20px 0',
    color: '#2c3e50',
    fontSize: '20px',
    fontWeight: 'bold',
  },
  attendanceGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px',
  },
  attendanceCard: {
    backgroundColor: '#f8f9fa',
    padding: '20px',
    borderRadius: '8px',
    textAlign: 'center',
    border: '2px solid #3498db',
  },
  attendanceNumber: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#3498db',
    margin: '10px 0 0 0',
  },
  actionGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '15px',
  },
  actionBtn: {
    backgroundColor: '#27ae60',
    color: 'white',
    border: 'none',
    padding: '15px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 'bold',
    transition: 'background-color 0.3s',
  },
  menuGrid: {
    display: 'grid',
    gap: '20px',
  },
  menuCard: {
    border: '1px solid #ddd',
    borderRadius: '8px',
    padding: '20px',
  },
  menuTitle: {
    margin: '0 0 20px 0',
    color: '#2c3e50',
    fontSize: '18px',
  },
  daysGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '15px',
  },
  dayCard: {
    border: '1px solid #ddd',
    borderRadius: '8px',
    padding: '15px',
    backgroundColor: '#f8f9fa',
  },
  currentDayCard: {
    borderColor: '#f39c12',
    backgroundColor: '#fff3cd',
  },
  dayTitle: {
    margin: '0 0 15px 0',
    color: '#2c3e50',
    fontSize: '16px',
    fontWeight: 'bold',
  },
  currentDayTitle: {
    color: '#f39c12',
  },
  mealSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  mealItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px',
    backgroundColor: 'white',
    borderRadius: '4px',
  },
  statusSelect: {
    padding: '4px 8px',
    borderRadius: '4px',
    border: '1px solid #ddd',
    fontSize: '12px',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    backgroundColor: '#f4f6f9',
  },
  spinner: {
    width: '50px',
    height: '50px',
    border: '5px solid #f3f3f3',
    borderTop: '5px solid #3498db',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
};

export default MessStaffDashboard;
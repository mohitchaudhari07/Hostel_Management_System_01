import { useState, useEffect } from "react";
import axios from "axios";


function AttendanceAnalytics() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
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
        `http://localhost:5000/api/attendance/analytics?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`
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
    setDateRange(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p>Loading attendance analytics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.errorContainer}>
        <div style={styles.errorIcon}>⚠️</div>
        <h3>Failed to Load Analytics</h3>
        <p>{error}</p>
        <button style={styles.retryBtn} onClick={fetchAnalytics}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>📊 Attendance Analytics</h2>
        <p style={styles.subtitle}>Comprehensive attendance insights and reports</p>
      </div>

      {/* Date Range Filter */}
      <div style={styles.filters}>
        <div style={styles.filterGroup}>
          <label style={styles.filterLabel}>Start Date:</label>
          <input
            type="date"
            value={dateRange.startDate}
            onChange={(e) => handleDateChange('startDate', e.target.value)}
            style={styles.dateInput}
          />
        </div>
        <div style={styles.filterGroup}>
          <label style={styles.filterLabel}>End Date:</label>
          <input
            type="date"
            value={dateRange.endDate}
            onChange={(e) => handleDateChange('endDate', e.target.value)}
            style={styles.dateInput}
          />
        </div>
        <button style={styles.refreshBtn} onClick={fetchAnalytics}>
          🔄 Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div style={styles.summaryGrid}>
        <div style={styles.summaryCard}>
          <div style={styles.summaryIcon}>📅</div>
          <div>
            <p style={styles.summaryLabel}>Total Days</p>
            <p style={styles.summaryValue}>{analytics?.summary?.totalDays || 0}</p>
          </div>
        </div>
        <div style={styles.summaryCard}>
          <div style={styles.summaryIcon}>👥</div>
          <div>
            <p style={styles.summaryLabel}>Total Students</p>
            <p style={styles.summaryValue}>{analytics?.summary?.totalStudents || 0}</p>
          </div>
        </div>
        <div style={styles.summaryCard}>
          <div style={styles.summaryIcon}>📈</div>
          <div>
            <p style={styles.summaryLabel}>Avg Attendance</p>
            <p style={styles.summaryValue}>{analytics?.summary?.averageAttendance?.toFixed(1) || 0}%</p>
          </div>
        </div>
      </div>

      {/* Daily Attendance Chart */}
      <div style={styles.chartSection}>
        <h3 style={styles.sectionTitle}>📊 Daily Attendance Trends</h3>
        <div style={styles.chartContainer}>
          {analytics?.dailyStats?.length > 0 ? (
            <div style={styles.chart}>
              {analytics.dailyStats.slice(-14).map((day, index) => (
                <div key={day.date} style={styles.chartBar}>
                  <div style={styles.barContainer}>
                    <div
                      style={{
                        ...styles.barPresent,
                        height: `${(day.present / day.total) * 100}%`,
                      }}
                    />
                    <div
                      style={{
                        ...styles.barPartial,
                        height: `${(day.partial / day.total) * 100}%`,
                      }}
                    />
                    <div
                      style={{
                        ...styles.barAbsent,
                        height: `${(day.absent / day.total) * 100}%`,
                      }}
                    />
                  </div>
                  <p style={styles.barLabel}>
                    {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div style={styles.emptyChart}>
              <div style={styles.emptyIcon}>📈</div>
              <p>No attendance data for the selected period</p>
            </div>
          )}
        </div>
        <div style={styles.legend}>
          <div style={styles.legendItem}>
            <div style={{ ...styles.legendColor, backgroundColor: '#27ae60' }}></div>
            <span>Present</span>
          </div>
          <div style={styles.legendItem}>
            <div style={{ ...styles.legendColor, backgroundColor: '#f39c12' }}></div>
            <span>Partial</span>
          </div>
          <div style={styles.legendItem}>
            <div style={{ ...styles.legendColor, backgroundColor: '#e74c3c' }}></div>
            <span>Absent</span>
          </div>
        </div>
      </div>

      {/* Student Performance Table */}
      <div style={styles.tableSection}>
        <h3 style={styles.sectionTitle}>👨‍🎓 Student Attendance Performance</h3>
        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.tableHeader}>Student Name</th>
                <th style={styles.tableHeader}>Email</th>
                <th style={styles.tableHeader}>Total Days</th>
                <th style={styles.tableHeader}>Present</th>
                <th style={styles.tableHeader}>Partial</th>
                <th style={styles.tableHeader}>Absent</th>
                <th style={styles.tableHeader}>Attendance %</th>
              </tr>
            </thead>
            <tbody>
              {analytics?.studentStats?.map((student) => (
                <tr key={student.student._id} style={styles.tableRow}>
                  <td style={styles.tableCell}>{student.student.name}</td>
                  <td style={styles.tableCell}>{student.student.email}</td>
                  <td style={styles.tableCell}>{student.total}</td>
                  <td style={{ ...styles.tableCell, color: '#27ae60' }}>{student.present}</td>
                  <td style={{ ...styles.tableCell, color: '#f39c12' }}>{student.partial}</td>
                  <td style={{ ...styles.tableCell, color: '#e74c3c' }}>{student.absent}</td>
                  <td style={{
                    ...styles.tableCell,
                    fontWeight: 'bold',
                    color: student.percentage >= 75 ? '#27ae60' : student.percentage >= 60 ? '#f39c12' : '#e74c3c'
                  }}>
                    {student.percentage}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: "30px",
    maxWidth: "1200px",
    margin: "0 auto",
  },

  header: {
    marginBottom: "30px",
  },

  title: {
    fontSize: "28px",
    fontWeight: "700",
    color: "#2c3e50",
    margin: "0 0 5px 0",
  },

  subtitle: {
    fontSize: "16px",
    color: "#7f8c8d",
    margin: 0,
  },

  filters: {
    display: "flex",
    gap: "20px",
    alignItems: "end",
    marginBottom: "30px",
    padding: "20px",
    background: "rgba(255, 255, 255, 0.95)",
    borderRadius: "12px",
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
  },

  filterGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "5px",
  },

  filterLabel: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#2c3e50",
  },

  dateInput: {
    padding: "8px 12px",
    border: "1px solid #ddd",
    borderRadius: "6px",
    fontSize: "14px",
  },

  refreshBtn: {
    padding: "8px 16px",
    background: "linear-gradient(135deg, #3498db, #2980b9)",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "600",
  },

  summaryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "20px",
    marginBottom: "40px",
  },

  summaryCard: {
    background: "linear-gradient(135deg, rgba(52, 152, 219, 0.1), rgba(41, 128, 185, 0.1))",
    padding: "20px",
    borderRadius: "12px",
    border: "1px solid rgba(52, 152, 219, 0.2)",
    display: "flex",
    alignItems: "center",
    gap: "15px",
  },

  summaryIcon: {
    fontSize: "32px",
  },

  summaryLabel: {
    fontSize: "14px",
    color: "#7f8c8d",
    margin: "0 0 5px 0",
  },

  summaryValue: {
    fontSize: "24px",
    fontWeight: "700",
    color: "#2c3e50",
    margin: 0,
  },

  chartSection: {
    marginBottom: "40px",
  },

  sectionTitle: {
    fontSize: "20px",
    fontWeight: "600",
    color: "#2c3e50",
    margin: "0 0 20px 0",
  },

  chartContainer: {
    background: "rgba(255, 255, 255, 0.95)",
    borderRadius: "12px",
    padding: "20px",
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
  },

  chart: {
    display: "flex",
    alignItems: "end",
    gap: "8px",
    height: "200px",
    marginBottom: "20px",
  },

  chartBar: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "8px",
  },

  barContainer: {
    width: "100%",
    height: "150px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "end",
    borderRadius: "4px 4px 0 0",
    overflow: "hidden",
    border: "1px solid #ddd",
  },

  barPresent: {
    backgroundColor: "#27ae60",
    width: "100%",
  },

  barPartial: {
    backgroundColor: "#f39c12",
    width: "100%",
  },

  barAbsent: {
    backgroundColor: "#e74c3c",
    width: "100%",
  },

  barLabel: {
    fontSize: "11px",
    color: "#7f8c8d",
    margin: 0,
    textAlign: "center",
  },

  legend: {
    display: "flex",
    justifyContent: "center",
    gap: "20px",
  },

  legendItem: {
    display: "flex",
    alignItems: "center",
    gap: "5px",
    fontSize: "14px",
    color: "#2c3e50",
  },

  legendColor: {
    width: "12px",
    height: "12px",
    borderRadius: "2px",
  },

  emptyChart: {
    textAlign: "center",
    padding: "40px",
    color: "#7f8c8d",
  },

  emptyIcon: {
    fontSize: "48px",
    marginBottom: "10px",
  },

  tableSection: {
    marginBottom: "40px",
  },

  tableContainer: {
    background: "rgba(255, 255, 255, 0.95)",
    borderRadius: "12px",
    overflow: "hidden",
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
  },

  tableHeader: {
    background: "linear-gradient(135deg, #667eea, #764ba2)",
    color: "white",
    padding: "15px",
    textAlign: "left",
    fontWeight: "600",
    fontSize: "14px",
  },

  tableRow: {
    borderBottom: "1px solid #eee",
  },

  tableCell: {
    padding: "12px 15px",
    fontSize: "14px",
    color: "#2c3e50",
  },

  loadingContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "400px",
    color: "#7f8c8d",
  },

  spinner: {
    width: "40px",
    height: "40px",
    border: "4px solid #f3f3f3",
    borderTop: "4px solid #3498db",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
    marginBottom: "20px",
  },

  errorContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "400px",
    color: "#2c3e50",
    textAlign: "center",
  },

  errorIcon: {
    fontSize: "48px",
    marginBottom: "20px",
  },

  retryBtn: {
    padding: "10px 20px",
    background: "linear-gradient(135deg, #e74c3c, #c0392b)",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "600",
    marginTop: "20px",
  },
};

export default AttendanceAnalytics;
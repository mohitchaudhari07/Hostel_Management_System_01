import { useState, useEffect } from "react";
import axios from "axios";
import AdminEnquiries from "./AdminEnquiries";
import RoomManagement from "./RoomManagement";
import StudentManagement from "./StudentManagement";
import FaceRegistration from "./FaceRegistration";
import FaceAttendance from "./FaceAttendance";
import AttendanceAnalytics from "./AttendanceAnalytics";
import MessDashboard from "./MessDashboard";
import MessAdminPanel from "./MessAdminPanel";
import UserManagement from "./UserManagement";

function AdminDashboard() {
  const [activePage, setActivePage] = useState("dashboard");
  const [stats, setStats] = useState({
    totalEnquiries: 0,
    newEnquiries: 0,
    approvedStudents: 0,
    availableRooms: 0,
    totalRooms: 0,
    occupiedRooms: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (activePage === "dashboard") {
      fetchDashboardStats();
    }
  }, [activePage]);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all required data in parallel
      const [enquiriesRes, roomsRes, studentsRes] = await Promise.all([
        axios.get("http://localhost:5000/api/enquiries"),
        axios.get("http://localhost:5000/api/rooms"),
        axios.get("http://localhost:5000/api/auth/students")
      ]);

      const enquiries = enquiriesRes.data;
      const rooms = roomsRes.data;
      const students = studentsRes.data;

      // Calculate statistics
      const totalEnquiries = enquiries.length;
      const newEnquiries = enquiries.filter(enq => enq.status === "New").length;
      const approvedStudents = students.filter(student => student.isRoomAssigned).length;
      const availableRooms = rooms.filter(room => room.availableBeds > 0).length;
      const totalRooms = rooms.length;
      const occupiedRooms = totalRooms - availableRooms;

      setStats({
        totalEnquiries,
        newEnquiries,
        approvedStudents,
        availableRooms,
        totalRooms,
        occupiedRooms
      });
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      setError("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    window.location.href = "/";
  };

  const renderContent = () => {
    switch (activePage) {
      case "enquiries":
        return <AdminEnquiries />;
      case "rooms":
        return <RoomManagement />;
      case "students":
        return <StudentManagement />;
      case "users":
        return <UserManagement />;
      case "face-registration":
        return <FaceRegistration />;
      case "face-attendance":
        return <FaceAttendance />;
      case "analytics":
        return <AttendanceAnalytics />;
      case "mess":
        return <MessDashboard />;
      case "mess-management":
        return <MessAdminPanel />;
      default:
        return (
          <div>
            {loading ? (
              <div style={styles.loadingContainer}>
                <div style={styles.spinner}></div>
                <p>Loading dashboard data...</p>
              </div>
            ) : error ? (
              <div style={styles.errorContainer}>
                <div style={styles.errorIcon}>⚠️</div>
                <h3>Failed to Load Data</h3>
                <p>{error}</p>
                <button style={styles.retryBtn} onClick={fetchDashboardStats}>
                  Retry
                </button>
              </div>
            ) : (
              <div style={styles.cardContainer}>
                <div style={styles.card}>
                  <div style={styles.cardIcon}>📊</div>
                  <h3>Total Enquiries</h3>
                  <p style={styles.cardNumber}>{stats.totalEnquiries}</p>
                  <p style={styles.cardSubtext}>All time</p>
                </div>

                <div style={styles.card}>
                  <div style={styles.cardIcon}>🆕</div>
                  <h3>New Enquiries</h3>
                  <p style={styles.cardNumber}>{stats.newEnquiries}</p>
                  <p style={styles.cardSubtext}>Pending review</p>
                </div>

                <div style={styles.card}>
                  <div style={styles.cardIcon}>✅</div>
                  <h3>Room Allocated</h3>
                  <p style={styles.cardNumber}>{stats.approvedStudents}</p>
                  <p style={styles.cardSubtext}>Students with rooms</p>
                </div>

                <div style={styles.card}>
                  <div style={styles.cardIcon}>🛏️</div>
                  <h3>Available Rooms</h3>
                  <p style={styles.cardNumber}>{stats.availableRooms}</p>
                  <p style={styles.cardSubtext}>Out of {stats.totalRooms} total</p>
                </div>

                <div style={styles.card}>
                  <div style={styles.cardIcon}>🏢</div>
                  <h3>Room Occupancy</h3>
                  <p style={styles.cardNumber}>
                    {stats.totalRooms > 0 ? Math.round((stats.occupiedRooms / stats.totalRooms) * 100) : 0}%
                  </p>
                  <p style={styles.cardSubtext}>{stats.occupiedRooms} occupied</p>
                </div>

                <div style={styles.card}>
                  <div style={styles.cardIcon}>👥</div>
                  <h3>Total Students</h3>
                  <p style={styles.cardNumber}>{stats.approvedStudents}</p>
                  <p style={styles.cardSubtext}>Registered students</p>
                </div>
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <div style={styles.container}>
      {/* Sidebar */}
      <div style={styles.sidebar}>
        <div style={styles.logo}>
          <div style={styles.logoIcon}>🏫</div>
          <h2 style={styles.logoText}>HostelAdmin</h2>
        </div>

        <nav style={styles.nav}>
          <button
            style={{
              ...styles.navItem,
              ...(activePage === "dashboard" ? styles.navItemActive : {})
            }}
            onClick={() => setActivePage("dashboard")}
          >
            <span style={styles.navIcon}>📊</span>
            Dashboard
          </button>

          <button
            style={{
              ...styles.navItem,
              ...(activePage === "enquiries" ? styles.navItemActive : {})
            }}
            onClick={() => setActivePage("enquiries")}
          >
            <span style={styles.navIcon}>📩</span>
            Enquiries
          </button>

          <button
            style={{
              ...styles.navItem,
              ...(activePage === "rooms" ? styles.navItemActive : {})
            }}
            onClick={() => setActivePage("rooms")}
          >
            <span style={styles.navIcon}>🛏️</span>
            Rooms
          </button>

          <button
            style={{
              ...styles.navItem,
              ...(activePage === "students" ? styles.navItemActive : {})
            }}
            onClick={() => setActivePage("students")}
          >
            <span style={styles.navIcon}>🎓</span>
            Students
          </button>

          <button
            style={{
              ...styles.navItem,
              ...(activePage === "users" ? styles.navItemActive : {})
            }}
            onClick={() => setActivePage("users")}
          >
            <span style={styles.navIcon}>👥</span>
            User Management
          </button>

          <button
            style={{
              ...styles.navItem,
              ...(activePage === "face-registration" ? styles.navItemActive : {})
            }}
            onClick={() => setActivePage("face-registration")}
          >
            <span style={styles.navIcon}>📸</span>
            Face Registration
          </button>

          <button
            style={{
              ...styles.navItem,
              ...(activePage === "face-attendance" ? styles.navItemActive : {})
            }}
            onClick={() => setActivePage("face-attendance")}
          >
            <span style={styles.navIcon}>🔍</span>
            Face Attendance
          </button>

          <button
            style={{
              ...styles.navItem,
              ...(activePage === "analytics" ? styles.navItemActive : {})
            }}
            onClick={() => setActivePage("analytics")}
          >
            <span style={styles.navIcon}>📊</span>
            Attendance Analytics
          </button>

          <button
            style={{
              ...styles.navItem,
              ...(activePage === "mess" ? styles.navItemActive : {})
            }}
            onClick={() => setActivePage("mess")}
          >
            <span style={styles.navIcon}>🍽️</span>
            Mess Dashboard
          </button>

          <button
            style={{
              ...styles.navItem,
              ...(activePage === "mess-management" ? styles.navItemActive : {})
            }}
            onClick={() => setActivePage("mess-management")}
          >
            <span style={styles.navIcon}>⚙️</span>
            Mess Management
          </button>
        </nav>

        <div style={styles.sidebarFooter}>
          <button style={styles.logoutBtn} onClick={handleLogout}>
            🚪 Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={styles.main}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.headerLeft}>
            <h1 style={styles.pageTitle}>
              {activePage === "dashboard" && "Dashboard Overview"}
              {activePage === "enquiries" && "Enquiry Management"}
              {activePage === "rooms" && "Room Management"}
              {activePage === "students" && "Student Management"}
              {activePage === "users" && "User Management"}
              {activePage === "face-registration" && "Face Registration"}
              {activePage === "face-attendance" && "Face Attendance Tracking"}
              {activePage === "analytics" && "Attendance Analytics"}
              {activePage === "mess" && "Mess Dashboard"}
              {activePage === "mess-management" && "Mess Management"}
            </h1>
            <p style={styles.pageSubtitle}>
              {activePage === "dashboard" && "Monitor your hostel operations"}
              {activePage === "enquiries" && "Manage student enquiries and applications"}
              {activePage === "rooms" && "Manage rooms and bed assignments"}
              {activePage === "students" && "View and manage student information"}
              {activePage === "users" && "Create and manage system users"}
              {activePage === "face-registration" && "Register student faces for biometric authentication"}
              {activePage === "face-attendance" && "Track attendance using face recognition"}
              {activePage === "mess" && "View daily meal count based on attendance"}
              {activePage === "mess-management" && "Manage mess fee structure, menus, and assignments"}
            </p>
          </div>
          <div style={styles.headerRight}>
            <div style={styles.userInfo}>
              <div style={styles.userAvatar}>
                <span style={styles.avatarText}>A</span>
              </div>
              <div style={styles.userDetails}>
                <p style={styles.userName}>Admin</p>
                <p style={styles.userRole}>Administrator</p>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Content */}
        <div style={styles.content}>
          {renderContent()}
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    minHeight: "100vh",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
  },

  sidebar: {
    width: "280px",
    background: "rgba(255, 255, 255, 0.95)",
    backdropFilter: "blur(20px)",
    padding: "30px 20px",
    display: "flex",
    flexDirection: "column",
    boxShadow: "2px 0 20px rgba(0, 0, 0, 0.1)",
    borderRight: "1px solid rgba(255, 255, 255, 0.2)"
  },

  logo: {
    display: "flex",
    alignItems: "center",
    gap: "15px",
    marginBottom: "40px",
    paddingBottom: "20px",
    borderBottom: "2px solid rgba(102, 126, 234, 0.2)"
  },

  logoIcon: {
    fontSize: "32px",
    background: "linear-gradient(135deg, #667eea, #764ba2)",
    borderRadius: "12px",
    width: "50px",
    height: "50px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 4px 15px rgba(102, 126, 234, 0.3)"
  },

  logoText: {
    fontSize: "24px",
    fontWeight: "700",
    color: "#2c3e50",
    margin: 0
  },

  nav: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: "8px"
  },

  navItem: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "15px 20px",
    background: "transparent",
    border: "none",
    borderRadius: "12px",
    color: "#5a6c7d",
    fontSize: "16px",
    fontWeight: "500",
    cursor: "pointer",
    transition: "all 0.3s ease",
    textAlign: "left",
    "&:hover": {
      background: "rgba(102, 126, 234, 0.1)",
      color: "#667eea",
      transform: "translateX(5px)"
    }
  },

  navItemActive: {
    background: "linear-gradient(135deg, #667eea, #764ba2)",
    color: "white",
    boxShadow: "0 4px 15px rgba(102, 126, 234, 0.3)",
    "&:hover": {
      background: "linear-gradient(135deg, #667eea, #764ba2)",
      color: "white",
      transform: "translateX(5px)"
    }
  },

  navIcon: {
    fontSize: "18px",
    width: "20px",
    textAlign: "center"
  },

  sidebarFooter: {
    marginTop: "auto",
    paddingTop: "20px",
    borderTop: "1px solid rgba(0, 0, 0, 0.1)"
  },

  logoutBtn: {
    width: "100%",
    padding: "12px 20px",
    background: "linear-gradient(135deg, #e74c3c, #c0392b)",
    color: "white",
    border: "none",
    borderRadius: "10px",
    fontSize: "16px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.3s ease",
    "&:hover": {
      transform: "translateY(-2px)",
      boxShadow: "0 4px 15px rgba(231, 76, 60, 0.3)"
    }
  },

  main: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden"
  },

  header: {
    background: "rgba(255, 255, 255, 0.95)",
    backdropFilter: "blur(20px)",
    padding: "25px 30px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    boxShadow: "0 2px 20px rgba(0, 0, 0, 0.1)",
    borderBottom: "1px solid rgba(255, 255, 255, 0.2)"
  },

  headerLeft: {
    flex: 1
  },

  pageTitle: {
    fontSize: "28px",
    fontWeight: "700",
    color: "#2c3e50",
    margin: "0 0 5px 0"
  },

  pageSubtitle: {
    fontSize: "16px",
    color: "#7f8c8d",
    margin: 0
  },

  headerRight: {
    display: "flex",
    alignItems: "center"
  },

  userInfo: {
    display: "flex",
    alignItems: "center",
    gap: "15px"
  },

  userAvatar: {
    width: "45px",
    height: "45px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #667eea, #764ba2)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 4px 15px rgba(102, 126, 234, 0.3)"
  },

  avatarText: {
    color: "white",
    fontSize: "18px",
    fontWeight: "700"
  },

  userDetails: {
    textAlign: "right"
  },

  userName: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#2c3e50",
    margin: "0 0 2px 0"
  },

  userRole: {
    fontSize: "14px",
    color: "#7f8c8d",
    margin: 0
  },

  content: {
    flex: 1,
    padding: "30px",
    overflowY: "auto",
    background: "rgba(255, 255, 255, 0.05)"
  },

  loadingContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "80px",
    textAlign: "center",
    background: "rgba(255, 255, 255, 0.9)",
    borderRadius: "20px",
    border: "1px solid rgba(255, 255, 255, 0.2)"
  },

  spinner: {
    width: "60px",
    height: "60px",
    border: "4px solid #f3f3f3",
    borderTop: "4px solid #667eea",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
    marginBottom: "20px"
  },

  errorContainer: {
    textAlign: "center",
    padding: "80px",
    background: "rgba(255, 255, 255, 0.9)",
    borderRadius: "20px",
    border: "1px solid rgba(231, 76, 60, 0.2)"
  },

  errorIcon: {
    fontSize: "60px",
    marginBottom: "20px"
  },

  retryBtn: {
    background: "linear-gradient(135deg, #667eea, #764ba2)",
    color: "white",
    border: "none",
    padding: "12px 24px",
    borderRadius: "10px",
    cursor: "pointer",
    fontSize: "16px",
    fontWeight: "600",
    marginTop: "20px",
    transition: "all 0.3s ease",
    "&:hover": {
      transform: "translateY(-2px)",
      boxShadow: "0 4px 15px rgba(102, 126, 234, 0.3)"
    }
  },

  cardContainer: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "25px",
    marginBottom: "30px"
  },

  card: {
    background: "rgba(255, 255, 255, 0.95)",
    backdropFilter: "blur(20px)",
    padding: "30px",
    borderRadius: "20px",
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
    border: "1px solid rgba(255, 255, 255, 0.2)",
    transition: "all 0.3s ease",
    textAlign: "center",
    "&:hover": {
      transform: "translateY(-5px)",
      boxShadow: "0 15px 40px rgba(0, 0, 0, 0.15)"
    }
  },

  cardIcon: {
    fontSize: "40px",
    marginBottom: "15px"
  },

  cardNumber: {
    fontSize: "36px",
    fontWeight: "700",
    color: "#2c3e50",
    margin: "15px 0",
    background: "linear-gradient(135deg, #667eea, #764ba2)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text"
  },

  cardSubtext: {
    fontSize: "14px",
    color: "#7f8c8d",
    margin: "5px 0 0 0",
    fontWeight: "500"
  }
};

export default AdminDashboard;

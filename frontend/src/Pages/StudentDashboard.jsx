import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import axios from "axios";

function StudentPanel() {
  const user = JSON.parse(localStorage.getItem("user"));
  const navigate = useNavigate();
  const [studentData, setStudentData] = useState(null);
  const [activeMenu, setActiveMenu] = useState("dashboard");
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("online");
  const [transactionId, setTransactionId] = useState("");
  const [paymentType, setPaymentType] = useState("total");

  useEffect(() => {
    fetchStudentData();
  }, []);

  useEffect(() => {
    if (activeMenu === "fees" && studentData) {
      fetchPaymentDetails();
      fetchInvoices();
    }
  }, [activeMenu, studentData]);

  const fetchStudentData = async () => {
    try {
      console.log("Fetching student data for user:", user);
      const response = await axios.get(`http://localhost:5000/api/auth/students`);
      const students = response.data;
      console.log("All students:", students);
      const currentStudent = students.find(s => s.email === user.email);
      console.log("Current student found:", currentStudent);
      setStudentData(currentStudent);
    } catch (error) {
      console.error("Error fetching student data:", error);
    }
  };

  const fetchPaymentDetails = async () => {
    try {
      if (!studentData) {
        console.log("No student data available yet");
        return;
      }

      console.log("Fetching payment details for student:", studentData._id);
      const response = await axios.get(`http://localhost:5000/api/payments/student/payment-details`, {
        headers: {
          "x-user-id": studentData._id,
          "x-user-role": "student"
        }
      });
      
      console.log("Payment details response:", response.data);
      setPaymentDetails({
        ...response.data.paymentDetails,
        hostelFeePaid: response.data.paymentDetails.hostelFeePaid || 0,
        messFeePaid: response.data.paymentDetails.messFeePaid || 0
      });
    } catch (error) {
      console.error("Error fetching payment details:", error);
      console.error("Error response:", error.response?.data);
      // Don't set paymentDetails to null on error, keep it as null to show loading
    }
  };

  const fetchInvoices = async () => {
    try {
      if (!studentData) return;

      const response = await axios.get(`http://localhost:5000/api/invoices/student/invoices`, {
        headers: {
          "x-user-id": studentData._id,
          "x-user-role": "student"
        }
      });
      setInvoices(response.data.invoices);
    } catch (error) {
      console.error("Error fetching invoices:", error);
    }
  };

  const handlePayment = async () => {
    if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
      alert("Please enter a valid payment amount");
      return;
    }

    if (parseFloat(paymentAmount) > getMaxAmount()) {
      alert("Payment amount cannot exceed allowed amount for selected fee type");
      return;
    }

    setLoading(true);
    try {
      if (!studentData) {
        alert("Student data not available. Please refresh the page.");
        return;
      }

      const response = await axios.post(`http://localhost:5000/api/payments/student/pay`, {
        amount: parseFloat(paymentAmount),
        paymentMethod,
        transactionId: transactionId || null,
        paymentType
      }, {
        headers: {
          "x-user-id": studentData._id,
          "x-user-role": "student"
        }
      });

      alert("Payment processed successfully!");
      setPaymentAmount("");
      setTransactionId("");
      fetchPaymentDetails();
      fetchInvoices();
    } catch (error) {
      console.error("Error processing payment:", error);
      alert("Payment failed: " + (error.response?.data?.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  const getMaxAmount = () => {
    if (!paymentDetails) return 0;
    switch (paymentType) {
      case "hostel":
        return paymentDetails.hostelFeeAmount - paymentDetails.hostelFeePaid;
      case "mess":
        return paymentDetails.messFeeAmount - paymentDetails.messFeePaid;
      case "total":
      default:
        return paymentDetails.amountDue;
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/");
  };

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: "📊" },
    { id: "profile", label: "Profile", icon: "👤" },
    { id: "room", label: "Room Details", icon: "🏠" },
    { id: "attendance", label: "Attendance", icon: "📋" },
    { id: "fees", label: "Fee Status", icon: "💰" },
    { id: "complaints", label: "Complaints", icon: "📝" }
  ];

  return (
    <div style={styles.container}>
      {/* Sidebar */}
      <div style={styles.sidebar}>
        <div style={styles.logo}>
          <div style={styles.logoIcon}>🎓</div>
          <h3 style={styles.logoText}>HostelHub</h3>
        </div>

        <nav style={styles.nav}>
          {menuItems.map(item => (
            <div
              key={item.id}
              style={{
                ...styles.navItem,
                ...(activeMenu === item.id ? styles.navItemActive : {})
              }}
              onClick={() => setActiveMenu(item.id)}
            >
              <span style={styles.navIcon}>{item.icon}</span>
              <span style={styles.navLabel}>{item.label}</span>
            </div>
          ))}
        </nav>

        <div style={styles.sidebarFooter}>
          <button onClick={handleLogout} style={styles.logoutBtn}>
            🚪 Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={styles.main}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.headerLeft}>
            <h1 style={styles.welcomeText}>
              Welcome back, <span style={styles.userName}>{user?.name}</span>! 👋
            </h1>
            <p style={styles.headerSubtitle}>Here's what's happening with your hostel stay</p>
          </div>
          <div style={styles.headerRight}>
            <div style={styles.userAvatar}>
              <span style={styles.avatarText}>
                {user?.name?.split(' ').map(n => n[0]).join('').toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        {/* Dashboard Content */}
        {activeMenu === "dashboard" && (
          <div style={styles.dashboard}>
            {/* Quick Stats */}
            <div style={styles.statsGrid}>
              <div style={styles.statCard}>
                <div style={styles.statIcon}>🏠</div>
                <div style={styles.statContent}>
                  <h3 style={styles.statTitle}>Room Status</h3>
                  <p style={styles.statValue}>
                    {studentData?.isRoomAssigned
                      ? `Room ${studentData.roomNumber}`
                      : "Not Assigned"
                    }
                  </p>
                  {studentData?.isRoomAssigned && (
                    <p style={styles.statSubtext}>
                      Bed {studentData.bedId} • Floor {studentData.floor} • Block {studentData.block}
                    </p>
                  )}
                </div>
              </div>

              <div style={styles.statCard}>
                <div style={styles.statIcon}>💰</div>
                <div style={styles.statContent}>
                  <h3 style={styles.statTitle}>Fee Status</h3>
                  <p style={{...styles.statValue, color: "#27ae60"}}>Paid ✅</p>
                  <p style={styles.statSubtext}>Next due: March 1, 2026</p>
                </div>
              </div>

              <div style={styles.statCard}>
                <div style={styles.statIcon}>📝</div>
                <div style={styles.statContent}>
                  <h3 style={styles.statTitle}>Complaints</h3>
                  <p style={styles.statValue}>0 Active</p>
                  <p style={styles.statSubtext}>All resolved</p>
                </div>
              </div>

              <div style={styles.statCard}>
                <div style={styles.statIcon}>📅</div>
                <div style={styles.statContent}>
                  <h3 style={styles.statTitle}>Stay Duration</h3>
                  <p style={styles.statValue}>8 Months</p>
                  <p style={styles.statSubtext}>Since July 2025</p>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div style={styles.activitySection}>
              <h2 style={styles.sectionTitle}>Recent Activity</h2>
              <div style={styles.activityList}>
                <div style={styles.activityItem}>
                  <div style={styles.activityIcon}>✅</div>
                  <div style={styles.activityContent}>
                    <p style={styles.activityText}>Room assigned successfully</p>
                    <p style={styles.activityTime}>2 days ago</p>
                  </div>
                </div>
                <div style={styles.activityItem}>
                  <div style={styles.activityIcon}>💰</div>
                  <div style={styles.activityContent}>
                    <p style={styles.activityText}>Monthly fee payment received</p>
                    <p style={styles.activityTime}>1 week ago</p>
                  </div>
                </div>
                <div style={styles.activityItem}>
                  <div style={styles.activityIcon}>📝</div>
                  <div style={styles.activityContent}>
                    <p style={styles.activityText}>Welcome to HostelHub!</p>
                    <p style={styles.activityTime}>2 months ago</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div style={styles.actionsSection}>
              <h2 style={styles.sectionTitle}>Quick Actions</h2>
              <div style={styles.actionsGrid}>
                <button style={styles.actionBtn} onClick={() => setActiveMenu("room")}>
                  <span style={styles.actionIcon}>🏠</span>
                  View Room Details
                </button>
                <button style={styles.actionBtn} onClick={() => setActiveMenu("fees")}>
                  <span style={styles.actionIcon}>💳</span>
                  Pay Fees
                </button>
                <button style={styles.actionBtn} onClick={() => setActiveMenu("complaints")}>
                  <span style={styles.actionIcon}>📝</span>
                  File Complaint
                </button>
                <button style={styles.actionBtn} onClick={() => setActiveMenu("profile")}>
                  <span style={styles.actionIcon}>⚙️</span>
                  Update Profile
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Profile Section */}
        {activeMenu === "profile" && (
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Profile Information</h2>
            <div style={styles.profileCard}>
              <div style={styles.profileHeader}>
                <div style={styles.profileAvatar}>
                  <span style={styles.profileAvatarText}>
                    {user?.name?.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </span>
                </div>
                <div style={styles.profileInfo}>
                  <h3 style={styles.profileName}>{user?.name}</h3>
                  <p style={styles.profileRole}>Student</p>
                </div>
              </div>
              <div style={styles.profileDetails}>
                <div style={styles.detailRow}>
                  <span style={styles.detailLabel}>Email:</span>
                  <span style={styles.detailValue}>{user?.email}</span>
                </div>
                <div style={styles.detailRow}>
                  <span style={styles.detailLabel}>Phone:</span>
                  <span style={styles.detailValue}>{studentData?.phone || "Not provided"}</span>
                </div>
                <div style={styles.detailRow}>
                  <span style={styles.detailLabel}>Course:</span>
                  <span style={styles.detailValue}>{studentData?.course || "Not specified"}</span>
                </div>
                <div style={styles.detailRow}>
                  <span style={styles.detailLabel}>Registration Date:</span>
                  <span style={styles.detailValue}>
                    {studentData?.createdAt ? new Date(studentData.createdAt).toLocaleDateString() : "N/A"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Room Details Section */}
        {activeMenu === "room" && (
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Room Details</h2>
            {studentData?.isRoomAssigned ? (
              <div style={styles.roomCard}>
                <div style={styles.roomHeader}>
                  <div style={styles.roomIcon}>🏠</div>
                  <div>
                    <h3 style={styles.roomTitle}>Room {studentData.roomNumber}</h3>
                    <p style={styles.roomSubtitle}>Your comfortable stay</p>
                  </div>
                </div>
                <div style={styles.roomDetails}>
                  <div style={styles.roomDetail}>
                    <span style={styles.roomLabel}>Bed Number:</span>
                    <span style={styles.roomValue}>{studentData.bedId}</span>
                  </div>
                  <div style={styles.roomDetail}>
                    <span style={styles.roomLabel}>Floor:</span>
                    <span style={styles.roomValue}>{studentData.floor}</span>
                  </div>
                  <div style={styles.roomDetail}>
                    <span style={styles.roomLabel}>Block:</span>
                    <span style={styles.roomValue}>{studentData.block}</span>
                  </div>
                  <div style={styles.roomDetail}>
                    <span style={styles.roomLabel}>Room Type:</span>
                    <span style={styles.roomValue}>{studentData.roomType}</span>
                  </div>
                  <div style={styles.roomDetail}>
                    <span style={styles.roomLabel}>Assigned Date:</span>
                    <span style={styles.roomValue}>
                      {studentData.roomAssignedDate ? new Date(studentData.roomAssignedDate).toLocaleDateString() : "N/A"}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div style={styles.noRoomCard}>
                <div style={styles.noRoomIcon}>🏠</div>
                <h3 style={styles.noRoomTitle}>No Room Assigned</h3>
                <p style={styles.noRoomText}>Your room assignment is pending. Please contact the administration.</p>
              </div>
            )}
          </div>
        )}

        {/* Attendance Section */}
        {activeMenu === "attendance" && (
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>📋 Attendance Record</h2>
            {studentData?.faceRegistered ? (
              <AttendanceCard studentId={studentData._id} studentData={studentData} />
            ) : (
              <div style={styles.noRegistrationCard}>
                <div style={styles.noRegistrationIcon}>📸</div>
                <h3 style={styles.noRegistrationTitle}>Face Registration Required</h3>
                <p style={styles.noRegistrationText}>
                  Please register your face with the admin to enable biometric attendance tracking.
                </p>
                <p style={styles.noRegistrationSubtext}>
                  Contact your hostel administration for face registration.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Fee Status section */}
        {activeMenu === "fees" && (
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Fee Status & Payment</h2>
            
            {!paymentDetails ? (
              <div style={styles.loadingCard}>
                <div style={styles.loadingIcon}>🔄</div>
                <h3 style={styles.loadingTitle}>Loading payment details...</h3>
                <p style={styles.loadingText}>Please wait while we fetch your payment information.</p>
              </div>
            ) : paymentDetails.paymentStatus === "not_assigned" ? (
              <div style={styles.feeCard}>
                <div style={styles.feeStatus}>
                  <div style={styles.feeIcon}>⏳</div>
                  <div>
                    <h3 style={styles.feeTitle}>Payment Details Pending</h3>
                    <p style={styles.feeText}>
                      Admin has not sent your payment details yet. Please check back later.
                    </p>
                  </div>
                </div>
                <div style={styles.pendingMessage}>
                  <p>Your account will be activated once the admin sends your hostel and mess fee details.</p>
                </div>
              </div>
            ) : (
              <div style={styles.feeCard}>
                <div style={styles.feeStatus}>
                  <div style={styles.feeIcon}>
                    {paymentDetails.paymentStatus === "paid" ? "✅" : 
                     paymentDetails.paymentStatus === "partial" ? "🟡" : "❌"}
                  </div>
                  <div>
                    <h3 style={styles.feeTitle}>
                      {paymentDetails.paymentStatus === "paid" ? "All Fees Paid" :
                       paymentDetails.paymentStatus === "partial" ? "Partial Payment" : "Payment Due"}
                    </h3>
                    <p style={styles.feeText}>
                      {paymentDetails.paymentStatus === "paid" ? "Your account is up to date" :
                       `Due date: ${new Date(paymentDetails.paymentDueDate).toLocaleDateString()}`}
                    </p>
                  </div>
                </div>
                
                <div style={styles.feeDetails}>
                  <div style={styles.feeRow}>
                    <span>Hostel Fee</span>
                    <span style={styles.feeAmount}>₹{paymentDetails.hostelFeeAmount}</span>
                  </div>
                  <div style={styles.feeRow}>
                    <span>Hostel Fee Paid</span>
                    <span style={styles.feeAmount}>₹{paymentDetails.hostelFeePaid}</span>
                  </div>
                  <div style={styles.feeRow}>
                    <span>Mess Fee</span>
                    <span style={styles.feeAmount}>₹{paymentDetails.messFeeAmount}</span>
                  </div>
                  <div style={styles.feeRow}>
                    <span>Mess Fee Paid</span>
                    <span style={styles.feeAmount}>₹{paymentDetails.messFeePaid}</span>
                  </div>
                  <div style={styles.feeRow}>
                    <span>Total Amount</span>
                    <span style={styles.feeAmount}>₹{paymentDetails.totalFeeAmount}</span>
                  </div>
                  <div style={styles.feeRow}>
                    <span>Amount Paid</span>
                    <span style={styles.feeAmount}>₹{paymentDetails.amountPaid}</span>
                  </div>
                  <div style={{...styles.feeRow, borderTop: "1px solid #eee", paddingTop: "10px", marginTop: "10px"}}>
                    <span style={{...styles.totalLabel, color: paymentDetails.amountDue > 0 ? "#e74c3c" : "#27ae60"}}>
                      {paymentDetails.amountDue > 0 ? "Amount Due" : "Balance"}
                    </span>
                    <span style={{...styles.feeAmount, ...styles.totalAmount, 
                      color: paymentDetails.amountDue > 0 ? "#e74c3c" : "#27ae60"}}>
                      ₹{Math.abs(paymentDetails.amountDue)}
                    </span>
                  </div>
                </div>

                {paymentDetails.amountDue > 0 && (
                  <div style={styles.paymentSection}>
                    <h4 style={styles.paymentTitle}>Make Payment</h4>
                    <div style={styles.paymentForm}>
                      <div style={styles.inputGroup}>
                        <label style={styles.inputLabel}>Payment Type</label>
                        <div style={styles.radioGroup}>
                          <label style={styles.radioLabel}>
                            <input
                              type="radio"
                              value="total"
                              checked={paymentType === "total"}
                              onChange={(e) => setPaymentType(e.target.value)}
                              style={styles.radioInput}
                            />
                            Total Due
                          </label>
                          <label style={styles.radioLabel}>
                            <input
                              type="radio"
                              value="hostel"
                              checked={paymentType === "hostel"}
                              onChange={(e) => setPaymentType(e.target.value)}
                              style={styles.radioInput}
                            />
                            Hostel Fee
                          </label>
                          <label style={styles.radioLabel}>
                            <input
                              type="radio"
                              value="mess"
                              checked={paymentType === "mess"}
                              onChange={(e) => setPaymentType(e.target.value)}
                              style={styles.radioInput}
                            />
                            Mess Fee
                          </label>
                        </div>
                      </div>
                      
                      <div style={styles.inputGroup}>
                        <label style={styles.inputLabel}>Payment Amount (₹)</label>
                        <input
                          type="number"
                          value={paymentAmount}
                          onChange={(e) => setPaymentAmount(e.target.value)}
                          placeholder={`Max: ₹${getMaxAmount()}`}
                          style={styles.input}
                          max={getMaxAmount()}
                          min="1"
                        />
                      </div>
                      
                      <div style={styles.inputGroup}>
                        <label style={styles.inputLabel}>Payment Method</label>
                        <select
                          value={paymentMethod}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                          style={styles.input}
                        >
                          <option value="online">Online Payment</option>
                          <option value="upi">UPI</option>
                          <option value="bank_transfer">Bank Transfer</option>
                          <option value="cash">Cash</option>
                        </select>
                      </div>

                      <div style={styles.inputGroup}>
                        <label style={styles.inputLabel}>Transaction ID (Optional)</label>
                        <input
                          type="text"
                          value={transactionId}
                          onChange={(e) => setTransactionId(e.target.value)}
                          placeholder="Enter transaction/reference ID"
                          style={styles.input}
                        />
                      </div>

                      <button
                        onClick={handlePayment}
                        disabled={loading}
                        style={{...styles.payButton, ...(loading ? styles.payButtonDisabled : {})}}
                      >
                        {loading ? "Processing..." : "Pay Now"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Invoices Section */}
            <div style={styles.invoicesSection}>
              <h3 style={styles.invoicesTitle}>Payment History & Invoices</h3>
              {invoices.length > 0 ? (
                <div style={styles.invoicesList}>
                  {invoices.map(invoice => (
                    <div key={invoice._id} style={styles.invoiceCard}>
                      <div style={styles.invoiceHeader}>
                        <span style={styles.invoiceNumber}>{invoice.invoiceNumber}</span>
                        <span style={{
                          ...styles.invoiceStatus,
                          backgroundColor: 
                            invoice.invoiceStatus === "paid" ? "#d4edda" :
                            invoice.invoiceStatus === "partially_paid" ? "#fff3cd" : "#f8d7da",
                          color: 
                            invoice.invoiceStatus === "paid" ? "#155724" :
                            invoice.invoiceStatus === "partially_paid" ? "#856404" : "#721c24"
                        }}>
                          {invoice.invoiceStatus.replace("_", " ").toUpperCase()}
                        </span>
                      </div>
                      <div style={styles.invoiceDetails}>
                        <div style={styles.invoiceRow}>
                          <span>Total: ₹{invoice.totalAmount}</span>
                          <span>Paid: ₹{invoice.amountPaid}</span>
                        </div>
                        <div style={styles.invoiceRow}>
                          <span>Date: {new Date(invoice.invoiceDate).toLocaleDateString()}</span>
                          <span>Due: {new Date(invoice.dueDate).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={styles.noInvoices}>No invoices found</p>
              )}
            </div>
          </div>
        )}

        {activeMenu === "complaints" && (
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Complaints & Support</h2>
            <div style={styles.complaintCard}>
              <div style={styles.complaintHeader}>
                <div style={styles.complaintIcon}>📝</div>
                <div>
                  <h3 style={styles.complaintTitle}>File a Complaint</h3>
                  <p style={styles.complaintText}>Report issues with your room or facilities</p>
                </div>
              </div>
              <div style={styles.complaintStats}>
                <div style={styles.complaintStat}>
                  <span style={styles.complaintNumber}>0</span>
                  <span style={styles.complaintLabel}>Active</span>
                </div>
                <div style={styles.complaintStat}>
                  <span style={styles.complaintNumber}>5</span>
                  <span style={styles.complaintLabel}>Resolved</span>
                </div>
                <div style={styles.complaintStat}>
                  <span style={styles.complaintNumber}>98%</span>
                  <span style={styles.complaintLabel}>Satisfaction</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------------- PROFESSIONAL STYLES ---------------- */

const styles = {
  container: {
    display: "flex",
    minHeight: "100vh",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    fontFamily: "'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
  },

  // Sidebar Styles
  sidebar: {
    width: "280px",
    background: "rgba(255, 255, 255, 0.95)",
    backdropFilter: "blur(10px)",
    borderRight: "1px solid rgba(255, 255, 255, 0.2)",
    display: "flex",
    flexDirection: "column",
    boxShadow: "2px 0 20px rgba(0, 0, 0, 0.1)"
  },

  logo: {
    padding: "30px 25px 20px",
    borderBottom: "1px solid rgba(0, 0, 0, 0.1)",
    display: "flex",
    alignItems: "center",
    gap: "15px"
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
    margin: 0,
    background: "linear-gradient(135deg, #667eea, #764ba2)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text"
  },

  nav: {
    flex: 1,
    padding: "20px 0"
  },

  navItem: {
    display: "flex",
    alignItems: "center",
    gap: "15px",
    padding: "15px 25px",
    cursor: "pointer",
    transition: "all 0.3s ease",
    borderLeft: "4px solid transparent",
    marginBottom: "5px",
    "&:hover": {
      background: "rgba(102, 126, 234, 0.1)",
      borderLeft: "4px solid #667eea",
      transform: "translateX(5px)"
    }
  },

  navItemActive: {
    background: "linear-gradient(135deg, rgba(102, 126, 234, 0.2), rgba(118, 75, 162, 0.2))",
    borderLeft: "4px solid #667eea",
    boxShadow: "0 2px 10px rgba(102, 126, 234, 0.2)"
  },

  navIcon: {
    fontSize: "20px",
    width: "24px",
    textAlign: "center"
  },

  navLabel: {
    fontSize: "16px",
    fontWeight: "500",
    color: "#2c3e50"
  },

  sidebarFooter: {
    padding: "20px 25px",
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
    boxShadow: "0 4px 15px rgba(231, 76, 60, 0.3)",
    "&:hover": {
      transform: "translateY(-2px)",
      boxShadow: "0 6px 20px rgba(231, 76, 60, 0.4)"
    }
  },

  // Main Content Styles
  main: {
    flex: 1,
    padding: "30px",
    overflowY: "auto"
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "40px",
    padding: "30px",
    background: "rgba(255, 255, 255, 0.95)",
    backdropFilter: "blur(10px)",
    borderRadius: "20px",
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)"
  },

  headerLeft: {
    flex: 1
  },

  welcomeText: {
    fontSize: "32px",
    fontWeight: "700",
    color: "#2c3e50",
    margin: "0 0 8px 0",
    background: "linear-gradient(135deg, #667eea, #764ba2)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text"
  },

  userName: {
    color: "#667eea"
  },

  headerSubtitle: {
    fontSize: "16px",
    color: "#7f8c8d",
    margin: 0
  },

  headerRight: {
    display: "flex",
    alignItems: "center",
    gap: "20px"
  },

  userAvatar: {
    width: "60px",
    height: "60px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #667eea, #764ba2)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 8px 25px rgba(102, 126, 234, 0.3)",
    border: "3px solid rgba(255, 255, 255, 0.8)"
  },

  avatarText: {
    color: "white",
    fontSize: "20px",
    fontWeight: "700"
  },

  // Dashboard Styles
  dashboard: {
    display: "flex",
    flexDirection: "column",
    gap: "30px"
  },

  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "25px"
  },

  statsGridSmall: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "15px"
  },

  statCard: {
    background: "rgba(255, 255, 255, 0.95)",
    backdropFilter: "blur(10px)",
    padding: "25px",
    borderRadius: "20px",
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
    display: "flex",
    alignItems: "center",
    gap: "20px",
    transition: "all 0.3s ease",
    border: "1px solid rgba(255, 255, 255, 0.2)",
    cursor: "pointer"
  },

  statIcon: {
    fontSize: "40px",
    width: "70px",
    height: "70px",
    borderRadius: "15px",
    background: "linear-gradient(135deg, #667eea, #764ba2)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 4px 15px rgba(102, 126, 234, 0.3)"
  },

  statContent: {
    flex: 1
  },

  statTitle: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#2c3e50",
    margin: "0 0 8px 0"
  },

  statValue: {
    fontSize: "24px",
    fontWeight: "700",
    color: "#667eea",
    margin: "0 0 5px 0"
  },

  statSubtext: {
    fontSize: "14px",
    color: "#7f8c8d",
    margin: 0
  },

  // Activity Section
  activitySection: {
    background: "rgba(255, 255, 255, 0.95)",
    backdropFilter: "blur(10px)",
    padding: "30px",
    borderRadius: "20px",
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)"
  },

  sectionTitle: {
    fontSize: "24px",
    fontWeight: "700",
    color: "#2c3e50",
    margin: "0 0 25px 0"
  },

  activityList: {
    display: "flex",
    flexDirection: "column",
    gap: "15px"
  },

  activityItem: {
    display: "flex",
    alignItems: "center",
    gap: "15px",
    padding: "15px",
    background: "rgba(102, 126, 234, 0.05)",
    borderRadius: "12px",
    border: "1px solid rgba(102, 126, 234, 0.1)"
  },

  activityIcon: {
    fontSize: "20px",
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #667eea, #764ba2)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "white"
  },

  activityContent: {
    flex: 1
  },

  activityText: {
    fontSize: "16px",
    fontWeight: "500",
    color: "#2c3e50",
    margin: "0 0 5px 0"
  },

  activityTime: {
    fontSize: "14px",
    color: "#7f8c8d",
    margin: 0
  },

  // Actions Section
  actionsSection: {
    background: "rgba(255, 255, 255, 0.95)",
    backdropFilter: "blur(10px)",
    padding: "30px",
    borderRadius: "20px",
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)"
  },

  actionsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "20px"
  },

  actionBtn: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "20px",
    background: "linear-gradient(135deg, #667eea, #764ba2)",
    color: "white",
    border: "none",
    borderRadius: "15px",
    fontSize: "16px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.3s ease",
    boxShadow: "0 4px 15px rgba(102, 126, 234, 0.3)",
    "&:hover": {
      transform: "translateY(-3px)",
      boxShadow: "0 8px 25px rgba(102, 126, 234, 0.4)"
    }
  },

  actionIcon: {
    fontSize: "20px"
  },

  // Section Styles
  section: {
    background: "rgba(255, 255, 255, 0.95)",
    backdropFilter: "blur(10px)",
    padding: "30px",
    borderRadius: "20px",
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)"
  },

  // Profile Styles
  profileCard: {
    background: "linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1))",
    borderRadius: "20px",
    padding: "30px",
    border: "1px solid rgba(102, 126, 234, 0.2)"
  },

  profileHeader: {
    display: "flex",
    alignItems: "center",
    gap: "20px",
    marginBottom: "30px"
  },

  profileAvatar: {
    width: "80px",
    height: "80px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #667eea, #764ba2)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 8px 25px rgba(102, 126, 234, 0.3)"
  },

  profileAvatarText: {
    color: "white",
    fontSize: "28px",
    fontWeight: "700"
  },

  profileInfo: {
    flex: 1
  },

  profileName: {
    fontSize: "28px",
    fontWeight: "700",
    color: "#2c3e50",
    margin: "0 0 5px 0"
  },

  profileRole: {
    fontSize: "16px",
    color: "#7f8c8d",
    margin: 0
  },

  profileDetails: {
    display: "grid",
    gap: "15px"
  },

  detailRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "15px 0",
    borderBottom: "1px solid rgba(0, 0, 0, 0.1)"
  },

  detailLabel: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#2c3e50"
  },

  detailValue: {
    fontSize: "16px",
    color: "#667eea",
    fontWeight: "500"
  },

  // Room Styles
  roomCard: {
    background: "linear-gradient(135deg, rgba(39, 174, 96, 0.1), rgba(34, 197, 94, 0.1))",
    borderRadius: "20px",
    padding: "30px",
    border: "1px solid rgba(39, 174, 96, 0.2)"
  },

  roomHeader: {
    display: "flex",
    alignItems: "center",
    gap: "20px",
    marginBottom: "30px"
  },

  roomIcon: {
    fontSize: "50px",
    width: "80px",
    height: "80px",
    borderRadius: "20px",
    background: "linear-gradient(135deg, #27ae60, #2ecc71)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 8px 25px rgba(39, 174, 96, 0.3)"
  },

  roomTitle: {
    fontSize: "28px",
    fontWeight: "700",
    color: "#2c3e50",
    margin: "0 0 5px 0"
  },

  roomSubtitle: {
    fontSize: "16px",
    color: "#7f8c8d",
    margin: 0
  },

  roomDetails: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "20px"
  },

  roomDetail: {
    background: "rgba(255, 255, 255, 0.8)",
    padding: "20px",
    borderRadius: "15px",
    border: "1px solid rgba(39, 174, 96, 0.2)"
  },

  roomLabel: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#7f8c8d",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    marginBottom: "8px",
    display: "block"
  },

  roomValue: {
    fontSize: "18px",
    fontWeight: "700",
    color: "#27ae60"
  },

  noRoomCard: {
    textAlign: "center",
    padding: "50px 30px",
    background: "linear-gradient(135deg, rgba(231, 76, 60, 0.1), rgba(192, 57, 43, 0.1))",
    borderRadius: "20px",
    border: "1px solid rgba(231, 76, 60, 0.2)"
  },

  noRoomIcon: {
    fontSize: "60px",
    marginBottom: "20px"
  },

  noRoomTitle: {
    fontSize: "24px",
    fontWeight: "700",
    color: "#2c3e50",
    margin: "0 0 10px 0"
  },

  noRoomText: {
    fontSize: "16px",
    color: "#7f8c8d",
    margin: 0
  },

  // Attendance Styles
  noRegistrationCard: {
    textAlign: "center",
    padding: "50px 30px",
    background: "linear-gradient(135deg, rgba(241, 196, 15, 0.1), rgba(230, 126, 34, 0.1))",
    borderRadius: "20px",
    border: "1px solid rgba(241, 196, 15, 0.2)"
  },

  noRegistrationIcon: {
    fontSize: "60px",
    marginBottom: "20px"
  },

  noRegistrationTitle: {
    fontSize: "24px",
    fontWeight: "700",
    color: "#2c3e50",
    margin: "0 0 10px 0"
  },

  noRegistrationText: {
    fontSize: "16px",
    color: "#7f8c8d",
    margin: "0 0 5px 0"
  },

  noRegistrationSubtext: {
    fontSize: "14px",
    color: "#95a5a6",
    margin: 0
  },

  attendanceContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "25px"
  },

  statsGridSmall: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "15px"
  },

  statCard2: {
    background: "linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1))",
    padding: "20px",
    borderRadius: "15px",
    border: "1px solid rgba(102, 126, 234, 0.2)",
    display: "flex",
    alignItems: "center",
    gap: "15px"
  },

  statIcon2: {
    fontSize: "32px"
  },

  statLabel2: {
    fontSize: "13px",
    color: "#7f8c8d",
    margin: "0 0 3px 0",
    fontWeight: "500"
  },

  statNumber2: {
    fontSize: "24px",
    fontWeight: "700",
    color: "#2c3e50",
    margin: 0
  },

  attendanceListContainer: {
    background: "rgba(255, 255, 255, 0.95)",
    backdropFilter: "blur(10px)",
    borderRadius: "20px",
    padding: "25px",
    border: "1px solid rgba(255, 255, 255, 0.2)",
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)"
  },

  listTitle: {
    fontSize: "18px",
    fontWeight: "700",
    color: "#2c3e50",
    margin: "0 0 20px 0"
  },

  loadingState: {
    textAlign: "center",
    padding: "40px 20px",
    color: "#7f8c8d",
    fontSize: "16px"
  },

  emptyState2: {
    textAlign: "center",
    padding: "40px 20px",
    color: "#7f8c8d",
    fontSize: "16px"
  },

  attendanceTable: {
    display: "flex",
    flexDirection: "column",
    gap: "10px"
  },

  attendanceRow: {
    display: "grid",
    gridTemplateColumns: "150px 120px 1fr",
    gap: "20px",
    padding: "15px",
    background: "linear-gradient(135deg, rgba(102, 126, 234, 0.05), rgba(118, 75, 162, 0.05))",
    borderRadius: "12px",
    border: "1px solid rgba(102, 126, 234, 0.1)",
    alignItems: "center"
  },

  dateColumn: {
    display: "flex",
    flexDirection: "column"
  },

  dateText: {
    fontSize: "14px",
    fontWeight: "700",
    color: "#2c3e50",
    margin: "0 0 3px 0"
  },

  timeText: {
    fontSize: "12px",
    color: "#7f8c8d",
    margin: 0
  },

  statusColumn: {
    display: "flex",
    justifyContent: "center"
  },

  statusBadge: {
    padding: "8px 12px",
    borderRadius: "8px",
    fontSize: "13px",
    fontWeight: "600"
  },

  statusPresent: {
    background: "rgba(39, 174, 96, 0.2)",
    color: "#27ae60"
  },

  statusAbsent: {
    background: "rgba(231, 76, 60, 0.2)",
    color: "#e74c3c"
  },

  methodColumn: {
    textAlign: "right"
  },

  methodText: {
    fontSize: "12px",
    color: "#667eea",
    fontWeight: "600",
    margin: 0
  },

  // Enhanced Attendance Styles
  todayStatus: {
    marginBottom: "30px",
    padding: "20px",
    background: "linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(248, 250, 252, 0.95))",
    borderRadius: "15px",
    border: "1px solid rgba(102, 126, 234, 0.1)",
  },

  todayTitle: {
    fontSize: "18px",
    fontWeight: "700",
    color: "#2c3e50",
    margin: "0 0 20px 0",
  },

  noAttendance: {
    textAlign: "center",
    padding: "30px",
    color: "#7f8c8d",
  },

  noAttendanceIcon: {
    fontSize: "48px",
    marginBottom: "10px",
  },

  todayCard: {
    background: "rgba(255, 255, 255, 0.9)",
    borderRadius: "12px",
    padding: "20px",
    border: "1px solid rgba(102, 126, 234, 0.2)",
  },

  todayHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "15px",
  },

  todayStatusBadge: {
    padding: "8px 16px",
    borderRadius: "20px",
    fontSize: "14px",
    fontWeight: "600",
  },

  todayDate: {
    fontSize: "14px",
    color: "#7f8c8d",
    fontWeight: "500",
  },

  todayDetails: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
    gap: "15px",
  },

  timeDetail: {
    display: "flex",
    flexDirection: "column",
    gap: "5px",
  },

  timeLabel: {
    fontSize: "12px",
    color: "#7f8c8d",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },

  timeValue: {
    fontSize: "16px",
    fontWeight: "700",
    color: "#2c3e50",
  },

  detailsColumn: {
    display: "flex",
    flexDirection: "column",
    gap: "5px",
  },

  recordDetails: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },

  recordTimes: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
  },

  checkInTime: {
    fontSize: "12px",
    color: "#27ae60",
    fontWeight: "600",
    background: "rgba(39, 174, 96, 0.1)",
    padding: "4px 8px",
    borderRadius: "6px",
  },

  checkOutTime: {
    fontSize: "12px",
    color: "#e74c3c",
    fontWeight: "600",
    background: "rgba(231, 76, 60, 0.1)",
    padding: "4px 8px",
    borderRadius: "6px",
  },

  recordDuration: {
    fontSize: "11px",
    color: "#667eea",
    fontWeight: "600",
    background: "rgba(102, 126, 234, 0.1)",
    padding: "4px 8px",
    borderRadius: "6px",
    alignSelf: "flex-start",
  },

  // Fee Styles
  feeCard: {
    background: "linear-gradient(135deg, rgba(39, 174, 96, 0.1), rgba(34, 197, 94, 0.1))",
    borderRadius: "20px",
    padding: "30px",
    border: "1px solid rgba(39, 174, 96, 0.2)"
  },

  feeStatus: {
    display: "flex",
    alignItems: "center",
    gap: "20px",
    marginBottom: "30px",
    padding: "20px",
    background: "rgba(255, 255, 255, 0.8)",
    borderRadius: "15px"
  },

  feeIcon: {
    fontSize: "40px",
    width: "70px",
    height: "70px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #27ae60, #2ecc71)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "white"
  },

  feeTitle: {
    fontSize: "20px",
    fontWeight: "700",
    color: "#2c3e50",
    margin: "0 0 5px 0"
  },

  feeText: {
    fontSize: "14px",
    color: "#7f8c8d",
    margin: 0
  },

  feeDetails: {
    background: "rgba(255, 255, 255, 0.8)",
    borderRadius: "15px",
    padding: "20px"
  },

  feeRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "10px 0",
    fontSize: "16px",
    color: "#2c3e50"
  },

  feeAmount: {
    fontWeight: "600",
    color: "#27ae60"
  },

  totalLabel: {
    fontWeight: "700",
    fontSize: "18px"
  },

  totalAmount: {
    fontSize: "20px",
    color: "#27ae60"
  },

  // Complaint Styles
  complaintCard: {
    background: "linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1))",
    borderRadius: "20px",
    padding: "30px",
    border: "1px solid rgba(102, 126, 234, 0.2)"
  },

  complaintHeader: {
    display: "flex",
    alignItems: "center",
    gap: "20px",
    marginBottom: "30px"
  },

  complaintIcon: {
    fontSize: "50px",
    width: "80px",
    height: "80px",
    borderRadius: "20px",
    background: "linear-gradient(135deg, #667eea, #764ba2)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 8px 25px rgba(102, 126, 234, 0.3)"
  },

  complaintTitle: {
    fontSize: "24px",
    fontWeight: "700",
    color: "#2c3e50",
    margin: "0 0 5px 0"
  },

  complaintText: {
    fontSize: "16px",
    color: "#7f8c8d",
    margin: 0
  },

  complaintStats: {
    display: "flex",
    gap: "30px",
    justifyContent: "center"
  },

  complaintStat: {
    textAlign: "center",
    padding: "20px",
    background: "rgba(255, 255, 255, 0.8)",
    borderRadius: "15px",
    minWidth: "80px"
  },

  complaintNumber: {
    fontSize: "24px",
    fontWeight: "700",
    color: "#667eea",
    display: "block"
  },

  complaintLabel: {
    fontSize: "14px",
    color: "#7f8c8d",
    fontWeight: "500"
  },

  // Payment and Invoice Styles
  paymentSection: {
    marginTop: "20px",
    padding: "20px",
    background: "rgba(255, 255, 255, 0.9)",
    borderRadius: "12px",
    border: "1px solid rgba(102, 126, 234, 0.2)"
  },

  paymentTitle: {
    fontSize: "18px",
    fontWeight: "700",
    color: "#2c3e50",
    margin: "0 0 15px 0"
  },

  paymentForm: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: "15px",
    alignItems: "end"
  },

  inputGroup: {
    display: "flex",
    flexDirection: "column"
  },

  inputLabel: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#2c3e50",
    marginBottom: "5px"
  },

  input: {
    padding: "10px 12px",
    border: "1px solid #ddd",
    borderRadius: "8px",
    fontSize: "14px",
    background: "white",
    transition: "border-color 0.3s ease"
  },

  radioGroup: {
    display: "flex",
    gap: "15px",
    flexWrap: "wrap"
  },

  radioLabel: {
    display: "flex",
    alignItems: "center",
    gap: "5px",
    fontSize: "14px",
    color: "#2c3e50",
    cursor: "pointer"
  },

  radioInput: {
    margin: 0
  },

  payButton: {
    padding: "12px 24px",
    background: "linear-gradient(135deg, #667eea, #764ba2)",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontSize: "16px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "transform 0.2s ease, box-shadow 0.2s ease",
    gridColumn: "span 3"
  },

  payButtonDisabled: {
    opacity: 0.6,
    cursor: "not-allowed",
    transform: "none"
  },

  invoicesSection: {
    marginTop: "30px"
  },

  invoicesTitle: {
    fontSize: "18px",
    fontWeight: "700",
    color: "#2c3e50",
    margin: "0 0 15px 0"
  },

  invoicesList: {
    display: "grid",
    gap: "10px"
  },

  invoiceCard: {
    padding: "15px",
    background: "rgba(255, 255, 255, 0.9)",
    borderRadius: "8px",
    border: "1px solid rgba(102, 126, 234, 0.1)"
  },

  invoiceHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "10px"
  },

  invoiceNumber: {
    fontSize: "16px",
    fontWeight: "700",
    color: "#2c3e50"
  },

  invoiceStatus: {
    padding: "4px 8px",
    borderRadius: "12px",
    fontSize: "12px",
    fontWeight: "600",
    textTransform: "uppercase"
  },

  invoiceDetails: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "14px",
    color: "#7f8c8d"
  },

  invoiceRow: {
    display: "flex",
    gap: "15px"
  },

  noInvoices: {
    textAlign: "center",
    padding: "30px",
    color: "#7f8c8d",
    fontStyle: "italic"
  },

  pendingMessage: {
    textAlign: "center",
    padding: "20px",
    background: "#f8f9fa",
    borderRadius: "8px",
    marginTop: "20px",
    color: "#6c757d",
    fontSize: "14px"
  },

  loadingCard: {
    textAlign: "center",
    padding: "40px",
    background: "rgba(255, 255, 255, 0.9)",
    borderRadius: "12px",
    border: "1px solid rgba(102, 126, 234, 0.2)"
  },

  loadingIcon: {
    fontSize: "48px",
    marginBottom: "10px"
  },

  loadingTitle: {
    fontSize: "18px",
    fontWeight: "700",
    color: "#2c3e50",
    margin: "0 0 10px 0"
  },

  loadingText: {
    fontSize: "14px",
    color: "#7f8c8d",
    margin: 0
  }
};

/* ---------------- LEGACY STYLES (REMOVE) ---------------- */

const layoutStyle = {
  display: "flex",
  minHeight: "100vh",
  fontFamily: "Arial, sans-serif",
  background: "#f4f6f9"
};

const sidebarStyle = {
  width: "220px",
  background: "linear-gradient(180deg, #2c3e50, #34495e)",
  padding: "20px"
};

const menuStyle = {
  listStyle: "none",
  padding: 0,
  marginTop: "30px",
  color: "white",
  lineHeight: "40px",
  cursor: "pointer"
};

const mainStyle = {
  flex: 1,
  padding: "30px"
};

const headerStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "30px"
};

const logoutStyle = {
  padding: "8px 15px",
  backgroundColor: "#e74c3c",
  color: "white",
  border: "none",
  borderRadius: "5px",
  cursor: "pointer"
};

const cardStyle = {
  background: "white",
  padding: "20px",
  borderRadius: "10px",
  boxShadow: "0 5px 15px rgba(0,0,0,0.1)",
  marginBottom: "30px"
};

const statsContainer = {
  display: "flex",
  gap: "20px"
};

const statCard = {
  flex: 1,
  background: "white",
  padding: "20px",
  borderRadius: "10px",
  boxShadow: "0 5px 15px rgba(0,0,0,0.1)",
  textAlign: "center"
};

// AttendanceCard component
function AttendanceCard({ studentId, studentData }) {
  const [attendance, setAttendance] = useState([]);
  const [stats, setStats] = useState({ total: 0, present: 0, absent: 0, percentage: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAttendance();
  }, [studentId]);

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const today = new Date();
      const year = today.getFullYear();
      const month = today.getMonth() + 1;

      const response = await axios.get(
        `http://localhost:5000/api/attendance/student/${studentId}?month=${month}&year=${year}`
      );

      setAttendance(response.data.attendance || []);
      setStats(response.data.stats || { total: 0, present: 0, absent: 0 });

      const percentage = response.data.stats?.total > 0
        ? Math.round((response.data.stats.present / response.data.stats.total) * 100)
        : 0;
      setStats(prev => ({ ...prev, percentage }));
    } catch (error) {
      console.error("Error fetching attendance:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const formatDuration = (minutes) => {
    if (!minutes) return "N/A";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  return (
    <div style={styles.attendanceContainer}>
      {/* Stats Cards */}
      <div style={styles.statsGridSmall}>
        <div style={styles.statCard2}>
          <div style={styles.statIcon2}>✅</div>
          <div>
            <p style={styles.statLabel2}>Present</p>
            <p style={{ ...styles.statNumber2, color: "#27ae60" }}>{stats.present}</p>
          </div>
        </div>

        <div style={styles.statCard2}>
          <div style={styles.statIcon2}>❌</div>
          <div>
            <p style={styles.statLabel2}>Absent</p>
            <p style={{ ...styles.statNumber2, color: "#e74c3c" }}>{stats.absent}</p>
          </div>
        </div>

        <div style={styles.statCard2}>
          <div style={styles.statIcon2}>📅</div>
          <div>
            <p style={styles.statLabel2}>Total</p>
            <p style={{ ...styles.statNumber2, color: "#3498db" }}>{stats.total}</p>
          </div>
        </div>

        <div style={styles.statCard2}>
          <div style={styles.statIcon2}>📈</div>
          <div>
            <p style={styles.statLabel2}>Attendance %</p>
            <p style={{ ...styles.statNumber2, color: "#667eea" }}>{stats.percentage}%</p>
          </div>
        </div>
      </div>

      {/* Today's Status */}
      <div style={styles.todayStatus}>
        <h3 style={styles.todayTitle}>📅 Today's Attendance</h3>
        {(() => {
          const today = new Date().toISOString().split('T')[0];
          const todayRecord = attendance.find(record =>
            new Date(record.date).toISOString().split('T')[0] === today
          );

          if (!todayRecord) {
            return (
              <div style={styles.noAttendance}>
                <div style={styles.noAttendanceIcon}>⏰</div>
                <p>No attendance recorded yet today</p>
              </div>
            );
          }

          return (
            <div style={styles.todayCard}>
              <div style={styles.todayHeader}>
                <span style={{
                  ...styles.todayStatusBadge,
                  ...(todayRecord.status === "Present" ? styles.statusPresent : styles.statusAbsent)
                }}>
                  {todayRecord.status === "Present" ? "✅ Present" : "❌ Absent"}
                </span>
                <span style={styles.todayDate}>
                  {new Date(todayRecord.date).toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric"
                  })}
                </span>
              </div>

              {todayRecord.status === "Present" && (
                <div style={styles.todayDetails}>
                  <div style={styles.timeDetail}>
                    <span style={styles.timeLabel}>Check-in:</span>
                    <span style={styles.timeValue}>
                      {formatTime(todayRecord.checkInTime)}
                    </span>
                  </div>
                  <div style={styles.timeDetail}>
                    <span style={styles.timeLabel}>Check-out:</span>
                    <span style={styles.timeValue}>
                      {formatTime(todayRecord.checkOutTime)}
                    </span>
                  </div>
                  <div style={styles.timeDetail}>
                    <span style={styles.timeLabel}>Duration:</span>
                    <span style={styles.timeValue}>
                      {formatDuration(todayRecord.duration)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })()}
      </div>

      {/* Attendance List */}
      <div style={styles.attendanceListContainer}>
        <h3 style={styles.listTitle}>Current Month Attendance</h3>
        {loading ? (
          <div style={styles.loadingState}>Loading attendance...</div>
        ) : attendance.length === 0 ? (
          <div style={styles.emptyState2}>
            <p>No attendance records yet for this month</p>
          </div>
        ) : (
          <div style={styles.attendanceTable}>
            {attendance.map((record) => (
              <div key={record._id} style={styles.attendanceRow}>
                <div style={styles.dateColumn}>
                  <p style={styles.dateText}>
                    {new Date(record.date).toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric"
                    })}
                  </p>
                  <p style={styles.timeText}>
                    {record.status === "Present" ? formatTime(record.checkInTime) : "N/A"}
                  </p>
                </div>
                <div style={styles.statusColumn}>
                  <span
                    style={{
                      ...styles.statusBadge,
                      ...(record.status === "Present"
                        ? styles.statusPresent
                        : styles.statusAbsent),
                    }}
                  >
                    {record.status === "Present" ? "✅ Present" : "❌ Absent"}
                  </span>
                </div>
                <div style={styles.detailsColumn}>
                  {record.status === "Present" ? (
                    <div style={styles.recordDetails}>
                      <div style={styles.recordTimes}>
                        <span style={styles.checkInTime}>
                          In: {formatTime(record.checkInTime)}
                        </span>
                        {record.checkOutTime && (
                          <span style={styles.checkOutTime}>
                            Out: {formatTime(record.checkOutTime)}
                          </span>
                        )}
                      </div>
                      {record.duration && (
                        <div style={styles.recordDuration}>
                          Duration: {formatDuration(record.duration)}
                        </div>
                      )}
                    </div>
                  ) : (
                    <p style={styles.methodText}>Manual/Auto</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default StudentPanel;

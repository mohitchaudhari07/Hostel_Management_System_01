import { useEffect, useState } from "react";
import axios from "axios";

function StudentManagement() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPaymentStatus, setFilterPaymentStatus] = useState("all");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [paymentForm, setPaymentForm] = useState({
    hostelFeeAmount: "",
    messFeeAmount: "",
    paymentDueDate: ""
  });

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await axios.get("http://localhost:5000/api/auth/students");
      setStudents(response.data);
    } catch (error) {
      console.error("Error fetching students:", error);
      setError("Failed to load students");
    } finally {
      setLoading(false);
    }
  };

  const handleSendPaymentDetails = (student) => {
    setSelectedStudent(student);
    setPaymentForm({
      hostelFeeAmount: "",
      messFeeAmount: "",
      paymentDueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 30 days from now
    });
    setShowPaymentModal(true);
  };

  const handleSubmitPaymentDetails = async () => {
    if (!paymentForm.hostelFeeAmount || !paymentForm.messFeeAmount || !paymentForm.paymentDueDate) {
      alert("Please fill in all required fields");
      return;
    }

    try {
      const user = JSON.parse(localStorage.getItem("user"));
      if (!user) {
        alert("Authentication required. Please login again.");
        return;
      }

      await axios.post(
        `http://localhost:5000/api/payments/student/${selectedStudent._id}/send-payment-details`,
        {
          hostelFeeAmount: parseFloat(paymentForm.hostelFeeAmount),
          messFeeAmount: parseFloat(paymentForm.messFeeAmount),
          paymentDueDate: paymentForm.paymentDueDate
        },
        {
          headers: {
            "x-user-id": user.id,
            "x-user-role": user.role
          }
        }
      );

      alert("Payment details sent successfully!");
      setShowPaymentModal(false);
      setSelectedStudent(null);
      fetchStudents();
    } catch (error) {
      alert("Error sending payment details: " + (error.response?.data?.message || "Unknown error"));
    }
  };

  const handleUnassignRoom = async (studentId) => {
    if (!confirm("Are you sure you want to unassign this student's room?")) return;

    try {
      await axios.post("http://localhost:5000/api/rooms/unassign", {
        studentId
      });
      alert("Room unassigned successfully!");
      fetchStudents();
    } catch (error) {
      alert("Error unassigning room: " + (error.response?.data?.message || "Unknown error"));
    }
  };

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (student.roomNumber && student.roomNumber.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesRoomFilter = filterStatus === "all" ||
                             (filterStatus === "assigned" && student.isRoomAssigned) ||
                             (filterStatus === "unassigned" && !student.isRoomAssigned);

    const matchesPaymentFilter = filterPaymentStatus === "all" ||
                                student.paymentStatus === filterPaymentStatus;

    return matchesSearch && matchesRoomFilter && matchesPaymentFilter;
  });

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p>Loading students...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.errorContainer}>
        <div style={styles.errorIcon}>⚠️</div>
        <h3>Failed to Load Students</h3>
        <p>{error}</p>
        <button style={styles.retryBtn} onClick={fetchStudents}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Controls */}
      <div style={styles.controls}>
        <div style={styles.searchBox}>
          <input
            type="text"
            placeholder="Search by name, email, or room..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />
          <span style={styles.searchIcon}>🔍</span>
        </div>

        <div style={styles.filterBox}>
          <label style={styles.filterLabel}>Room Status:</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={styles.filterSelect}
          >
            <option value="all">All Students</option>
            <option value="assigned">Room Assigned</option>
            <option value="unassigned">No Room</option>
          </select>
        </div>

        <div style={styles.filterBox}>
          <label style={styles.filterLabel}>Payment Status:</label>
          <select
            value={filterPaymentStatus}
            onChange={(e) => setFilterPaymentStatus(e.target.value)}
            style={styles.filterSelect}
          >
            <option value="all">All Payments</option>
            <option value="not_assigned">Not Assigned</option>
            <option value="pending">Pending</option>
            <option value="partial">Partial</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>
      </div>

      {/* Statistics */}
      <div style={styles.stats}>
        <div style={styles.statCard}>
          <h3>{students.length}</h3>
          <p>Total Students</p>
        </div>
        <div style={styles.statCard}>
          <h3>{students.filter(s => s.isRoomAssigned).length}</h3>
          <p>Room Assigned</p>
        </div>
        <div style={styles.statCard}>
          <h3>{students.filter(s => !s.isRoomAssigned).length}</h3>
          <p>Waiting for Room</p>
        </div>
        <div style={styles.statCard}>
          <h3>{students.filter(s => s.paymentStatus === "not_assigned").length}</h3>
          <p>Payment Not Sent</p>
        </div>
        <div style={styles.statCard}>
          <h3>{students.filter(s => s.paymentStatus === "paid").length}</h3>
          <p>Payment Complete</p>
        </div>
        <div style={styles.statCard}>
          <h3>{students.filter(s => s.paymentStatus === "pending" || s.paymentStatus === "partial" || s.paymentStatus === "overdue").length}</h3>
          <p>Payment Pending</p>
        </div>
      </div>

      {/* Students List */}
      <div style={styles.studentsGrid}>
        {filteredStudents.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>👥</div>
            <h3>No students found</h3>
            <p>Try adjusting your search or filter criteria</p>
          </div>
        ) : (
          filteredStudents.map(student => (
            <div key={student._id} style={styles.studentCard}>
              <div style={styles.studentHeader}>
                <div style={styles.studentAvatar}>
                  <span style={styles.avatarText}>
                    {student.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </span>
                </div>
                <div style={styles.studentInfo}>
                  <h3 style={styles.studentName}>{student.name}</h3>
                  <p style={styles.studentEmail}>{student.email}</p>
                </div>
                <div style={styles.roomStatus}>
                  {student.isRoomAssigned ? (
                    <span style={styles.assignedBadge}>🏠 Room {student.roomNumber}</span>
                  ) : (
                    <span style={styles.unassignedBadge}>⏳ No Room</span>
                  )}
                </div>
                <div style={styles.paymentStatus}>
                  {student.paymentStatus === "paid" ? (
                    <span style={styles.paymentBadgePaid}>💰 Paid</span>
                  ) : student.paymentStatus === "partial" ? (
                    <span style={styles.paymentBadgePartial}>💰 Partial</span>
                  ) : student.paymentStatus === "pending" ? (
                    <span style={styles.paymentBadgePending}>💰 Pending</span>
                  ) : student.paymentStatus === "overdue" ? (
                    <span style={styles.paymentBadgeOverdue}>💰 Overdue</span>
                  ) : (
                    <span style={styles.paymentBadgeNotAssigned}>📝 Not Sent</span>
                  )}
                </div>
              </div>

              <div style={styles.studentDetails}>
                <div style={styles.detailRow}>
                  <span style={styles.detailLabel}>Phone:</span>
                  <span style={styles.detailValue}>{student.phone || "Not provided"}</span>
                </div>
                <div style={styles.detailRow}>
                  <span style={styles.detailLabel}>Course:</span>
                  <span style={styles.detailValue}>{student.course || "Not specified"}</span>
                </div>
                {student.isRoomAssigned && (
                  <>
                    <div style={styles.detailRow}>
                      <span style={styles.detailLabel}>Bed:</span>
                      <span style={styles.detailValue}>{student.bedId}</span>
                    </div>
                    <div style={styles.detailRow}>
                      <span style={styles.detailLabel}>Floor/Block:</span>
                      <span style={styles.detailValue}>Floor {student.floor}, Block {student.block}</span>
                    </div>
                    <div style={styles.detailRow}>
                      <span style={styles.detailLabel}>Assigned:</span>
                      <span style={styles.detailValue}>
                        {student.roomAssignedDate ? new Date(student.roomAssignedDate).toLocaleDateString() : "N/A"}
                      </span>
                    </div>
                  </>
                )}
                <div style={styles.detailRow}>
                  <span style={styles.detailLabel}>Registered:</span>
                  <span style={styles.detailValue}>
                    {student.createdAt ? new Date(student.createdAt).toLocaleDateString() : "N/A"}
                  </span>
                </div>
                {student.paymentStatus !== "not_assigned" && (
                  <>
                    <div style={styles.detailRow}>
                      <span style={styles.detailLabel}>Hostel Fee:</span>
                      <span style={styles.detailValue}>₹{student.hostelFeeAmount}</span>
                    </div>
                    <div style={styles.detailRow}>
                      <span style={styles.detailLabel}>Mess Fee:</span>
                      <span style={styles.detailValue}>₹{student.messFeeAmount}</span>
                    </div>
                    <div style={styles.detailRow}>
                      <span style={styles.detailLabel}>Total Due:</span>
                      <span style={styles.detailValue}>₹{student.amountDue}</span>
                    </div>
                    <div style={styles.detailRow}>
                      <span style={styles.detailLabel}>Due Date:</span>
                      <span style={styles.detailValue}>
                        {student.paymentDueDate ? new Date(student.paymentDueDate).toLocaleDateString() : "N/A"}
                      </span>
                    </div>
                  </>
                )}
              </div>

              <div style={styles.cardActions}>
                {student.paymentStatus === "not_assigned" && (
                  <button
                    style={styles.sendPaymentBtn}
                    onClick={() => handleSendPaymentDetails(student)}
                  >
                    💰 Send Payment Details
                  </button>
                )}
                {student.isRoomAssigned && (
                  <button
                    style={styles.unassignBtn}
                    onClick={() => handleUnassignRoom(student._id)}
                  >
                    🗑️ Unassign Room
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Payment Details Modal */}
      {showPaymentModal && selectedStudent && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Send Payment Details</h3>
              <button
                style={styles.closeBtn}
                onClick={() => setShowPaymentModal(false)}
              >
                ✕
              </button>
            </div>
            <div style={styles.modalBody}>
              <div style={styles.studentInfo}>
                <h4>{selectedStudent.name}</h4>
                <p>{selectedStudent.email}</p>
                <p>Room Type: {selectedStudent.roomType}</p>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Hostel Fee Amount (₹)</label>
                <input
                  type="number"
                  value={paymentForm.hostelFeeAmount}
                  onChange={(e) => setPaymentForm({...paymentForm, hostelFeeAmount: e.target.value})}
                  style={styles.formInput}
                  placeholder="Enter hostel fee amount"
                  min="0"
                  step="0.01"
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Mess Fee Amount (₹)</label>
                <input
                  type="number"
                  value={paymentForm.messFeeAmount}
                  onChange={(e) => setPaymentForm({...paymentForm, messFeeAmount: e.target.value})}
                  style={styles.formInput}
                  placeholder="Enter mess fee amount"
                  min="0"
                  step="0.01"
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Payment Due Date</label>
                <input
                  type="date"
                  value={paymentForm.paymentDueDate}
                  onChange={(e) => setPaymentForm({...paymentForm, paymentDueDate: e.target.value})}
                  style={styles.formInput}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div style={styles.totalAmount}>
                <strong>Total Amount: ₹{(parseFloat(paymentForm.hostelFeeAmount || 0) + parseFloat(paymentForm.messFeeAmount || 0)).toFixed(2)}</strong>
              </div>
            </div>
            <div style={styles.modalFooter}>
              <button
                style={styles.cancelBtn}
                onClick={() => setShowPaymentModal(false)}
              >
                Cancel
              </button>
              <button
                style={styles.submitBtn}
                onClick={handleSubmitPaymentDetails}
              >
                Send Payment Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    gap: "30px"
  },

  loadingContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "60px",
    textAlign: "center"
  },

  spinner: {
    width: "50px",
    height: "50px",
    border: "4px solid #f3f3f3",
    borderTop: "4px solid #667eea",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
    marginBottom: "20px"
  },

  errorContainer: {
    textAlign: "center",
    padding: "60px",
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
    marginTop: "20px"
  },

  controls: {
    display: "flex",
    gap: "20px",
    alignItems: "center",
    flexWrap: "wrap"
  },

  searchBox: {
    position: "relative",
    flex: 1,
    minWidth: "300px"
  },

  searchInput: {
    width: "100%",
    padding: "12px 45px 12px 15px",
    borderRadius: "10px",
    border: "2px solid #e1e8ed",
    fontSize: "16px",
    outline: "none",
    transition: "border-color 0.3s ease",
    "&:focus": {
      borderColor: "#667eea"
    }
  },

  searchIcon: {
    position: "absolute",
    right: "15px",
    top: "50%",
    transform: "translateY(-50%)",
    color: "#667eea",
    fontSize: "18px"
  },

  filterBox: {
    display: "flex",
    alignItems: "center",
    gap: "10px"
  },

  filterLabel: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#2c3e50"
  },

  filterSelect: {
    padding: "10px 15px",
    borderRadius: "8px",
    border: "2px solid #e1e8ed",
    fontSize: "16px",
    outline: "none",
    cursor: "pointer"
  },

  stats: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "20px"
  },

  statCard: {
    background: "rgba(255, 255, 255, 0.95)",
    backdropFilter: "blur(10px)",
    padding: "25px",
    borderRadius: "15px",
    textAlign: "center",
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
    border: "1px solid rgba(255, 255, 255, 0.2)"
  },

  studentsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(400px, 1fr))",
    gap: "25px"
  },

  emptyState: {
    gridColumn: "1 / -1",
    textAlign: "center",
    padding: "80px 40px",
    background: "rgba(255, 255, 255, 0.95)",
    borderRadius: "20px",
    border: "2px dashed #e1e8ed"
  },

  emptyIcon: {
    fontSize: "60px",
    marginBottom: "20px"
  },

  studentCard: {
    background: "rgba(255, 255, 255, 0.95)",
    backdropFilter: "blur(10px)",
    borderRadius: "20px",
    padding: "25px",
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
    border: "1px solid rgba(255, 255, 255, 0.2)",
    transition: "all 0.3s ease",
    "&:hover": {
      transform: "translateY(-5px)",
      boxShadow: "0 15px 40px rgba(0, 0, 0, 0.15)"
    }
  },

  studentHeader: {
    display: "flex",
    alignItems: "center",
    gap: "15px",
    marginBottom: "20px"
  },

  studentAvatar: {
    width: "60px",
    height: "60px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #667eea, #764ba2)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 4px 15px rgba(102, 126, 234, 0.3)"
  },

  avatarText: {
    color: "white",
    fontSize: "20px",
    fontWeight: "700"
  },

  studentInfo: {
    flex: 1
  },

  studentName: {
    fontSize: "20px",
    fontWeight: "700",
    color: "#2c3e50",
    margin: "0 0 5px 0"
  },

  studentEmail: {
    fontSize: "14px",
    color: "#7f8c8d",
    margin: 0
  },

  roomStatus: {
    textAlign: "right"
  },

  assignedBadge: {
    background: "linear-gradient(135deg, #27ae60, #2ecc71)",
    color: "white",
    padding: "6px 12px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "600"
  },

  unassignedBadge: {
    background: "linear-gradient(135deg, #f39c12, #e67e22)",
    color: "white",
    padding: "6px 12px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "600"
  },

  studentDetails: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    marginBottom: "20px"
  },

  detailRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "8px 0",
    borderBottom: "1px solid rgba(0, 0, 0, 0.05)"
  },

  detailLabel: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#2c3e50"
  },

  detailValue: {
    fontSize: "14px",
    color: "#667eea",
    fontWeight: "500"
  },

  cardActions: {
    borderTop: "1px solid rgba(0, 0, 0, 0.1)",
    paddingTop: "15px"
  },

  sendPaymentBtn: {
    background: "linear-gradient(135deg, #10b981, #059669)",
    color: "white",
    border: "none",
    padding: "10px 20px",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "600",
    width: "100%",
    marginBottom: "10px",
    transition: "all 0.3s ease",
    "&:hover": {
      transform: "translateY(-2px)",
      boxShadow: "0 4px 15px rgba(16, 185, 129, 0.3)"
    }
  },

  unassignBtn: {
    background: "linear-gradient(135deg, #e74c3c, #c0392b)",
    color: "white",
    border: "none",
    padding: "10px 20px",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "600",
    width: "100%",
    transition: "all 0.3s ease",
    "&:hover": {
      transform: "translateY(-2px)",
      boxShadow: "0 4px 15px rgba(231, 76, 60, 0.3)"
    }
  },

  // Modal Styles
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: '8px',
    width: '90%',
    maxWidth: '500px',
    maxHeight: '90vh',
    overflow: 'auto',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px',
    borderBottom: '1px solid #e5e7eb',
  },
  modalTitle: {
    margin: 0,
    fontSize: '1.25rem',
    fontWeight: 'bold',
    color: '#1f2937',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    fontSize: '1.5rem',
    cursor: 'pointer',
    color: '#6b7280',
    padding: '0',
    width: '30px',
    height: '30px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '4px',
  },
  modalBody: {
    padding: '20px',
  },
  studentInfo: {
    marginBottom: '20px',
    padding: '15px',
    backgroundColor: '#f9fafb',
    borderRadius: '6px',
    border: '1px solid #e5e7eb',
  },
  formGroup: {
    marginBottom: '15px',
  },
  formLabel: {
    display: 'block',
    marginBottom: '5px',
    fontWeight: '500',
    color: '#374151',
  },
  formInput: {
    width: '100%',
    padding: '10px',
    border: '1px solid #d1d5db',
    borderRadius: '4px',
    fontSize: '1rem',
    boxSizing: 'border-box',
  },
  totalAmount: {
    marginTop: '20px',
    padding: '15px',
    backgroundColor: '#ecfdf5',
    border: '1px solid #d1fae5',
    borderRadius: '6px',
    textAlign: 'center',
    color: '#065f46',
    fontSize: '1.1rem',
  },
  modalFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px',
    padding: '20px',
    borderTop: '1px solid #e5e7eb',
  },
  cancelBtn: {
    padding: '10px 20px',
    backgroundColor: '#f3f4f6',
    border: '1px solid #d1d5db',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '1rem',
    color: '#374151',
  },
  submitBtn: {
    padding: '10px 20px',
    backgroundColor: '#3b82f6',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '1rem',
    color: 'white',
    fontWeight: '500',
  },
};

export default StudentManagement;
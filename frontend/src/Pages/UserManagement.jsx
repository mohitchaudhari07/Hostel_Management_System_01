import { useState, useEffect } from "react";
import axios from "axios";

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "student"
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get("http://localhost:5000/api/auth/users");
      setUsers(response.data);
    } catch (error) {
      console.error("Error fetching users:", error);
      alert("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.password) {
      alert("Please fill in all required fields");
      return;
    }

    try {
      const user = JSON.parse(localStorage.getItem("user"));
      if (!user || user.role !== "admin") {
        alert("Unauthorized access");
        return;
      }

      await axios.post("http://localhost:5000/api/auth/create-user", formData, {
        headers: {
          "x-user-id": user.id,
          "x-user-role": user.role
        }
      });

      alert("User created successfully!");
      setFormData({ name: "", email: "", password: "", role: "student" });
      setShowCreateForm(false);
      fetchUsers();
    } catch (error) {
      alert("Error creating user: " + (error.response?.data?.message || "Unknown error"));
    }
  };

  const handleResetPassword = async (userId, email) => {
    const newPassword = prompt("Enter new password:");
    if (!newPassword) return;

    try {
      const user = JSON.parse(localStorage.getItem("user"));
      await axios.post("http://localhost:5000/api/auth/reset-password", {
        email,
        newPassword
      }, {
        headers: {
          "x-user-id": user.id,
          "x-user-role": user.role
        }
      });

      alert("Password reset successfully!");
    } catch (error) {
      alert("Error resetting password: " + (error.response?.data?.message || "Unknown error"));
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case "admin": return "#e74c3c";
      case "mess_staff": return "#f39c12";
      case "student": return "#3498db";
      default: return "#95a5a6";
    }
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p>Loading users...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>User Management</h2>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          style={styles.createBtn}
        >
          {showCreateForm ? "Cancel" : "+ Create User"}
        </button>
      </div>

      {showCreateForm && (
        <div style={styles.formContainer}>
          <h3>Create New User</h3>
          <form onSubmit={handleCreateUser} style={styles.form}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                style={styles.input}
                required
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Email *</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                style={styles.input}
                required
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Password *</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                style={styles.input}
                required
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Role *</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({...formData, role: e.target.value})}
                style={styles.select}
                required
              >
                <option value="student">Student</option>
                <option value="mess_staff">Mess Staff</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div style={styles.buttonGroup}>
              <button type="submit" style={styles.submitBtn}>Create User</button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                style={styles.cancelBtn}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.tableHeader}>
              <th style={styles.tableHeaderCell}>Name</th>
              <th style={styles.tableHeaderCell}>Email</th>
              <th style={styles.tableHeaderCell}>Role</th>
              <th style={styles.tableHeaderCell}>Created</th>
              <th style={styles.tableHeaderCell}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user._id} style={styles.tableRow}>
                <td style={styles.tableCell}>{user.name}</td>
                <td style={styles.tableCell}>{user.email}</td>
                <td style={styles.tableCell}>
                  <span style={{
                    ...styles.roleBadge,
                    backgroundColor: getRoleColor(user.role)
                  }}>
                    {user.role.replace('_', ' ').toUpperCase()}
                  </span>
                </td>
                <td style={styles.tableCell}>
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>
                <td style={styles.tableCell}>
                  <button
                    onClick={() => handleResetPassword(user._id, user.email)}
                    style={styles.actionBtn}
                  >
                    Reset Password
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: "20px",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
  },
  title: {
    margin: 0,
    color: "#2c3e50",
    fontSize: "24px",
    fontWeight: "bold",
  },
  createBtn: {
    backgroundColor: "#27ae60",
    color: "white",
    border: "none",
    padding: "10px 20px",
    borderRadius: "5px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "bold",
  },
  formContainer: {
    backgroundColor: "white",
    padding: "20px",
    borderRadius: "10px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
    marginBottom: "20px",
  },
  form: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
    gap: "20px",
    alignItems: "end",
  },
  inputGroup: {
    display: "flex",
    flexDirection: "column",
  },
  label: {
    marginBottom: "5px",
    fontWeight: "bold",
    color: "#2c3e50",
  },
  input: {
    padding: "10px",
    border: "1px solid #ddd",
    borderRadius: "5px",
    fontSize: "14px",
  },
  select: {
    padding: "10px",
    border: "1px solid #ddd",
    borderRadius: "5px",
    fontSize: "14px",
  },
  buttonGroup: {
    display: "flex",
    gap: "10px",
    gridColumn: "1 / -1",
  },
  submitBtn: {
    backgroundColor: "#27ae60",
    color: "white",
    border: "none",
    padding: "12px 24px",
    borderRadius: "5px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "bold",
  },
  cancelBtn: {
    backgroundColor: "#95a5a6",
    color: "white",
    border: "none",
    padding: "12px 24px",
    borderRadius: "5px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "bold",
  },
  tableContainer: {
    backgroundColor: "white",
    borderRadius: "10px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
    overflow: "hidden",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  tableHeader: {
    backgroundColor: "#f8f9fa",
  },
  tableHeaderCell: {
    padding: "15px",
    textAlign: "left",
    fontWeight: "bold",
    color: "#2c3e50",
    borderBottom: "2px solid #dee2e6",
  },
  tableRow: {
    borderBottom: "1px solid #dee2e6",
  },
  tableCell: {
    padding: "15px",
    verticalAlign: "middle",
  },
  roleBadge: {
    padding: "4px 8px",
    borderRadius: "12px",
    color: "white",
    fontSize: "12px",
    fontWeight: "bold",
  },
  actionBtn: {
    backgroundColor: "#f39c12",
    color: "white",
    border: "none",
    padding: "6px 12px",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "bold",
  },
  loadingContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "200px",
  },
  spinner: {
    width: "40px",
    height: "40px",
    border: "4px solid #f3f3f3",
    borderTop: "4px solid #3498db",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
};

export default UserManagement;
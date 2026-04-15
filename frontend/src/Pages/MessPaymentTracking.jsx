import React, { useState, useEffect } from "react";
import axios from "axios";
import "../styles/MessManagement.css";

const MessPaymentTracking = () => {
  const [payments, setPayments] = useState([]);
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [filterStatus, setFilterStatus] = useState("all");
  const [searchStudent, setSearchStudent] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");

  const [formData, setFormData] = useState({
    studentId: "",
    messFeeId: "",
    amount: "",
    paymentMethod: "offline",
    paymentStatus: "pending",
    amountPaid: "",
    referenceNumber: "",
    notes: ""
  });

  // Fetch payments
  useEffect(() => {
    fetchPayments();
  }, []);

  // Filter and search
  useEffect(() => {
    let filtered = payments;

    if (filterStatus !== "all") {
      filtered = filtered.filter((p) => p.paymentStatus === filterStatus);
    }

    if (searchStudent) {
      filtered = filtered.filter(
        (p) =>
          p.studentId?.name?.toLowerCase().includes(searchStudent.toLowerCase()) ||
          p.studentId?.email?.toLowerCase().includes(searchStudent.toLowerCase())
      );
    }

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === "amountDue") {
        return b.amountDue - a.amountDue;
      } else if (sortBy === "dueDate") {
        return new Date(a.dueDate) - new Date(b.dueDate);
      }
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    setFilteredPayments(filtered);
  }, [payments, filterStatus, searchStudent, sortBy]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/mess/payments");
      setPayments(response.data.payments);
      setError("");
    } catch (err) {
      setError("Failed to fetch payments");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.studentId || !formData.messFeeId) {
      setError("Please select student and fee");
      return;
    }

    try {
      setLoading(true);

      if (editingId) {
        // Update payment status
        await axios.put(`/api/mess/payments/${editingId}`, {
          paymentStatus: formData.paymentStatus,
          amountPaid: parseFloat(formData.amountPaid),
          notes: formData.notes
        });
        alert("Payment updated successfully");
      } else {
        // Create new payment
        await axios.post("/api/mess/payments", {
          ...formData,
          amount: parseFloat(formData.amount),
          amountPaid: parseFloat(formData.amountPaid) || 0
        });
        alert("Payment record created successfully");
      }

      setFormData({
        studentId: "",
        messFeeId: "",
        amount: "",
        paymentMethod: "offline",
        paymentStatus: "pending",
        amountPaid: "",
        referenceNumber: "",
        notes: ""
      });
      setShowPaymentForm(false);
      setEditingId(null);
      fetchPayments();
    } catch (err) {
      setError(err.response?.data?.message || "Error saving payment");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (payment) => {
    setFormData({
      studentId: payment.studentId._id,
      messFeeId: payment.messFeeId._id,
      amount: payment.amount,
      paymentMethod: payment.paymentMethod,
      paymentStatus: payment.paymentStatus,
      amountPaid: payment.amountPaid,
      referenceNumber: payment.referenceNumber,
      notes: payment.notes
    });
    setEditingId(payment._id);
    setShowPaymentForm(true);
  };

  const getStatusColor = (status) => {
    const colors = {
      paid: "badge-success",
      pending: "badge-warning",
      overdue: "badge-danger",
      failed: "badge-error"
    };
    return colors[status] || "badge-secondary";
  };

  return (
    <div className="mess-payment-tracking">
      <div className="header">
        <h2>💳 Payment Tracking</h2>
        <button
          className="btn btn-primary"
          onClick={() => {
            setShowPaymentForm(!showPaymentForm);
            setEditingId(null);
          }}
        >
          {showPaymentForm ? "Cancel" : "➕ New Payment Record"}
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {showPaymentForm && (
        <div className="payment-form-container">
          <h3>{editingId ? "Update Payment" : "Create Payment Record"}</h3>
          <form onSubmit={handleSubmit} className="payment-form">
            <div className="form-row">
              <div className="form-group">
                <label>Student *</label>
                <select
                  name="studentId"
                  value={formData.studentId}
                  onChange={handleInputChange}
                  required
                  disabled={editingId !== null}
                >
                  <option value="">Select Student</option>
                  {/* This would be populated with students from API */}
                </select>
              </div>

              <div className="form-group">
                <label>Mess Fee *</label>
                <select
                  name="messFeeId"
                  value={formData.messFeeId}
                  onChange={handleInputChange}
                  required
                  disabled={editingId !== null}
                >
                  <option value="">Select Fee</option>
                  {/* This would be populated with fees from API */}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Amount (₹)</label>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleInputChange}
                  min="0"
                  disabled={editingId !== null}
                />
              </div>

              <div className="form-group">
                <label>Amount Paid (₹)</label>
                <input
                  type="number"
                  name="amountPaid"
                  value={formData.amountPaid}
                  onChange={handleInputChange}
                  min="0"
                />
              </div>

              <div className="form-group">
                <label>Payment Method</label>
                <select
                  name="paymentMethod"
                  value={formData.paymentMethod}
                  onChange={handleInputChange}
                >
                  <option value="offline">Offline</option>
                  <option value="online">Online</option>
                  <option value="cash">Cash</option>
                  <option value="cheque">Cheque</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="upi">UPI</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Payment Status</label>
                <select
                  name="paymentStatus"
                  value={formData.paymentStatus}
                  onChange={handleInputChange}
                >
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="overdue">Overdue</option>
                  <option value="failed">Failed</option>
                </select>
              </div>

              <div className="form-group">
                <label>Reference Number</label>
                <input
                  type="text"
                  name="referenceNumber"
                  value={formData.referenceNumber}
                  onChange={handleInputChange}
                  placeholder="Cheque/Reference No."
                />
              </div>
            </div>

            <div className="form-group">
              <label>Notes</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                placeholder="Additional notes"
                rows="3"
              />
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-success" disabled={loading}>
                {loading ? "Saving..." : editingId ? "Update Payment" : "Create Record"}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setShowPaymentForm(false);
                  setEditingId(null);
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="filters-section">
        <div className="filter-group">
          <label>Status:</label>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="all">All</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Search Student:</label>
          <input
            type="text"
            placeholder="Search by name or email"
            value={searchStudent}
            onChange={(e) => setSearchStudent(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <label>Sort By:</label>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="createdAt">Latest</option>
            <option value="amountDue">Amount Due (High to Low)</option>
            <option value="dueDate">Due Date</option>
          </select>
        </div>
      </div>

      {loading && !showPaymentForm ? (
        <div className="loading">Loading payments...</div>
      ) : null}

      <div className="payments-summary">
        <div className="summary-card">
          <h4>Total Payments</h4>
          <p className="value">{filteredPayments.length}</p>
        </div>
        <div className="summary-card">
          <h4>Paid</h4>
          <p className="value success">
            {filteredPayments.filter((p) => p.paymentStatus === "paid").length}
          </p>
        </div>
        <div className="summary-card">
          <h4>Pending</h4>
          <p className="value warning">
            {filteredPayments.filter((p) => p.paymentStatus === "pending").length}
          </p>
        </div>
        <div className="summary-card">
          <h4>Overdue</h4>
          <p className="value danger">
            {filteredPayments.filter((p) => p.paymentStatus === "overdue").length}
          </p>
        </div>
      </div>

      <div className="payments-table-container">
        <table className="payments-table">
          <thead>
            <tr>
              <th>Student</th>
              <th>Period</th>
              <th>Amount (₹)</th>
              <th>Amount Paid (₹)</th>
              <th>Due Amount (₹)</th>
              <th>Due Date</th>
              <th>Status</th>
              <th>Method</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredPayments.length === 0 ? (
              <tr>
                <td colSpan="9" className="no-data">
                  No payments found
                </td>
              </tr>
            ) : (
              filteredPayments.map((payment) => (
                <tr key={payment._id}>
                  <td>
                    <div className="student-info">
                      <div>{payment.studentId.name}</div>
                      <small>{payment.studentId.email}</small>
                    </div>
                  </td>
                  <td>{payment.messFeeId?.period || "N/A"}</td>
                  <td className="amount">₹{payment.amount}</td>
                  <td className="amount">₹{payment.amountPaid}</td>
                  <td className="amount">₹{payment.amountDue}</td>
                  <td>{new Date(payment.dueDate).toLocaleDateString()}</td>
                  <td>
                    <span className={`badge ${getStatusColor(payment.paymentStatus)}`}>
                      {payment.paymentStatus.toUpperCase()}
                    </span>
                  </td>
                  <td>{payment.paymentMethod}</td>
                  <td className="actions">
                    <button
                      className="btn btn-small btn-edit"
                      onClick={() => handleEdit(payment)}
                    >
                      ✏️
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MessPaymentTracking;

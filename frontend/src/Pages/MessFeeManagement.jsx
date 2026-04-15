import React, { useState, useEffect } from "react";
import axios from "axios";
import "../styles/MessManagement.css";

const MessFeeManagement = () => {
  const [fees, setFees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    feeType: "monthly",
    period: "",
    feeAmount: "",
    feeCategory: "combined",
    applicableToRoomType: "all",
    dueDate: "",
    lateFeePercentage: "0",
    description: "",
    notes: ""
  });

  // Fetch all fees
  useEffect(() => {
    fetchFees();
  }, []);

  const fetchFees = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/mess/fees");
      setFees(response.data.fees);
      setError("");
    } catch (err) {
      setError("Failed to fetch fees");
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

    if (!formData.period || !formData.feeAmount || !formData.dueDate) {
      setError("Please fill all required fields");
      return;
    }

    try {
      setLoading(true);

      if (editingId) {
        // Update existing fee
        await axios.put(`/api/mess/fees/${editingId}`, formData);
        setError("");
        alert("Fee updated successfully");
      } else {
        // Create new fee
        await axios.post("/api/mess/fees", formData);
        setError("");
        alert("Fee created successfully");
      }

      setFormData({
        feeType: "monthly",
        period: "",
        feeAmount: "",
        feeCategory: "combined",
        applicableToRoomType: "all",
        dueDate: "",
        lateFeePercentage: "0",
        description: "",
        notes: ""
      });
      setShowForm(false);
      setEditingId(null);
      fetchFees();
    } catch (err) {
      setError(err.response?.data?.message || "Error saving fee");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (fee) => {
    setFormData({
      feeType: fee.feeType,
      period: fee.period,
      feeAmount: fee.feeAmount,
      feeCategory: fee.feeCategory,
      applicableToRoomType: Array.isArray(fee.applicableToRoomType) 
        ? fee.applicableToRoomType[0] 
        : fee.applicableToRoomType,
      dueDate: new Date(fee.dueDate).toISOString().split("T")[0],
      lateFeePercentage: fee.lateFeePercentage,
      description: fee.description,
      notes: fee.notes
    });
    setEditingId(fee._id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this fee?")) {
      try {
        await axios.delete(`/api/mess/fees/${id}`);
        alert("Fee deleted successfully");
        fetchFees();
      } catch (err) {
        setError("Failed to delete fee");
        console.error(err);
      }
    }
  };

  const handleCancel = () => {
    setFormData({
      feeType: "monthly",
      period: "",
      feeAmount: "",
      feeCategory: "combined",
      applicableToRoomType: "all",
      dueDate: "",
      lateFeePercentage: "0",
      description: "",
      notes: ""
    });
    setShowForm(false);
    setEditingId(null);
  };

  return (
    <div className="mess-fee-management">
      <div className="header">
        <h2>💰 Mess Fee Management</h2>
        <button
          className="btn btn-primary"
          onClick={() => {
            setShowForm(!showForm);
            setEditingId(null);
          }}
        >
          {showForm ? "Cancel" : "➕ Add New Fee"}
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {showForm && (
        <div className="fee-form-container">
          <h3>{editingId ? "Edit Fee" : "Create New Fee"}</h3>
          <form onSubmit={handleSubmit} className="fee-form">
            <div className="form-row">
              <div className="form-group">
                <label>Fee Type *</label>
                <select
                  name="feeType"
                  value={formData.feeType}
                  onChange={handleInputChange}
                  required
                >
                  <option value="monthly">Monthly</option>
                  <option value="semester">Semester</option>
                </select>
              </div>

              <div className="form-group">
                <label>Period *</label>
                <input
                  type="text"
                  name="period"
                  placeholder="e.g., 2025-02 or Spring-2025"
                  value={formData.period}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Fee Amount (₹) *</label>
                <input
                  type="number"
                  name="feeAmount"
                  placeholder="Amount"
                  value={formData.feeAmount}
                  onChange={handleInputChange}
                  min="0"
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Fee Category</label>
                <select
                  name="feeCategory"
                  value={formData.feeCategory}
                  onChange={handleInputChange}
                >
                  <option value="meals">Meals</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="utilities">Utilities</option>
                  <option value="combined">Combined</option>
                </select>
              </div>

              <div className="form-group">
                <label>Applicable To</label>
                <select
                  name="applicableToRoomType"
                  value={formData.applicableToRoomType}
                  onChange={handleInputChange}
                >
                  <option value="all">All Room Types</option>
                  <option value="Single">Single</option>
                  <option value="Double">Double</option>
                  <option value="Triple">Triple</option>
                </select>
              </div>

              <div className="form-group">
                <label>Due Date *</label>
                <input
                  type="date"
                  name="dueDate"
                  value={formData.dueDate}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Late Fee (%)</label>
                <input
                  type="number"
                  name="lateFeePercentage"
                  placeholder="Percentage"
                  value={formData.lateFeePercentage}
                  onChange={handleInputChange}
                  min="0"
                  max="100"
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <input
                  type="text"
                  name="description"
                  placeholder="Description"
                  value={formData.description}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Notes</label>
              <textarea
                name="notes"
                placeholder="Additional notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows="3"
              />
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-success" disabled={loading}>
                {loading ? "Saving..." : editingId ? "Update Fee" : "Create Fee"}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleCancel}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {loading && !showForm ? (
        <div className="loading">Loading fees...</div>
      ) : null}

      <div className="fees-table-container">
        <table className="fees-table">
          <thead>
            <tr>
              <th>Period</th>
              <th>Type</th>
              <th>Amount (₹)</th>
              <th>Category</th>
              <th>Applicable To</th>
              <th>Due Date</th>
              <th>Late Fee</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {fees.length === 0 ? (
              <tr>
                <td colSpan="9" className="no-data">
                  No fees found. Create a new fee to get started.
                </td>
              </tr>
            ) : (
              fees.map((fee) => (
                <tr key={fee._id}>
                  <td>{fee.period}</td>
                  <td>
                    <span className="badge badge-info">
                      {fee.feeType.toUpperCase()}
                    </span>
                  </td>
                  <td className="amount">₹{fee.feeAmount}</td>
                  <td>{fee.feeCategory}</td>
                  <td>
                    {Array.isArray(fee.applicableToRoomType)
                      ? fee.applicableToRoomType.join(", ")
                      : fee.applicableToRoomType}
                  </td>
                  <td>{new Date(fee.dueDate).toLocaleDateString()}</td>
                  <td>{fee.lateFeePercentage}%</td>
                  <td>
                    <span
                      className={`badge ${
                        fee.isActive ? "badge-success" : "badge-danger"
                      }`}
                    >
                      {fee.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="actions">
                    <button
                      className="btn btn-small btn-edit"
                      onClick={() => handleEdit(fee)}
                    >
                      ✏️
                    </button>
                    <button
                      className="btn btn-small btn-delete"
                      onClick={() => handleDelete(fee._id)}
                    >
                      🗑️
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

export default MessFeeManagement;

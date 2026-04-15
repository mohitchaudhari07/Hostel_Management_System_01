import React, { useState, useEffect } from "react";
import axios from "axios";
import "../styles/MessManagement.css";

const MessPanel = () => {
  const [studentData, setStudentData] = useState(null);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);

  const studentId = localStorage.getItem("studentId") || ""; // Get from session

  // Fetch student mess data
  useEffect(() => {
    if (studentId) {
      fetchMessData();
    }
  }, [studentId]);

  const fetchMessData = async () => {
    try {
      setLoading(true);
      const [historyRes, invoicesRes] = await Promise.all([
        axios.get(`/api/mess/student/${studentId}/payment-history`),
        axios.get(`/api/mess/student/${studentId}/invoices`)
      ]);

      setPaymentHistory(historyRes.data.payments);
      setStudentData({
        name: historyRes.data.studentName,
        email: historyRes.data.studentEmail,
        stats: historyRes.data.stats
      });

      setInvoices(invoicesRes.data.invoices);
      setError("");
    } catch (err) {
      setError("Failed to load mess data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReceipt = (invoiceId) => {
    // In a real application, this would generate and download a PDF
    // For now, we'll just fetch the invoice and display it
    alert(`Receipt download initiated for invoice: ${invoiceId}`);
    // window.open(`/api/mess/invoices/${invoiceId}/download`, '_blank');
  };

  const handlePayOnline = (paymentId) => {
    setSelectedPayment(paymentId);
    setShowPaymentModal(true);
  };

  const processOnlinePayment = async () => {
    try {
      // This would integrate with payment gateway (Razorpay, Stripe, etc.)
      alert("Redirecting to payment gateway...");
      // For demo: POST to /api/mess/payments/{id}/pay-online
      setShowPaymentModal(false);
    } catch (err) {
      setError("Payment processing failed");
      console.error(err);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      paid: "status-paid",
      pending: "status-pending",
      overdue: "status-overdue",
      failed: "status-failed"
    };
    return colors[status] || "status-default";
  };

  if (loading) {
    return <div className="loading">Loading mess panel...</div>;
  }

  return (
    <div className="mess-panel">
      <div className="header">
        <h2>🍽️ Mess Payment Panel</h2>
        <button className="btn btn-primary" onClick={fetchMessData}>
          🔄 Refresh
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {studentData && (
        <div className="student-greeting">
          <h3>Welcome, {studentData.name}!</h3>
          <p>{studentData.email}</p>
        </div>
      )}

      <div className="tabs">
        <button
          className={`tab ${activeTab === "overview" ? "active" : ""}`}
          onClick={() => setActiveTab("overview")}
        >
          📊 Overview
        </button>
        <button
          className={`tab ${activeTab === "payments" ? "active" : ""}`}
          onClick={() => setActiveTab("payments")}
        >
          💳 Payment History
        </button>
        <button
          className={`tab ${activeTab === "invoices" ? "active" : ""}`}
          onClick={() => setActiveTab("invoices")}
        >
          📄 Invoices
        </button>
      </div>

      {activeTab === "overview" && studentData && (
        <div className="overview-section">
          <h3>Fee Summary</h3>

          <div className="fee-summary-cards">
            <div className="card fee-card">
              <h4>Total Fees</h4>
              <p className="fee-amount">₹{studentData.stats.totalFees.toLocaleString()}</p>
              <small>All time total fees</small>
            </div>

            <div className="card fee-card paid">
              <h4>✅ Total Paid</h4>
              <p className="fee-amount">₹{studentData.stats.totalPaid.toLocaleString()}</p>
              <small>Successfully paid</small>
            </div>

            <div className="card fee-card due">
              <h4>⏳ Total Due</h4>
              <p className="fee-amount">₹{studentData.stats.totalDue.toLocaleString()}</p>
              <small>Pending payment</small>
            </div>

            <div className="card fee-card">
              <h4>Payment Records</h4>
              <p className="fee-count">
                {studentData.stats.paidCount}/{studentData.stats.paidCount + studentData.stats.pendingCount}
              </p>
              <small>Paid / Total</small>
            </div>
          </div>

          <div className="payment-status-cards">
            <div className="card status-card">
              <h4>🟢 Paid</h4>
              <p className="status-count">{studentData.stats.paidCount}</p>
            </div>

            <div className="card status-card">
              <h4>🟡 Pending</h4>
              <p className="status-count">{studentData.stats.pendingCount}</p>
            </div>

            <div className="card status-card">
              <h4>🔴 Overdue</h4>
              <p className="status-count">{studentData.stats.overdueCount}</p>
            </div>
          </div>

          {studentData.stats.totalDue > 0 && (
            <div className="action-alert">
              <h4>⚠️ Action Required</h4>
              <p>You have outstanding dues of ₹{studentData.stats.totalDue.toLocaleString()}</p>
              <button
                className="btn btn-primary"
                onClick={() => setActiveTab("payments")}
              >
                Pay Now
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab === "payments" && (
        <div className="payments-section">
          <h3>Payment History</h3>

          <div className="payments-table-container">
            <table className="payments-table">
              <thead>
                <tr>
                  <th>Period</th>
                  <th>Fee Amount (₹)</th>
                  <th>Amount Paid (₹)</th>
                  <th>Due Amount (₹)</th>
                  <th>Due Date</th>
                  <th>Status</th>
                  <th>Payment Date</th>
                  <th>Method</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paymentHistory.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="no-data">
                      No payment history available
                    </td>
                  </tr>
                ) : (
                  paymentHistory.map((payment) => (
                    <tr key={payment._id} className={getStatusColor(payment.paymentStatus)}>
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
                      <td>
                        {payment.paymentDate
                          ? new Date(payment.paymentDate).toLocaleDateString()
                          : "-"}
                      </td>
                      <td>{payment.paymentMethod || "-"}</td>
                      <td className="actions">
                        {payment.paymentStatus !== "paid" && (
                          <button
                            className="btn btn-small btn-pay"
                            onClick={() => handlePayOnline(payment._id)}
                          >
                            💳 Pay
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="payment-guide">
            <h4>Payment Methods Available</h4>
            <ul>
              <li>💳 Online Payment (Razorpay, Credit/Debit Card)</li>
              <li>📱 UPI / Digital Wallet</li>
              <li>🏦 Bank Transfer</li>
              <li>💵 Cash Payment at Mess Office</li>
              <li>✉️ Cheque Payment</li>
            </ul>
          </div>
        </div>
      )}

      {activeTab === "invoices" && (
        <div className="invoices-section">
          <h3>Invoices</h3>

          <div className="invoices-container">
            {invoices.length === 0 ? (
              <div className="no-data">No invoices generated yet</div>
            ) : (
              invoices.map((invoice) => (
                <div key={invoice._id} className="invoice-card">
                  <div className="invoice-header">
                    <h4>{invoice.invoiceNumber}</h4>
                    <span className={`badge ${getStatusColor(invoice.invoiceStatus)}`}>
                      {invoice.invoiceStatus.toUpperCase()}
                    </span>
                  </div>

                  <div className="invoice-details">
                    <div className="detail-row">
                      <span className="label">Period:</span>
                      <span className="value">
                        {new Date(invoice.periodFrom).toLocaleDateString()} -{" "}
                        {new Date(invoice.periodTo).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="detail-row">
                      <span className="label">Invoice Date:</span>
                      <span className="value">
                        {new Date(invoice.invoiceDate).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="detail-row">
                      <span className="label">Due Date:</span>
                      <span className="value">
                        {new Date(invoice.dueDate).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="detail-row">
                      <span className="label">Total Amount:</span>
                      <span className="value amount">₹{invoice.totalAmount.toLocaleString()}</span>
                    </div>

                    <div className="detail-row">
                      <span className="label">Amount Paid:</span>
                      <span className="value amount">₹{invoice.amountPaid.toLocaleString()}</span>
                    </div>

                    <div className="detail-row">
                      <span className="label">Balance Due:</span>
                      <span className="value amount">₹{invoice.balanceDue.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="invoice-actions">
                    <button
                      className="btn btn-small btn-download"
                      onClick={() => handleDownloadReceipt(invoice._id)}
                    >
                      📥 Download Receipt
                    </button>
                    {invoice.balanceDue > 0 && (
                      <button
                        className="btn btn-small btn-pay"
                        onClick={() => handlePayOnline(invoice._id)}
                      >
                        💳 Pay Now
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {showPaymentModal && (
        <div className="modal-overlay" onClick={() => setShowPaymentModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Online Payment</h3>
            <p>Select your preferred payment method to proceed with the payment.</p>

            <div className="payment-methods">
              <button className="payment-method" onClick={processOnlinePayment}>
                💳 Razorpay (Credit/Debit Card)
              </button>
              <button className="payment-method" onClick={processOnlinePayment}>
                📱 UPI
              </button>
              <button className="payment-method" onClick={processOnlinePayment}>
                🏦 Netbanking
              </button>
              <button className="payment-method" onClick={processOnlinePayment}>
                📱 Mobile Wallet
              </button>
            </div>

            <button
              className="btn btn-secondary"
              onClick={() => setShowPaymentModal(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessPanel;

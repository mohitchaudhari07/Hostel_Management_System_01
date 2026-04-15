import React, { useState, useEffect } from "react";
import axios from "axios";
import "../styles/MessManagement.css";

const MessAnalytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [collectionSummary, setCollectionSummary] = useState(null);
  const [pendingDuesReport, setPendingDuesReport] = useState(null);
  const [paymentDistribution, setPaymentDistribution] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Fetch analytics
  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const [analyticsRes, collectionRes, duesRes, distributionRes] = await Promise.all([
        axios.get("/api/mess/analytics/dashboard"),
        axios.get("/api/mess/analytics/collection-summary"),
        axios.get("/api/mess/analytics/pending-dues-report"),
        axios.get("/api/mess/analytics/payment-status-distribution")
      ]);

      setAnalytics(analyticsRes.data);
      setCollectionSummary(collectionRes.data);
      setPendingDuesReport(duesRes.data);
      setPaymentDistribution(distributionRes.data);
      setError("");
    } catch (err) {
      setError("Failed to fetch analytics");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading analytics...</div>;
  }

  return (
    <div className="mess-analytics">
      <div className="header">
        <h2>📊 Mess Analytics Dashboard</h2>
        <button className="btn btn-primary" onClick={fetchAnalytics}>
          🔄 Refresh
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="tabs">
        <button
          className={`tab ${activeTab === "overview" ? "active" : ""}`}
          onClick={() => setActiveTab("overview")}
        >
          📈 Overview
        </button>
        <button
          className={`tab ${activeTab === "collection" ? "active" : ""}`}
          onClick={() => setActiveTab("collection")}
        >
          💰 Collection
        </button>
        <button
          className={`tab ${activeTab === "dues" ? "active" : ""}`}
          onClick={() => setActiveTab("dues")}
        >
          ⚠️ Pending Dues
        </button>
        <button
          className={`tab ${activeTab === "distribution" ? "active" : ""}`}
          onClick={() => setActiveTab("distribution")}
        >
          📊 Distribution
        </button>
      </div>

      {activeTab === "overview" && analytics && (
        <div className="analytics-section">
          <h3>Dashboard Overview</h3>

          <div className="overview-cards">
            <div className="card metric-card">
              <h4>Total Students</h4>
              <p className="metric-value">{analytics.overview.totalStudents}</p>
            </div>
            <div className="card metric-card">
              <h4>Total Payments</h4>
              <p className="metric-value">{analytics.overview.totalPayments}</p>
            </div>
            <div className="card metric-card">
              <h4>Total Transactions</h4>
              <p className="metric-value">{analytics.overview.totalTransactions}</p>
            </div>
          </div>

          <div className="revenue-cards">
            <div className="card revenue-card success">
              <h4>💵 Total Collected</h4>
              <p className="revenue-value">₹{analytics.revenue.totalCollected.toLocaleString()}</p>
            </div>
            <div className="card revenue-card warning">
              <h4>⏳ Pending Amount</h4>
              <p className="revenue-value">₹{analytics.revenue.totalPending.toLocaleString()}</p>
            </div>
            <div className="card revenue-card danger">
              <h4>🚨 Overdue Amount</h4>
              <p className="revenue-value">₹{analytics.revenue.totalOverdue.toLocaleString()}</p>
            </div>
            <div className="card revenue-card info">
              <h4>📊 Total Due</h4>
              <p className="revenue-value">₹{analytics.revenue.totalDue.toLocaleString()}</p>
            </div>
          </div>

          <div className="charts-section">
            <div className="chart-container">
              <h4>Payment Status Summary</h4>
              <table className="mini-table">
                <thead>
                  <tr>
                    <th>Status</th>
                    <th>Count</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.paymentStats.map((stat) => (
                    <tr key={stat._id}>
                      <td>{stat._id.toUpperCase()}</td>
                      <td>{stat.count}</td>
                      <td>₹{stat.totalAmount.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="chart-container">
              <h4>Top Paying Students</h4>
              <table className="mini-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Total Paid</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.topPayingStudents.slice(0, 5).map((student) => (
                    <tr key={student._id}>
                      <td>{student.student.name}</td>
                      <td>₹{student.totalPaid.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="charts-section">
            <div className="chart-container">
              <h4>Payment Method Breakdown</h4>
              <table className="mini-table">
                <thead>
                  <tr>
                    <th>Method</th>
                    <th>Transactions</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.paymentMethodStats.map((method) => (
                    <tr key={method._id}>
                      <td>{method._id.replace("_", " ").toUpperCase()}</td>
                      <td>{method.count}</td>
                      <td>₹{method.totalAmount.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="chart-container">
              <h4>Fee-Wise Collection</h4>
              <table className="mini-table">
                <thead>
                  <tr>
                    <th>Period</th>
                    <th>Total Amount</th>
                    <th>Collected</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.feeWiseCollection.slice(0, 5).map((fw) => (
                    <tr key={fw._id}>
                      <td>{fw.fee && fw.fee.length > 0 ? fw.fee[0].period : "N/A"}</td>
                      <td>₹{fw.totalAmount.toLocaleString()}</td>
                      <td>₹{fw.totalPaid.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="chart-container">
            <h4>Monthly Collection Trend</h4>
            <table className="mini-table">
              <thead>
                <tr>
                  <th>Month</th>
                  <th>Transactions</th>
                  <th>Total Amount</th>
                </tr>
              </thead>
              <tbody>
                {analytics.monthlyTrend.map((trend) => (
                  <tr key={`${trend._id.year}-${trend._id.month}`}>
                    <td>
                      {new Date(trend._id.year, trend._id.month - 1).toLocaleDateString("en-US", {
                        month: "short",
                        year: "numeric"
                      })}
                    </td>
                    <td>{trend.count}</td>
                    <td>₹{trend.totalAmount.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "collection" && collectionSummary && (
        <div className="analytics-section">
          <h3>Collection Summary</h3>

          <div className="filter-section">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            >
              <option value="">All Months</option>
              <option value="1">January</option>
              <option value="2">February</option>
              <option value="3">March</option>
              <option value="4">April</option>
              <option value="5">May</option>
              <option value="6">June</option>
              <option value="7">July</option>
              <option value="8">August</option>
              <option value="9">September</option>
              <option value="10">October</option>
              <option value="11">November</option>
              <option value="12">December</option>
            </select>

            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
            >
              <option value="2023">2023</option>
              <option value="2024">2024</option>
              <option value="2025">2025</option>
              <option value="2026">2026</option>
            </select>
          </div>

          <div className="collection-cards">
            <div className="card collection-card">
              <h4>Total Collection</h4>
              <p className="collection-value">
                ₹{collectionSummary.summary.totalCollection?.toLocaleString() || 0}
              </p>
            </div>
            <div className="card collection-card">
              <h4>Total Transactions</h4>
              <p className="collection-value">
                {collectionSummary.summary.totalTransactions || 0}
              </p>
            </div>
            <div className="card collection-card">
              <h4>Average Transaction</h4>
              <p className="collection-value">
                ₹{Math.round(collectionSummary.summary.averageTransaction || 0).toLocaleString()}
              </p>
            </div>
          </div>

          <div className="chart-container">
            <h4>Payment Method Breakdown</h4>
            <table className="mini-table">
              <thead>
                <tr>
                  <th>Method</th>
                  <th>Transactions</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {collectionSummary.paymentBreakdown.map((pb) => (
                  <tr key={pb._id}>
                    <td>{pb._id.replace("_", " ").toUpperCase()}</td>
                    <td>{pb.count}</td>
                    <td>₹{pb.amount.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "dues" && pendingDuesReport && (
        <div className="analytics-section">
          <h3>Pending Dues Report</h3>

          <div className="dues-cards">
            <div className="card dues-card">
              <h4>Total Due</h4>
              <p className="dues-value">₹{pendingDuesReport.totals.totalDue.toLocaleString()}</p>
            </div>
            <div className="card dues-card">
              <h4>Students in Arrears</h4>
              <p className="dues-value">{pendingDuesReport.totals.studentsInArrears}</p>
            </div>
            <div className="card dues-card">
              <h4>Average Due</h4>
              <p className="dues-value">
                ₹
                {Math.round(pendingDuesReport.totals.averageDuePerStudent).toLocaleString()}
              </p>
            </div>
          </div>

          <div className="chart-container">
            <h4>Students with Outstanding Dues</h4>
            <table className="mini-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Email</th>
                  <th>Total Due</th>
                  <th>Periods</th>
                </tr>
              </thead>
              <tbody>
                {pendingDuesReport.studentDues.slice(0, 10).map((student) => (
                  <tr key={student.student._id}>
                    <td>{student.student.name}</td>
                    <td>{student.student.email}</td>
                    <td className="dues-amount">₹{student.totalDue.toLocaleString()}</td>
                    <td>{student.payments.length}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "distribution" && paymentDistribution && (
        <div className="analytics-section">
          <h3>Payment Status Distribution</h3>

          <div className="distribution-cards">
            {paymentDistribution.distribution.map((item) => (
              <div key={item._id} className="card distribution-card">
                <h4>{item._id.replace("_", " ").toUpperCase()}</h4>
                <p className="distribution-count">{item.count}</p>
                <p className="distribution-percentage">{item.percentage}%</p>
                <p className="distribution-amount">₹{item.totalAmount.toLocaleString()}</p>
              </div>
            ))}
          </div>

          <div className="chart-container">
            <h4>Status Details</h4>
            <table className="mini-table">
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Count</th>
                  <th>Percentage</th>
                  <th>Total Amount</th>
                  <th>Pending Amount</th>
                </tr>
              </thead>
              <tbody>
                {paymentDistribution.distribution.map((item) => (
                  <tr key={item._id}>
                    <td>{item._id}</td>
                    <td>{item.count}</td>
                    <td>{item.percentage}%</td>
                    <td>₹{item.totalAmount.toLocaleString()}</td>
                    <td>₹{item.totalAmountDue.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessAnalytics;

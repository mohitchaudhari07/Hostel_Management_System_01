import { useState, useEffect } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { 
  BarChart3, RefreshCw, AlertCircle, DollarSign, Users, CreditCard, 
  TrendingUp, AlertTriangle, Wallet, ArrowUpRight, ArrowDownRight,
  PieChart, LineChart, FileText
} from "lucide-react";

export default function MessAnalytics() {
  const [analytics, setAnalytics] = useState(null);
  const [collectionSummary, setCollectionSummary] = useState(null);
  const [pendingDuesReport, setPendingDuesReport] = useState(null);
  const [paymentDistribution, setPaymentDistribution] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const [analyticsRes, collectionRes, duesRes, distributionRes] = await Promise.all([
        axios.get("/mess/analytics/dashboard"),
        axios.get("/mess/analytics/collection-summary"),
        axios.get("/mess/analytics/pending-dues-report"),
        axios.get("/mess/analytics/payment-status-distribution")
      ]);

      setAnalytics(analyticsRes.data);
      setCollectionSummary(collectionRes.data);
      setPendingDuesReport(duesRes.data);
      setPaymentDistribution(distributionRes.data);
      setError("");
    } catch (err) {
      setError("Failed to fetch analytics data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-200 shadow-sm">
      <RefreshCw className="animate-spin text-blue-600 mb-4" size={48} />
      <p className="text-slate-500 font-medium">Crunching the numbers...</p>
    </div>
  );

  return (
    <div className="font-sans space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <BarChart3 className="text-blue-600" /> Mess Financial Analytics
          </h2>
          <p className="text-slate-500 font-medium mt-1">Track revenue, collections, and pending dues</p>
        </div>
        <button onClick={fetchAnalytics} className="px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold rounded-xl transition-colors flex items-center gap-2">
          <RefreshCw size={16} /> Refresh Data
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-xl font-bold flex items-center gap-2">
          <AlertCircle size={18} /> {error}
        </div>
      )}

      <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
        {[
          { id: "overview", label: "Overview", icon: BarChart3 },
          { id: "collection", label: "Collection", icon: Wallet },
          { id: "dues", label: "Pending Dues", icon: AlertTriangle },
          { id: "distribution", label: "Distribution", icon: PieChart }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === tab.id 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' 
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <tab.icon size={18} /> {tab.label}
          </button>
        ))}
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
        
        {/* OVERVIEW TAB */}
        {activeTab === "overview" && analytics && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center text-blue-600"><Users size={24}/></div>
                <div>
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">Total Students</p>
                  <p className="text-3xl font-black text-slate-800">{analytics.overview.totalStudents}</p>
                </div>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600"><CreditCard size={24}/></div>
                <div>
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">Total Payments</p>
                  <p className="text-3xl font-black text-slate-800">{analytics.overview.totalPayments}</p>
                </div>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600"><TrendingUp size={24}/></div>
                <div>
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">Transactions</p>
                  <p className="text-3xl font-black text-slate-800">{analytics.overview.totalTransactions}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-6 rounded-2xl shadow-lg shadow-emerald-500/20 text-white">
                <div className="flex justify-between items-start mb-4">
                  <p className="font-bold text-emerald-100 uppercase tracking-wider text-xs">Collected</p>
                  <div className="p-2 bg-white/20 rounded-lg"><ArrowUpRight size={18}/></div>
                </div>
                <p className="text-3xl font-black">₹{analytics.revenue.totalCollected.toLocaleString()}</p>
              </div>
              
              <div className="bg-gradient-to-br from-amber-500 to-orange-500 p-6 rounded-2xl shadow-lg shadow-amber-500/20 text-white">
                <div className="flex justify-between items-start mb-4">
                  <p className="font-bold text-amber-100 uppercase tracking-wider text-xs">Pending</p>
                  <div className="p-2 bg-white/20 rounded-lg"><Clock size={18} className="lucide-clock"/></div>
                </div>
                <p className="text-3xl font-black">₹{analytics.revenue.totalPending.toLocaleString()}</p>
              </div>

              <div className="bg-gradient-to-br from-red-500 to-pink-600 p-6 rounded-2xl shadow-lg shadow-red-500/20 text-white">
                <div className="flex justify-between items-start mb-4">
                  <p className="font-bold text-red-100 uppercase tracking-wider text-xs">Overdue</p>
                  <div className="p-2 bg-white/20 rounded-lg"><AlertTriangle size={18}/></div>
                </div>
                <p className="text-3xl font-black">₹{analytics.revenue.totalOverdue.toLocaleString()}</p>
              </div>

              <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-6 rounded-2xl shadow-lg shadow-blue-500/20 text-white">
                <div className="flex justify-between items-start mb-4">
                  <p className="font-bold text-blue-100 uppercase tracking-wider text-xs">Total Due Generation</p>
                  <div className="p-2 bg-white/20 rounded-lg"><DollarSign size={18}/></div>
                </div>
                <p className="text-3xl font-black">₹{analytics.revenue.totalDue.toLocaleString()}</p>
              </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                <div className="p-5 border-b border-slate-100">
                  <h3 className="font-bold text-slate-800 flex items-center gap-2"><PieChart size={18} className="text-blue-600"/> Payment Status Summary</h3>
                </div>
                <div className="p-4 flex-1 overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-slate-400 text-xs uppercase tracking-wider border-b border-slate-100">
                        <th className="pb-3 font-bold">Status</th>
                        <th className="pb-3 font-bold text-center">Count</th>
                        <th className="pb-3 font-bold text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {analytics.paymentStats.map((stat) => (
                        <tr key={stat._id}>
                          <td className="py-3 font-bold text-slate-700">{stat._id.toUpperCase()}</td>
                          <td className="py-3 text-center font-medium text-slate-500">{stat.count}</td>
                          <td className="py-3 text-right font-black text-slate-800">₹{stat.totalAmount.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                <div className="p-5 border-b border-slate-100">
                  <h3 className="font-bold text-slate-800 flex items-center gap-2"><Users size={18} className="text-blue-600"/> Top Paying Students</h3>
                </div>
                <div className="p-4 flex-1 overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-slate-400 text-xs uppercase tracking-wider border-b border-slate-100">
                        <th className="pb-3 font-bold">Student</th>
                        <th className="pb-3 font-bold text-right">Total Paid</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {analytics.topPayingStudents.slice(0, 5).map((student) => (
                        <tr key={student._id}>
                          <td className="py-3 font-bold text-slate-700">{student.student.name}</td>
                          <td className="py-3 text-right font-black text-emerald-600">₹{student.totalPaid.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* COLLECTION TAB */}
        {activeTab === "collection" && collectionSummary && (
          <div className="space-y-6">
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-wrap gap-4 items-end">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Month</label>
                <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="w-40 px-4 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-slate-50 font-medium text-slate-700 cursor-pointer">
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
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Year</label>
                <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className="w-32 px-4 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-slate-50 font-medium text-slate-700 cursor-pointer">
                  <option value="2023">2023</option>
                  <option value="2024">2024</option>
                  <option value="2025">2025</option>
                  <option value="2026">2026</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 text-center">
                <div className="w-12 h-12 mx-auto bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4"><Wallet size={20}/></div>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">Total Collection</p>
                <p className="text-3xl font-black text-slate-800 mt-1">₹{collectionSummary.summary.totalCollection?.toLocaleString() || 0}</p>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 text-center">
                <div className="w-12 h-12 mx-auto bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4"><FileText size={20}/></div>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">Total Transactions</p>
                <p className="text-3xl font-black text-slate-800 mt-1">{collectionSummary.summary.totalTransactions || 0}</p>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 text-center">
                <div className="w-12 h-12 mx-auto bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-4"><TrendingUp size={20}/></div>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">Avg Transaction</p>
                <p className="text-3xl font-black text-slate-800 mt-1">₹{Math.round(collectionSummary.summary.averageTransaction || 0).toLocaleString()}</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-6 border-b border-slate-100">
                <h3 className="font-bold text-slate-800 flex items-center gap-2"><CreditCard size={18} className="text-blue-600"/> Payment Method Breakdown</h3>
              </div>
              <div className="p-4 overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200">
                      <th className="p-4 font-bold">Method</th>
                      <th className="p-4 font-bold text-center">Transactions</th>
                      <th className="p-4 font-bold text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {collectionSummary.paymentBreakdown.map((pb) => (
                      <tr key={pb._id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-4 font-bold text-slate-700">{pb._id.replace("_", " ").toUpperCase()}</td>
                        <td className="p-4 text-center font-medium text-slate-600">{pb.count}</td>
                        <td className="p-4 text-right font-black text-slate-800">₹{pb.amount.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* DUES TAB */}
        {activeTab === "dues" && pendingDuesReport && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-red-50 p-6 rounded-2xl border border-red-100">
                <p className="text-sm font-bold text-red-800/60 uppercase tracking-wider flex items-center gap-2 mb-2"><AlertTriangle size={16}/> Total Due</p>
                <p className="text-4xl font-black text-red-700">₹{pendingDuesReport.totals.totalDue.toLocaleString()}</p>
              </div>
              <div className="bg-amber-50 p-6 rounded-2xl border border-amber-100">
                <p className="text-sm font-bold text-amber-800/60 uppercase tracking-wider flex items-center gap-2 mb-2"><Users size={16}/> Students in Arrears</p>
                <p className="text-4xl font-black text-amber-700">{pendingDuesReport.totals.studentsInArrears}</p>
              </div>
              <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
                <p className="text-sm font-bold text-blue-800/60 uppercase tracking-wider flex items-center gap-2 mb-2"><TrendingUp size={16}/> Average Due / Student</p>
                <p className="text-4xl font-black text-blue-700">₹{Math.round(pendingDuesReport.totals.averageDuePerStudent).toLocaleString()}</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-6 border-b border-slate-100">
                <h3 className="font-bold text-slate-800 flex items-center gap-2"><AlertCircle size={18} className="text-red-600"/> Top 10 Outstanding Dues</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200">
                      <th className="p-4 font-bold">Student</th>
                      <th className="p-4 font-bold text-center">Unpaid Periods</th>
                      <th className="p-4 font-bold text-right">Total Due</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {pendingDuesReport.studentDues.slice(0, 10).map((student) => (
                      <tr key={student.student._id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-4">
                          <p className="font-bold text-slate-800">{student.student.name}</p>
                          <p className="text-xs text-slate-500">{student.student.email}</p>
                        </td>
                        <td className="p-4 text-center font-bold text-amber-600 bg-amber-50/30">{student.payments.length}</td>
                        <td className="p-4 text-right font-black text-red-600">₹{student.totalDue.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* DISTRIBUTION TAB */}
        {activeTab === "distribution" && paymentDistribution && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {paymentDistribution.distribution.map((item) => (
                <div key={item._id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 text-center">
                  <h4 className={`text-xs font-bold uppercase tracking-wider mb-2 ${
                    item._id === 'paid' ? 'text-emerald-600' :
                    item._id === 'pending' ? 'text-amber-600' :
                    item._id === 'overdue' ? 'text-red-600' : 'text-blue-600'
                  }`}>{item._id.replace("_", " ")}</h4>
                  <p className="text-3xl font-black text-slate-800 mb-1">{item.percentage}%</p>
                  <p className="text-sm font-bold text-slate-400 mb-2">{item.count} records</p>
                  <div className="pt-3 border-t border-slate-100">
                    <p className="font-black text-slate-700">₹{item.totalAmount.toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-6 border-b border-slate-100">
                <h3 className="font-bold text-slate-800 flex items-center gap-2"><PieChart size={18} className="text-blue-600"/> Detailed Status Distribution</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200">
                      <th className="p-4 font-bold">Status</th>
                      <th className="p-4 font-bold text-center">Count</th>
                      <th className="p-4 font-bold text-center">Percentage</th>
                      <th className="p-4 font-bold text-right">Total Amount</th>
                      <th className="p-4 font-bold text-right">Pending Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paymentDistribution.distribution.map((item) => (
                      <tr key={item._id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-4 font-bold text-slate-700 uppercase">{item._id}</td>
                        <td className="p-4 text-center font-medium text-slate-600">{item.count}</td>
                        <td className="p-4 text-center font-bold text-slate-800">{item.percentage}%</td>
                        <td className="p-4 text-right font-black text-slate-800">₹{item.totalAmount.toLocaleString()}</td>
                        <td className="p-4 text-right font-black text-red-600">₹{item.totalAmountDue.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}

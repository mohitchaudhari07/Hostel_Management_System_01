import { useState, useEffect } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { 
  CreditCard, FileText, CheckCircle, AlertTriangle, RefreshCw, 
  Download, PieChart, ShieldAlert, BadgeIndianRupee, X,
  Smartphone, Building2, Banknote, HelpCircle
} from "lucide-react";

export default function MessPanel() {
  const [studentData, setStudentData] = useState(null);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const studentId = localStorage.getItem("studentId") || ""; 

  useEffect(() => {
    if (studentId) fetchMessData();
  }, [studentId]);

  const fetchMessData = async () => {
    try {
      setLoading(true);
      const [historyRes, invoicesRes] = await Promise.all([
        axios.get(`/payments/student/${studentId}/payment-history`),
        axios.get(`/invoices/student/${studentId}/invoices`)
      ]);

      setPaymentHistory(historyRes.data.payments);
      setStudentData({ name: historyRes.data.studentName, email: historyRes.data.studentEmail, stats: historyRes.data.stats });
      setInvoices(invoicesRes.data.invoices);
      setError("");
    } catch (err) {
      setError("Failed to load mess data");
    } finally { setLoading(false); }
  };

  const handleDownloadReceipt = (invoiceId) => alert(`Receipt download initiated for invoice: ${invoiceId}`);

  const handlePayOnline = () => {
    setShowPaymentModal(true);
  };

  const processOnlinePayment = async () => {
    alert("Redirecting to secure payment gateway...");
    setShowPaymentModal(false);
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'paid': return <span className="px-2.5 py-1 rounded-lg text-xs font-bold border bg-emerald-100 text-emerald-700 border-emerald-200">PAID</span>;
      case 'pending': return <span className="px-2.5 py-1 rounded-lg text-xs font-bold border bg-amber-100 text-amber-700 border-amber-200">PENDING</span>;
      case 'overdue': return <span className="px-2.5 py-1 rounded-lg text-xs font-bold border bg-red-100 text-red-700 border-red-200">OVERDUE</span>;
      case 'failed': return <span className="px-2.5 py-1 rounded-lg text-xs font-bold border bg-slate-200 text-slate-700 border-slate-300">FAILED</span>;
      default: return <span className="px-2.5 py-1 rounded-lg text-xs font-bold border bg-slate-100 text-slate-600 border-slate-200">{status}</span>;
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-200 shadow-sm">
      <RefreshCw className="animate-spin text-blue-600 mb-4" size={48} />
      <p className="text-slate-500 font-medium">Loading your mess portal...</p>
    </div>
  );

  return (
    <div className="font-sans space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <BadgeIndianRupee className="text-blue-600" /> Student Mess Portal
          </h2>
          <p className="text-slate-500 font-medium mt-1">Manage your mess fees, view invoices, and make payments</p>
        </div>
        <button onClick={fetchMessData} className="px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold rounded-xl transition-colors flex items-center justify-center gap-2 w-full md:w-auto">
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-xl font-bold flex items-center gap-2">
          <AlertTriangle size={18} /> {error}
        </div>
      )}

      {studentData && (
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 md:p-8 rounded-2xl shadow-lg shadow-blue-500/20 text-white flex justify-between items-center relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-blue-100 font-bold text-sm uppercase tracking-wider mb-1">Welcome back,</p>
            <h3 className="text-3xl font-black">{studentData.name}</h3>
            <p className="text-blue-200 font-medium">{studentData.email}</p>
          </div>
          <div className="absolute -right-6 -bottom-10 opacity-10 pointer-events-none">
            <PieChart size={200} />
          </div>
        </div>
      )}

      <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
        {[
          { id: "overview", label: "Overview", icon: PieChart },
          { id: "payments", label: "Payment History", icon: CreditCard },
          { id: "invoices", label: "Invoices", icon: FileText }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === tab.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <tab.icon size={18} /> {tab.label}
          </button>
        ))}
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
        
        {/* OVERVIEW TAB */}
        {activeTab === "overview" && studentData && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between">
                <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2"><BadgeIndianRupee size={16}/> Total Fees</p>
                <div>
                  <p className="text-3xl font-black text-slate-800">₹{studentData.stats.totalFees.toLocaleString()}</p>
                  <p className="text-xs font-bold text-slate-400 mt-1">All time assessed fees</p>
                </div>
              </div>

              <div className="bg-emerald-50 p-6 rounded-2xl shadow-sm border border-emerald-100 flex flex-col justify-between">
                <p className="text-sm font-bold text-emerald-600/70 uppercase tracking-wider mb-2 flex items-center gap-2"><CheckCircle size={16}/> Total Paid</p>
                <div>
                  <p className="text-3xl font-black text-emerald-700">₹{studentData.stats.totalPaid.toLocaleString()}</p>
                  <p className="text-xs font-bold text-emerald-600/50 mt-1">Successfully paid</p>
                </div>
              </div>

              <div className="bg-amber-50 p-6 rounded-2xl shadow-sm border border-amber-100 flex flex-col justify-between">
                <p className="text-sm font-bold text-amber-600/70 uppercase tracking-wider mb-2 flex items-center gap-2"><AlertTriangle size={16}/> Total Due</p>
                <div>
                  <p className="text-3xl font-black text-amber-700">₹{studentData.stats.totalDue.toLocaleString()}</p>
                  <p className="text-xs font-bold text-amber-600/50 mt-1">Pending payment</p>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between">
                <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2"><PieChart size={16}/> Payment Records</p>
                <div>
                  <p className="text-3xl font-black text-slate-800">{studentData.stats.paidCount} <span className="text-xl text-slate-400">/ {studentData.stats.paidCount + studentData.stats.pendingCount}</span></p>
                  <p className="text-xs font-bold text-slate-400 mt-1">Paid / Total Records</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white py-4 px-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                <div>
                  <p className="text-2xl font-black text-slate-800">{studentData.stats.paidCount}</p>
                  <p className="text-xs font-bold text-slate-500 uppercase">Paid</p>
                </div>
              </div>
              <div className="bg-white py-4 px-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                <div>
                  <p className="text-2xl font-black text-slate-800">{studentData.stats.pendingCount}</p>
                  <p className="text-xs font-bold text-slate-500 uppercase">Pending</p>
                </div>
              </div>
              <div className="bg-white py-4 px-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div>
                  <p className="text-2xl font-black text-slate-800">{studentData.stats.overdueCount}</p>
                  <p className="text-xs font-bold text-slate-500 uppercase">Overdue</p>
                </div>
              </div>
            </div>

            {studentData.stats.totalDue > 0 && (
              <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <ShieldAlert className="text-red-500 shrink-0 mt-1" size={24} />
                  <div>
                    <h4 className="font-black text-red-800 text-lg">Action Required: Outstanding Dues</h4>
                    <p className="text-red-700/80 font-medium">You have an outstanding balance of <span className="font-bold text-red-700">₹{studentData.stats.totalDue.toLocaleString()}</span>. Please clear your dues to avoid late fees.</p>
                  </div>
                </div>
                <button onClick={() => setActiveTab("payments")} className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-lg shadow-red-500/30 transition-all shrink-0">
                  Pay Now
                </button>
              </div>
            )}
          </div>
        )}

        {/* PAYMENTS TAB */}
        {activeTab === "payments" && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <h3 className="font-bold text-slate-800 flex items-center gap-2"><CreditCard size={18} className="text-blue-600"/> Payment History</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200">
                      <th className="p-4 font-bold">Period</th>
                      <th className="p-4 font-bold text-right">Fee (₹)</th>
                      <th className="p-4 font-bold text-right text-emerald-600">Paid (₹)</th>
                      <th className="p-4 font-bold text-right text-red-600">Due (₹)</th>
                      <th className="p-4 font-bold">Due Date</th>
                      <th className="p-4 font-bold text-center">Status</th>
                      <th className="p-4 font-bold">Method</th>
                      <th className="p-4 font-bold text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paymentHistory.length === 0 ? (
                      <tr><td colSpan="8" className="p-8 text-center text-slate-500">No payment history found.</td></tr>
                    ) : (
                      paymentHistory.map((payment) => (
                        <tr key={payment._id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="p-4 font-bold text-slate-700">{payment.messFeeId?.period || "N/A"}</td>
                          <td className="p-4 text-right font-black text-slate-800">₹{payment.amount}</td>
                          <td className="p-4 text-right font-black text-emerald-600">₹{payment.amountPaid}</td>
                          <td className="p-4 text-right font-black text-red-600">₹{payment.amountDue}</td>
                          <td className="p-4 font-medium text-slate-600">{new Date(payment.dueDate).toLocaleDateString()}</td>
                          <td className="p-4 text-center">{getStatusBadge(payment.paymentStatus)}</td>
                          <td className="p-4 font-medium text-slate-500 capitalize">{payment.paymentMethod || "-"}</td>
                          <td className="p-4 text-right">
                            {payment.paymentStatus !== "paid" && (
                              <button onClick={() => handlePayOnline(payment._id)} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs shadow-md shadow-blue-500/20 transition-all ml-auto">
                                Pay Now
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6">
              <h4 className="font-bold text-slate-800 flex items-center gap-2 mb-4"><HelpCircle size={18} className="text-slate-500"/> Supported Payment Methods</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-200">
                  <CreditCard className="text-blue-500" size={20}/><span className="font-bold text-sm text-slate-700">Online Card</span>
                </div>
                <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-200">
                  <Smartphone className="text-purple-500" size={20}/><span className="font-bold text-sm text-slate-700">UPI / Wallet</span>
                </div>
                <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-200">
                  <Building2 className="text-slate-500" size={20}/><span className="font-bold text-sm text-slate-700">Bank Transfer</span>
                </div>
                <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-200">
                  <Banknote className="text-emerald-500" size={20}/><span className="font-bold text-sm text-slate-700">Cash/Cheque</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* INVOICES TAB */}
        {activeTab === "invoices" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {invoices.length === 0 ? (
                <div className="col-span-full p-10 bg-white rounded-2xl border border-slate-200 text-center">
                  <FileText className="mx-auto text-slate-300 mb-3" size={48} />
                  <p className="font-bold text-slate-500">No invoices generated yet</p>
                </div>
              ) : (
                invoices.map((invoice) => (
                  <div key={invoice._id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                    <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                      <h4 className="font-black text-slate-800">{invoice.invoiceNumber}</h4>
                      {getStatusBadge(invoice.invoiceStatus)}
                    </div>
                    
                    <div className="p-5 flex-1 space-y-3">
                      <div className="flex justify-between items-center text-sm">
                        <span className="font-bold text-slate-500">Period</span>
                        <span className="font-bold text-slate-800">{new Date(invoice.periodFrom).toLocaleDateString()} - {new Date(invoice.periodTo).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="font-bold text-slate-500">Invoice Date</span>
                        <span className="font-bold text-slate-800">{new Date(invoice.invoiceDate).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="font-bold text-slate-500">Due Date</span>
                        <span className="font-bold text-red-600">{new Date(invoice.dueDate).toLocaleDateString()}</span>
                      </div>
                      
                      <div className="pt-3 mt-3 border-t border-slate-100 space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-slate-500 text-sm">Total Amount</span>
                          <span className="font-black text-slate-800">₹{invoice.totalAmount.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-slate-500 text-sm">Amount Paid</span>
                          <span className="font-black text-emerald-600">₹{invoice.amountPaid.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-slate-500 text-sm">Balance Due</span>
                          <span className="font-black text-red-600">₹{invoice.balanceDue.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 border-t border-slate-100 bg-slate-50 flex gap-3">
                      <button onClick={() => handleDownloadReceipt(invoice._id)} className="flex-1 py-2.5 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-colors flex items-center justify-center gap-2 text-sm">
                        <Download size={16}/> Download
                      </button>
                      {invoice.balanceDue > 0 && (
                        <button onClick={() => handlePayOnline(invoice._id)} className="flex-1 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 text-sm shadow-md shadow-blue-500/20">
                          <CreditCard size={16}/> Pay Now
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </motion.div>

      <AnimatePresence>
        {showPaymentModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h3 className="font-bold text-xl text-slate-800 flex items-center gap-2"><CreditCard className="text-blue-600"/> Secure Payment</h3>
                <button onClick={() => setShowPaymentModal(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
              </div>
              <div className="p-6">
                <p className="text-slate-500 font-medium mb-6 text-sm">Select your preferred secure payment method below to complete this transaction.</p>
                <div className="space-y-3">
                  <button onClick={processOnlinePayment} className="w-full flex items-center gap-4 p-4 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50 transition-colors text-left group">
                    <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform"><CreditCard size={20}/></div>
                    <div>
                      <p className="font-bold text-slate-800">Credit / Debit Card</p>
                      <p className="text-xs font-bold text-slate-400">Powered by Razorpay</p>
                    </div>
                  </button>
                  <button onClick={processOnlinePayment} className="w-full flex items-center gap-4 p-4 rounded-xl border border-slate-200 hover:border-purple-500 hover:bg-purple-50 transition-colors text-left group">
                    <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform"><Smartphone size={20}/></div>
                    <div>
                      <p className="font-bold text-slate-800">UPI</p>
                      <p className="text-xs font-bold text-slate-400">Google Pay, PhonePe, Paytm</p>
                    </div>
                  </button>
                  <button onClick={processOnlinePayment} className="w-full flex items-center gap-4 p-4 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50 transition-colors text-left group">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform"><Building2 size={20}/></div>
                    <div>
                      <p className="font-bold text-slate-800">Netbanking</p>
                      <p className="text-xs font-bold text-slate-400">All major banks supported</p>
                    </div>
                  </button>
                </div>
              </div>
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-center">
                <p className="text-xs font-bold text-slate-400 flex items-center gap-1">🔒 256-bit secure encrypted connection</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

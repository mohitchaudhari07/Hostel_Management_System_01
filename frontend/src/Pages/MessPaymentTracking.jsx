import { useState, useEffect } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { 
  CreditCard, Plus, Search, Filter, SortDesc, DollarSign,
  CheckCircle, AlertTriangle, Clock, Edit, X, Loader2
} from "lucide-react";

export default function MessPaymentTracking() {
  const [payments, setPayments] = useState([]);
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [, setError] = useState("");
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [filterStatus, setFilterStatus] = useState("all");
  const [searchStudent, setSearchStudent] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");

  const [formData, setFormData] = useState({
    studentId: "", messFeeId: "", amount: "", paymentMethod: "offline",
    paymentStatus: "pending", amountPaid: "", referenceNumber: "", notes: ""
  });

  useEffect(() => { fetchPayments(); }, []);

  useEffect(() => {
    let filtered = payments;
    if (filterStatus !== "all") filtered = filtered.filter((p) => p.paymentStatus === filterStatus);
    if (searchStudent) {
      filtered = filtered.filter((p) => p.studentId?.name?.toLowerCase().includes(searchStudent.toLowerCase()) || p.studentId?.email?.toLowerCase().includes(searchStudent.toLowerCase()));
    }
    filtered.sort((a, b) => {
      if (sortBy === "amountDue") return b.amountDue - a.amountDue;
      else if (sortBy === "dueDate") return new Date(a.dueDate) - new Date(b.dueDate);
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
    setFilteredPayments(filtered);
  }, [payments, filterStatus, searchStudent, sortBy]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/payments/payments");
      setPayments(response.data.payments);
      setError("");
    } catch (err) {
      setError("Failed to fetch payments");
    } finally { setLoading(false); }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.studentId || !formData.messFeeId) return setError("Please select student and fee");
    try {
      setLoading(true);
      if (editingId) {
        await axios.put(`/payments/payments/${editingId}`, {
          paymentStatus: formData.paymentStatus, amountPaid: parseFloat(formData.amountPaid), notes: formData.notes
        });
        alert("Payment updated successfully");
      } else {
        await axios.post("/payments/payments", {
          ...formData, amount: parseFloat(formData.amount), amountPaid: parseFloat(formData.amountPaid) || 0
        });
        alert("Payment record created successfully");
      }
      setFormData({ studentId: "", messFeeId: "", amount: "", paymentMethod: "offline", paymentStatus: "pending", amountPaid: "", referenceNumber: "", notes: "" });
      setShowPaymentForm(false);
      setEditingId(null);
      fetchPayments();
    } catch (err) {
      setError(err.response?.data?.message || "Error saving payment");
    } finally { setLoading(false); }
  };

  const handleEdit = (payment) => {
    setFormData({
      studentId: payment.studentId._id, messFeeId: payment.messFeeId._id, amount: payment.amount,
      paymentMethod: payment.paymentMethod, paymentStatus: payment.paymentStatus, amountPaid: payment.amountPaid,
      referenceNumber: payment.referenceNumber, notes: payment.notes
    });
    setEditingId(payment._id);
    setShowPaymentForm(true);
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

  return (
    <div className="font-sans space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <CreditCard className="text-blue-600" /> Payment Tracking
          </h2>
          <p className="text-slate-500 font-medium mt-1">Manage and track student fee payments</p>
        </div>
        <button 
          onClick={() => { setShowPaymentForm(!showPaymentForm); setEditingId(null); }} 
          className={`px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all ${showPaymentForm ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/30'}`}
        >
          {showPaymentForm ? <><X size={18} /> Cancel</> : <><Plus size={18} /> Record Payment</>}
        </button>
      </div>

      <AnimatePresence>
        {showPaymentForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200 mb-6">
              <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                {editingId ? <Edit className="text-amber-500"/> : <Plus className="text-emerald-500"/>}
                {editingId ? "Update Payment Record" : "Create New Payment Record"}
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Student ID (Temporary Text Input) *</label>
                    <input type="text" name="studentId" value={formData.studentId} onChange={handleInputChange} disabled={editingId !== null} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 font-medium text-slate-700" placeholder="Enter Student ID" required />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Fee ID (Temporary Text Input) *</label>
                    <input type="text" name="messFeeId" value={formData.messFeeId} onChange={handleInputChange} disabled={editingId !== null} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 font-medium text-slate-700" placeholder="Enter Fee ID" required />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Total Amount</label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                      <input type="number" name="amount" value={formData.amount} onChange={handleInputChange} disabled={editingId !== null} className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 font-black text-slate-800" min="0"/>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Amount Paid</label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                      <input type="number" name="amountPaid" value={formData.amountPaid} onChange={handleInputChange} className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white font-black text-emerald-600" min="0"/>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Method</label>
                    <select name="paymentMethod" value={formData.paymentMethod} onChange={handleInputChange} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-slate-50 font-bold text-slate-700">
                      <option value="offline">Offline</option><option value="online">Online</option><option value="cash">Cash</option><option value="cheque">Cheque</option><option value="upi">UPI</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Status</label>
                    <select name="paymentStatus" value={formData.paymentStatus} onChange={handleInputChange} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-slate-50 font-bold text-slate-700">
                      <option value="pending">Pending</option><option value="paid">Paid</option><option value="overdue">Overdue</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Ref Number</label>
                    <input type="text" name="referenceNumber" value={formData.referenceNumber} onChange={handleInputChange} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-slate-50 font-medium text-slate-700" placeholder="Txn ID/Cheque No" />
                  </div>
                </div>

                <div className="flex gap-4 pt-4 border-t border-slate-100">
                  <button type="submit" disabled={loading} className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-500/30 transition-all flex items-center justify-center gap-2 min-w-[150px]">
                    {loading ? <Loader2 size={18} className="animate-spin"/> : editingId ? "Update Payment" : "Create Record"}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 text-center">
          <p className="text-2xl font-black text-slate-800">{filteredPayments.length}</p>
          <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-wide">Total Records</p>
        </div>
        <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 text-center">
          <p className="text-2xl font-black text-emerald-700">{filteredPayments.filter(p => p.paymentStatus === 'paid').length}</p>
          <p className="text-xs font-bold text-emerald-600/70 mt-1 uppercase tracking-wide">Paid</p>
        </div>
        <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 text-center">
          <p className="text-2xl font-black text-amber-700">{filteredPayments.filter(p => p.paymentStatus === 'pending').length}</p>
          <p className="text-xs font-bold text-amber-600/70 mt-1 uppercase tracking-wide">Pending</p>
        </div>
        <div className="bg-red-50 p-4 rounded-2xl border border-red-100 text-center">
          <p className="text-2xl font-black text-red-700">{filteredPayments.filter(p => p.paymentStatus === 'overdue').length}</p>
          <p className="text-xs font-bold text-red-600/70 mt-1 uppercase tracking-wide">Overdue</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
          <input type="text" placeholder="Search student name..." value={searchStudent} onChange={(e) => setSearchStudent(e.target.value)} className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20 outline-none font-medium text-slate-700 bg-slate-50 focus:bg-white transition-colors" />
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16}/>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white font-bold text-slate-700 cursor-pointer outline-none">
              <option value="all">All Status</option><option value="paid">Paid</option><option value="pending">Pending</option><option value="overdue">Overdue</option>
            </select>
          </div>
          <div className="relative">
            <SortDesc className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16}/>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white font-bold text-slate-700 cursor-pointer outline-none">
              <option value="createdAt">Latest</option><option value="amountDue">Due Amount</option><option value="dueDate">Due Date</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200">
                <th className="p-4 font-bold">Student</th>
                <th className="p-4 font-bold">Period</th>
                <th className="p-4 font-bold text-right">Total (₹)</th>
                <th className="p-4 font-bold text-right text-emerald-600">Paid (₹)</th>
                <th className="p-4 font-bold text-right text-red-600">Due (₹)</th>
                <th className="p-4 font-bold text-center">Status</th>
                <th className="p-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPayments.length === 0 ? (
                <tr><td colSpan="7" className="p-8 text-center text-slate-500">No payment records found.</td></tr>
              ) : (
                filteredPayments.map((payment) => (
                  <motion.tr key={payment._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4">
                      <p className="font-bold text-slate-800">{payment.studentId?.name || "Unknown"}</p>
                      <p className="text-[10px] font-bold text-slate-400">{payment.studentId?.email || "N/A"}</p>
                    </td>
                    <td className="p-4 font-bold text-slate-600">{payment.messFeeId?.period || "N/A"}</td>
                    <td className="p-4 text-right font-black text-slate-800">₹{payment.amount}</td>
                    <td className="p-4 text-right font-black text-emerald-600">₹{payment.amountPaid}</td>
                    <td className="p-4 text-right font-black text-red-600">₹{payment.amountDue}</td>
                    <td className="p-4 text-center">{getStatusBadge(payment.paymentStatus)}</td>
                    <td className="p-4 text-right">
                      <button onClick={() => handleEdit(payment)} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs transition-colors flex items-center gap-1 ml-auto">
                        <Edit size={14}/> Edit
                      </button>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

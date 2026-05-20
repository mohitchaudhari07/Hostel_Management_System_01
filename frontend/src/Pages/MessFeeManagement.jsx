import { useState, useEffect } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Receipt, Plus, Calendar, DollarSign, Tag, Users, FileText, 
  Trash2, Edit, X, Loader2, Info
} from "lucide-react";

export default function MessFeeManagement() {
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

  useEffect(() => {
    fetchFees();
  }, []);

  const fetchFees = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/mess/fees");
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
    setFormData(prev => ({ ...prev, [name]: value }));
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
        await axios.put(`/mess/fees/${editingId}`, formData);
        alert("Fee updated successfully");
      } else {
        await axios.post("/mess/fees", formData);
        alert("Fee created successfully");
      }

      setFormData({
        feeType: "monthly", period: "", feeAmount: "", feeCategory: "combined",
        applicableToRoomType: "all", dueDate: "", lateFeePercentage: "0",
        description: "", notes: ""
      });
      setShowForm(false);
      setEditingId(null);
      fetchFees();
    } catch (err) {
      setError(err.response?.data?.message || "Error saving fee");
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
      applicableToRoomType: Array.isArray(fee.applicableToRoomType) ? fee.applicableToRoomType[0] : fee.applicableToRoomType,
      dueDate: new Date(fee.dueDate).toISOString().split("T")[0],
      lateFeePercentage: fee.lateFeePercentage,
      description: fee.description,
      notes: fee.notes
    });
    setEditingId(fee._id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this fee structure?")) {
      try {
        await axios.delete(`/mess/fees/${id}`);
        fetchFees();
      } catch (err) {
        alert("Failed to delete fee");
      }
    }
  };

  return (
    <div className="font-sans space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Receipt className="text-blue-600" /> Fee Structures
          </h2>
          <p className="text-slate-500 font-medium mt-1">Manage recurring and one-time mess fees</p>
        </div>
        <button 
          onClick={() => { setShowForm(!showForm); setEditingId(null); }} 
          className={`px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all ${showForm ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/30'}`}
        >
          {showForm ? <><X size={18} /> Cancel</> : <><Plus size={18} /> Create New Fee</>}
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-xl font-bold flex items-center gap-2">
          <Info size={18} /> {error}
        </div>
      )}

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200 mb-6">
              <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                {editingId ? <Edit className="text-amber-500"/> : <Plus className="text-emerald-500"/>}
                {editingId ? "Edit Fee Structure" : "Create New Fee Structure"}
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Fee Type</label>
                    <select name="feeType" value={formData.feeType} onChange={handleInputChange} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-slate-50 font-bold text-slate-700">
                      <option value="monthly">Monthly</option>
                      <option value="semester">Semester</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Period Name *</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                      <input type="text" name="period" value={formData.period} onChange={handleInputChange} placeholder="e.g. Feb 2025" required className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-slate-50 font-medium text-slate-700" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Amount (₹) *</label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                      <input type="number" name="feeAmount" value={formData.feeAmount} onChange={handleInputChange} min="0" required className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-slate-50 font-black text-slate-800" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Category</label>
                    <div className="relative">
                      <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                      <select name="feeCategory" value={formData.feeCategory} onChange={handleInputChange} className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-slate-50 font-bold text-slate-700">
                        <option value="meals">Meals Only</option>
                        <option value="maintenance">Maintenance</option>
                        <option value="utilities">Utilities</option>
                        <option value="combined">Combined</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Applicable To</label>
                    <div className="relative">
                      <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                      <select name="applicableToRoomType" value={formData.applicableToRoomType} onChange={handleInputChange} className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-slate-50 font-bold text-slate-700">
                        <option value="all">All Students</option>
                        <option value="Single">Single Rooms</option>
                        <option value="Double">Double Rooms</option>
                        <option value="Triple">Triple Rooms</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Due Date *</label>
                    <input type="date" name="dueDate" value={formData.dueDate} onChange={handleInputChange} required className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-slate-50 font-medium text-slate-700" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Late Fee (%)</label>
                    <input type="number" name="lateFeePercentage" value={formData.lateFeePercentage} onChange={handleInputChange} min="0" max="100" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-slate-50 font-medium text-slate-700" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Short Description</label>
                    <input type="text" name="description" value={formData.description} onChange={handleInputChange} placeholder="e.g. Base mess fee for Spring" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-slate-50 font-medium text-slate-700" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Internal Notes</label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-4 text-slate-400" size={18}/>
                    <textarea name="notes" value={formData.notes} onChange={handleInputChange} placeholder="Any administrative notes..." rows="3" className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-slate-50 font-medium text-slate-700 resize-none"></textarea>
                  </div>
                </div>

                <div className="flex gap-4 pt-4 border-t border-slate-100">
                  <button type="submit" disabled={loading} className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-500/30 transition-all flex items-center justify-center gap-2 min-w-[150px]">
                    {loading ? <Loader2 size={18} className="animate-spin"/> : editingId ? "Update Fee" : "Create Fee"}
                  </button>
                  <button type="button" onClick={() => { setShowForm(false); setEditingId(null); }} className="px-6 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {loading && !showForm ? (
          <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-blue-600" size={32}/></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200">
                  <th className="p-4 font-bold">Period</th>
                  <th className="p-4 font-bold">Category</th>
                  <th className="p-4 font-bold text-right">Amount (₹)</th>
                  <th className="p-4 font-bold">Due Date</th>
                  <th className="p-4 font-bold text-center">Status</th>
                  <th className="p-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {fees.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="p-8 text-center text-slate-500">No fee structures found.</td>
                  </tr>
                ) : (
                  fees.map((fee) => (
                    <motion.tr key={fee._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4">
                        <p className="font-bold text-slate-800">{fee.period}</p>
                        <p className="text-xs font-bold text-slate-400 uppercase">{fee.feeType}</p>
                      </td>
                      <td className="p-4 font-medium text-slate-600 capitalize">{fee.feeCategory}</td>
                      <td className="p-4 text-right font-black text-slate-800">₹{fee.feeAmount.toLocaleString()}</td>
                      <td className="p-4 font-medium text-slate-600">{new Date(fee.dueDate).toLocaleDateString()}</td>
                      <td className="p-4 text-center">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${fee.isActive ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                          {fee.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => handleEdit(fee)} className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"><Edit size={16}/></button>
                          <button onClick={() => handleDelete(fee._id)} className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors"><Trash2 size={16}/></button>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

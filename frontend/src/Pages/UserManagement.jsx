import { useState, useEffect } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Plus, Shield, Mail, Key, UserCheck, Search, Loader2, X, ChefHat, UserCircle } from "lucide-react";

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
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
      const response = await axios.get("/auth/users");
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
    if (!formData.name || !formData.email || !formData.password) return alert("Please fill in all required fields");

    try {
      setIsSubmitting(true);
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      if (!user.id || user.role !== "admin") return alert("Unauthorized access");

      await axios.post("/auth/create-user", formData, {
        headers: { "x-user-id": user.id, "x-user-role": user.role }
      });

      alert("🎉 User created successfully!");
      setFormData({ name: "", email: "", password: "", role: "student" });
      setShowCreateForm(false);
      fetchUsers();
    } catch (error) {
      alert("Error creating user: " + (error.response?.data?.message || "Unknown error"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (userId, email) => {
    const newPassword = prompt(`Enter new password for ${email}:`);
    if (!newPassword) return;

    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      await axios.post("/auth/reset-password", { email, newPassword }, {
        headers: { "x-user-id": user.id, "x-user-role": user.role }
      });
      alert("✅ Password reset successfully!");
    } catch (error) {
      alert("Error resetting password: " + (error.response?.data?.message || "Unknown error"));
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case "admin": return <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-max"><Shield size={14}/> Admin</span>;
      case "mess_staff": return <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-max"><ChefHat size={14}/> Mess Staff</span>;
      case "student": return <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-max"><UserCircle size={14}/> Student</span>;
      default: return <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-xs font-bold w-max">{role}</span>;
    }
  };

  const filteredUsers = users.filter(u => u.name.toLowerCase().includes(searchTerm.toLowerCase()) || u.email.toLowerCase().includes(searchTerm.toLowerCase()));

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-200 shadow-sm">
      <Loader2 className="animate-spin text-blue-600 mb-4" size={48} />
      <p className="text-slate-500 font-medium">Loading users...</p>
    </div>
  );

  return (
    <div className="font-sans space-y-6">
     

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 text-center">
          <p className="text-3xl font-black text-slate-800">{users.length}</p>
          <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-wide">Total Users</p>
        </div>
        <div className="bg-blue-50 p-4 rounded-2xl shadow-sm border border-blue-100 text-center">
          <p className="text-3xl font-black text-blue-700">{users.filter(u => u.role === 'student').length}</p>
          <p className="text-xs font-bold text-blue-400 mt-1 uppercase tracking-wide">Students</p>
        </div>
        <div className="bg-amber-50 p-4 rounded-2xl shadow-sm border border-amber-100 text-center">
          <p className="text-3xl font-black text-amber-700">{users.filter(u => u.role === 'mess_staff').length}</p>
          <p className="text-xs font-bold text-amber-400 mt-1 uppercase tracking-wide">Mess Staff</p>
        </div>
        <div className="bg-red-50 p-4 rounded-2xl shadow-sm border border-red-100 text-center">
          <p className="text-3xl font-black text-red-700">{users.filter(u => u.role === 'admin').length}</p>
          <p className="text-xs font-bold text-red-400 mt-1 uppercase tracking-wide">Admins</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input type="text" placeholder="Search by name or email..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium text-slate-700 bg-slate-50 focus:bg-white transition-colors" />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider">
                <th className="p-4 font-bold">User</th>
                <th className="p-4 font-bold">Role</th>
                <th className="p-4 font-bold hidden sm:table-cell">Created Date</th>
                <th className="p-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="4" className="p-8 text-center text-slate-500">No users found.</td>
                </tr>
              ) : (
                filteredUsers.map(user => (
                  <motion.tr key={user._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center text-slate-600 font-bold shadow-sm">
                          {user.name.substring(0,2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">{user.name}</p>
                          <p className="text-xs text-slate-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">{getRoleBadge(user.role)}</td>
                    <td className="p-4 hidden sm:table-cell text-sm font-medium text-slate-600">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-right">
                      <button onClick={() => handleResetPassword(user._id, user.email)} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs transition-colors flex items-center gap-1 ml-auto">
                        <Key size={14}/> Reset Password
                      </button>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {showCreateForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-white p-8 rounded-2xl w-full max-w-md shadow-2xl overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <UserCheck className="text-blue-600" /> Create New User
                </h3>
                <button onClick={() => setShowCreateForm(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleCreateUser} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Full Name</label>
                  <div className="relative">
                    <UserCircle className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-slate-50 focus:bg-white transition-colors" placeholder="e.g. John Doe" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} required className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-slate-50 focus:bg-white transition-colors" placeholder="e.g. john@university.edu" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Password</label>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input type="password" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} required minLength={6} className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-slate-50 focus:bg-white transition-colors" placeholder="Minimum 6 characters" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Account Role</label>
                  <select value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-bold text-slate-700 bg-slate-50 cursor-pointer">
                    <option value="student">Student</option>
                    <option value="mess_staff">Mess Staff</option>
                    <option value="admin">System Admin</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-6 border-t border-slate-100">
                  <button type="submit" disabled={isSubmitting} className="flex-1 bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/30 disabled:opacity-50 flex justify-center items-center gap-2">
                    {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : "Create Account"}
                  </button>
                  <button type="button" onClick={() => setShowCreateForm(false)} className="flex-1 bg-slate-100 text-slate-700 font-bold py-3 rounded-xl hover:bg-slate-200 transition-colors">Cancel</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Mail,
  Lock,
  User,
  Shield,
  ArrowRight,
  Loader2,
  Info,
} from "lucide-react";

export default function AdminRegister() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    adminCode: "", // simple security code to prevent anyone from registering
  });
  const [message, setMessage] = useState({ text: "", type: "" });
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // In a real application, you might validate this against the backend
  const SECRET_ADMIN_CODE = "hostel_admin_2026";

  const handleRegister = async (e) => {
    e.preventDefault();

    if (formData.adminCode !== SECRET_ADMIN_CODE) {
      setMessage({ text: "Invalid admin authorization code.", type: "error" });
      return;
    }

    setIsLoading(true);
    setMessage({ text: "", type: "" });

    try {
      const res = await axios.post(
        "/auth/create-user",
        {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: "admin",
        },
      );

      // Auto-login after registration
      if (res.data.token) {
        localStorage.setItem("token", res.data.token);
      }
      localStorage.setItem("user", JSON.stringify(res.data.user));
      setMessage({
        text: "Admin registration successful! Redirecting to dashboard...",
        type: "success",
      });

      setTimeout(() => {
        navigate("/admin");
      }, 1500);
    } catch (error) {
      setMessage({
        text:
          error.response?.data?.message ||
          "Registration failed. Please try again.",
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans">
      <div className="flex-1 flex items-center justify-center p-6 md:p-12 relative z-10">
        <div className="absolute top-6 left-6 flex gap-4">
          <button
            onClick={() => navigate("/register")}
            className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors px-3 py-2 rounded-lg hover:bg-slate-100"
          >
            Student?{" "}
            <span className="text-indigo-600 font-semibold ml-1">
              Apply here
            </span>
          </button>
          <button
            onClick={() => navigate("/login")}
            className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
          >
            Already an admin?{" "}
            <span className="text-indigo-600 font-semibold ml-1">
              Login here
            </span>
          </button>
        </div>

        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full max-w-md"
        >
          <div className="mb-8 text-center md:text-left md:hidden flex items-center justify-center gap-3">
            <div className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-md">
              H
            </div>
            <span className="text-2xl font-bold text-slate-800">HostelHub</span>
          </div>

          <div className="flex items-center gap-3 mb-2">
            <Shield className="text-indigo-600" size={28} />
            <h2 className="text-3xl font-bold text-slate-900">Admin Portal</h2>
          </div>
          <p className="text-slate-500 mb-8">
            Register a new administrator account.
          </p>

          <form onSubmit={handleRegister} className="space-y-4">
            <div className="relative">
              <User
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                size={20}
              />
              <input
                type="text"
                name="name"
                placeholder="Full Name"
                value={formData.name}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400 text-slate-700"
                required
              />
            </div>

            <div className="relative">
              <Mail
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                size={20}
              />
              <input
                type="email"
                name="email"
                placeholder="Email Address"
                value={formData.email}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400 text-slate-700"
                required
              />
            </div>

            <div className="relative">
              <Lock
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                size={20}
              />
              <input
                type="password"
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400 text-slate-700"
                required
              />
            </div>

            <div className="relative">
              <Shield
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                size={20}
              />
              <input
                type="password"
                name="adminCode"
                placeholder="Admin Authorization Code"
                value={formData.adminCode}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400 text-slate-700"
                required
              />
            </div>
            <p className="text-xs text-slate-400 ml-1">
              Use 'hostel_admin_2026' for demonstration purposes.
            </p>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3.5 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-slate-900/20 mt-6"
            >
              {isLoading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  Create Admin Account
                  <ArrowRight
                    size={18}
                    className="group-hover:translate-x-1 transition-transform"
                  />
                </>
              )}
            </button>

            {message.text && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-4 rounded-xl text-sm font-medium mt-4 text-center border ${message.type === "success"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-red-50 text-red-700 border-red-200"
                  }`}
              >
                {message.text}
              </motion.div>
            )}
          </form>
        </motion.div>
      </div>

      {/* Right side - Branding */}
      <div className="relative hidden md:flex flex-1 flex-col justify-between p-12 bg-slate-900 overflow-hidden text-white">
        <div className="absolute inset-0 bg-gradient-to-bl from-slate-900 via-slate-800 to-indigo-950" />
        <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 -translate-x-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl translate-y-1/2 translate-x-1/2" />

        <div className="relative z-10 flex justify-end">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-2xl shadow-lg">
              H
            </div>
            <span className="text-2xl font-bold tracking-tight">HostelHub</span>
          </div>
        </div>

        <div className="relative z-10 text-right">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="max-w-md ml-auto"
          >
            <h1 className="text-4xl font-bold mb-4 leading-tight">
              Control Center.
              <br />
              Total Management.
            </h1>
            <p className="text-slate-400 text-lg leading-relaxed">
              Create an administrative account to oversee operations, manage
              students, handle fees, and control the mess facility.
            </p>
          </motion.div>
        </div>

        <div className="relative z-10 text-sm text-slate-500 text-right">
          Secure Administration Portal &bull; v2.0
        </div>
      </div>
    </div>
  );
}

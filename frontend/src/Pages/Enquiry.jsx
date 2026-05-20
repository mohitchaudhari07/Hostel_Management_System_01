import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Building2,
  Mail,
  Phone,
  User,
  BookOpen,
  ArrowRight,
  Loader2,
} from "lucide-react";

export default function Enquiry() {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    course: "",
    preferredRoomType: "",
  });
  const [status, setStatus] = useState({ type: "", message: "" });
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (Object.values(formData).some((val) => !val)) {
      setStatus({ type: "error", message: "Please fill all fields" });
      return;
    }

    setIsLoading(true);
    try {
      const res = await axios.post("/enquiries", formData);
      if (res.status === 201 || res.data?._id) {
        setStatus({
          type: "success",
          message: "Enquiry submitted! Redirecting...",
        });
        setFormData({
          name: "",
          phone: "",
          email: "",
          course: "",
          preferredRoomType: "",
        });
        setTimeout(() => navigate("/login?enquiry=submitted"), 1500);
      } else {
        setStatus({ type: "error", message: "Submission failed. Try again." });
      }
    } catch (error) {
      setStatus({
        type: "error",
        message: error.response?.data?.message || "Error submitting enquiry",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans">
      {/* Left side - Branding */}
      <div className="relative hidden md:flex flex-1 flex-col justify-between p-12 bg-blue-600 overflow-hidden text-white">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-indigo-700 to-slate-900" />
        {/* Abstract decorative elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-blue-600 font-bold text-2xl shadow-lg">
              H
            </div>
            <span className="text-2xl font-bold tracking-tight">HostelHub</span>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="max-w-md"
          >
            <h1 className="text-5xl font-bold mb-6 leading-tight">
              Your home <br />
              away from home.
            </h1>
            <p className="text-blue-100 text-lg leading-relaxed">
              Experience premium student living with our smart hostel management
              system. Join thousands of students who trust us for their
              comfortable stay.
            </p>
          </motion.div>
        </div>

        <div className="relative z-10 text-sm text-blue-200">
          &copy; {new Date().getFullYear()} HostelHub. All rights reserved.
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12 relative">
        <div className="absolute top-6 right-6 flex gap-4">
          <button
            onClick={() => navigate("/admin/register")}
            className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors px-3 py-2 rounded-lg hover:bg-slate-100"
          >
            Admin?{" "}
            <span className="text-blue-600 font-semibold ml-1">Register</span>
          </button>
          <button
            onClick={() => navigate("/login")}
            className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
          >
            Already registered?{" "}
            <span className="text-blue-600 font-semibold ml-1">Log in</span>
          </button>
        </div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full max-w-md"
        >
          <div className="mb-8 text-center md:text-left md:hidden flex items-center justify-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-md">
              H
            </div>
            <span className="text-2xl font-bold text-slate-800">HostelHub</span>
          </div>

          <h2 className="text-3xl font-bold text-slate-900 mb-2">
            Apply for Hostel
          </h2>
          <p className="text-slate-500 mb-8">
            Fill in your details and we'll get back to you with room
            availability.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
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
                className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400 text-slate-700"
              />
            </div>

            <div className="relative">
              <Phone
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                size={20}
              />
              <input
                type="tel"
                name="phone"
                placeholder="Phone Number"
                value={formData.phone}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400 text-slate-700"
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
                className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400 text-slate-700"
              />
            </div>

            <div className="relative">
              <BookOpen
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                size={20}
              />
              <input
                type="text"
                name="course"
                placeholder="Course Enrolled In"
                value={formData.course}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400 text-slate-700"
              />
            </div>

            <div className="relative">
              <Building2
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                size={20}
              />
              <select
                name="preferredRoomType"
                value={formData.preferredRoomType}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all appearance-none text-slate-700"
              >
                <option value="" disabled className="text-slate-400">
                  Select Room Type
                </option>
                <option value="Single">Single Room</option>
                <option value="Double">Double Shared</option>
                <option value="Triple">Triple Shared</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-blue-500/25 mt-6"
            >
              {isLoading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  Submit Application
                  <ArrowRight
                    size={18}
                    className="group-hover:translate-x-1 transition-transform"
                  />
                </>
              )}
            </button>

            {status.message && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-4 rounded-xl text-sm font-medium ${status.type === "success"
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-red-50 text-red-700 border border-red-200"
                  }`}
              >
                {status.message}
              </motion.div>
            )}
          </form>
        </motion.div>
      </div>
    </div>
  );
}

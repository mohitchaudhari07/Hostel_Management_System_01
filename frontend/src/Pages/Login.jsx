import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Mail,
  Lock,
  ArrowRight,
  Loader2,
  Info,
  Shield,
  Users,
} from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [info, setInfo] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loginType, setLoginType] = useState("student"); // 'admin' or 'student'

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const justSubmitted = searchParams.get("enquiry") === "submitted";
    if (justSubmitted) {
      setInfo(
        "Application received. The admin will activate your account and share your login credentials via email.",
      );
    }
  }, [searchParams]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");

    try {
      const res = await axios.post("/auth/login", {
        email,
        password,
        loginType,
      });
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      const role = res.data.user.role;
      if (role === "admin") navigate("/admin");
      else if (role === "student") navigate("/student");
      else if (role === "mess") navigate("/mess");
      else if (role === "mess_staff") navigate("/mess-staff");
      else navigate("/");
    } catch (error) {
      const serverMsg = error.response?.data?.message;
      if (serverMsg === "Invalid email") {
        setMessage(
          "Account not found. If you just registered, please wait for admin approval.",
        );
      } else if (serverMsg === "Access denied") {
        setMessage(
          `You don't have access to ${loginType} login. Please use the correct login type.`,
        );
      } else {
        setMessage(serverMsg || "Invalid credentials. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans">
      {/* Left side - Form */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12 relative z-10">
        <div className="absolute top-6 left-6 flex gap-4">
          <button
            onClick={() => navigate("/register")}
            className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors px-3 py-2 rounded-lg hover:bg-slate-100"
          >
            New student?{" "}
            <span className="text-indigo-600 font-semibold ml-1">
              Apply here
            </span>
          </button>
          <button
            onClick={() => navigate("/admin/register")}
            className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors px-3 py-2 rounded-lg hover:bg-slate-100"
          >
            New admin?{" "}
            <span className="text-indigo-600 font-semibold ml-1">
              Register here
            </span>
          </button>
        </div>

        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full max-w-md"
        >
          <div className="mb-8 text-center md:text-left md:hidden flex items-center justify-center gap-3">
            <img
              className="w-20"
              src="https://res.cloudinary.com/dqgfgmkkc/image/upload/v1778815679/hostelsync.png"
              alt="HostelSync"
            />
            <span className="text-2xl font-bold text-slate-800">
              HostelSync
            </span>
          </div>

          <h2 className="text-3xl font-bold text-slate-900 mb-2">
            Welcome Back
          </h2>
          <p className="text-slate-500 mb-6">
            Log in to manage your hostel stay and view updates.
          </p>

          {/* Login Type Selector */}
          <div className="mb-6 flex gap-3">
            <motion.button
              type="button"
              onClick={() => setLoginType("student")}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                loginType === "student"
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              <Users size={18} />
              Student
            </motion.button>
            <motion.button
              type="button"
              onClick={() => setLoginType("admin")}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                loginType === "admin"
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              <Shield size={18} />
              Admin
            </motion.button>
          </div>

          {info && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-indigo-50 border border-indigo-100 rounded-xl flex items-start gap-3 text-indigo-700 text-sm"
            >
              <Info className="shrink-0 mt-0.5" size={18} />
              <p>{info}</p>
            </motion.div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="relative">
              <Mail
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                size={20}
              />
              <input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400 text-slate-700"
                required
              />
            </div>

            <div className="flex justify-end pt-1">
              <a
                href="#"
                className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
              >
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3.5 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-slate-900/20 mt-6"
            >
              {isLoading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  Sign In as{" "}
                  {loginType.charAt(0).toUpperCase() + loginType.slice(1)}
                  <ArrowRight
                    size={18}
                    className="group-hover:translate-x-1 transition-transform"
                  />
                </>
              )}
            </button>

            {message && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-xl text-sm font-medium bg-red-50 text-red-700 border border-red-200 mt-4 text-center"
              >
                {message}
              </motion.div>
            )}
          </form>
        </motion.div>
      </div>

      {/* Right side - Branding */}
      <div className="relative hidden md:flex flex-1 flex-col justify-between p-12 bg-slate-900 overflow-hidden text-white">
        <div className="absolute inset-0 bg-gradient-to-bl from-slate-900 via-slate-800 to-indigo-950" />
        {/* Abstract decorative elements */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 -translate-x-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl translate-y-1/2 translate-x-1/2" />

        <div className="relative z-10 flex justify-end">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-2xl shadow-lg">
              H
            </div>
            <span className="text-2xl font-bold tracking-tight">HostelSync</span>
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
              Smart Management.
              <br />
              Better Living.
            </h1>
            <p className="text-slate-400 text-lg leading-relaxed">
              Access your digital dashboard to view room details, pay fees
              securely, and manage daily meals.
            </p>
          </motion.div>
        </div>

        <div className="relative z-10 text-sm text-slate-500 text-right">
          Secure Login Portal &bull; v2.0
        </div>
      </div>
    </div>
  );
}

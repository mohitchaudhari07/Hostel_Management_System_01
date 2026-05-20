import { useState, useEffect } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Mail,
  BedDouble,
  GraduationCap,
  Users,
  Camera,
  ScanFace,
  BarChart,
  Utensils,
  Settings,
  AlertCircle,
  Loader2,
  Building,
  CheckCircle,
  Sparkles,
} from "lucide-react";
import MessSmartAdmin from "./MessSmartAdmin";
import DashboardLayout from "../components/layout/DashboardLayout";
import AdminEnquiries from "./AdminEnquiries";
import RoomManagement from "./RoomManagement";
import StudentManagement from "./StudentManagement";
import FaceRegistration from "./FaceRegistration";
import FaceAttendance from "./FaceAttendance";
import AttendanceAnalytics from "./AttendanceAnalytics";
import MessDashboard from "./MessDashboard";
import MessAdminPanel from "./MessAdminPanel";
import UserManagement from "./UserManagement";
import AdminComplaints from "./AdminComplaints";

export default function AdminDashboard() {
  const [activePage, setActivePage] = useState("dashboard");
  const [stats, setStats] = useState({
    totalEnquiries: 0,
    newEnquiries: 0,
    approvedStudents: 0,
    availableRooms: 0,
    totalRooms: 0,
    occupiedRooms: 0,
    unreadComplaints: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    if (activePage === "dashboard") {
      fetchDashboardStats();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePage]);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const [enquiriesRes, roomsRes, studentsRes, complaintsRes] =
        await Promise.all([
          axios.get("/enquiries"),
          axios.get("/rooms"),
          axios.get("/auth/students"),
          axios
            .get("/complaints/unread-count", {
              headers: { "x-user-id": user.id, "x-user-role": user.role },
            })
            .catch(() => ({ data: { count: 0 } })),
        ]);

      const enquiries = enquiriesRes.data;
      const rooms = roomsRes.data;
      const students = studentsRes.data;

      const totalEnquiries = enquiries.length;
      const newEnquiries = enquiries.filter(
        (enq) => enq.status === "New",
      ).length;
      const approvedStudents = students.filter(
        (student) => student.isRoomAssigned,
      ).length;
      const availableRooms = rooms.filter(
        (room) => room.availableBeds > 0,
      ).length;
      const totalRooms = rooms.length;
      const occupiedRooms = totalRooms - availableRooms;
      const unreadComplaints = complaintsRes.data.count || 0;

      setStats({
        totalEnquiries,
        newEnquiries,
        approvedStudents,
        availableRooms,
        totalRooms,
        occupiedRooms,
        unreadComplaints,
      });
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      setError("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "enquiries", label: "Enquiries", icon: Mail },
    { id: "rooms", label: "Rooms", icon: BedDouble },
    { id: "students", label: "Students", icon: GraduationCap },
    { id: "users", label: "User Management", icon: Users },
    { id: "face-registration", label: "Face Registration", icon: Camera },
    { id: "face-attendance", label: "Face Attendance", icon: ScanFace },
    { id: "analytics", label: "Attendance Analytics", icon: BarChart },
    {
      id: "complaints",
      label: "Complaints",
      icon: AlertCircle,
      badge: stats.unreadComplaints > 0 ? stats.unreadComplaints : null,
    },
    { id: "mess", label: "Mess Dashboard", icon: Utensils },
    { id: "mess-management", label: "Mess Management", icon: Settings },
    { id: "mess-ai", label: "Mess AI Analytics", icon: Sparkles },
  ];

  const renderContent = () => {
    switch (activePage) {
      case "enquiries":
        return <AdminEnquiries />;
      case "rooms":
        return <RoomManagement />;
      case "students":
        return <StudentManagement />;
      case "users":
        return <UserManagement />;
      case "face-registration":
        return <FaceRegistration />;
      case "face-attendance":
        return <FaceAttendance />;
      case "analytics":
        return <AttendanceAnalytics />;
      case "complaints":
        return <AdminComplaints />;
      case "mess":
        return <MessDashboard />;
      case "mess-management":
        return <MessAdminPanel />;
      case "mess-ai":
        return <MessSmartAdmin embedded />;
      default: {
        if (loading) {
          return (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-200 shadow-sm">
              <Loader2 className="animate-spin text-blue-600 mb-4" size={48} />
              <p className="text-slate-500 font-medium">
                Loading dashboard data...
              </p>
            </div>
          );
        }

        if (error) {
          return (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-red-200 shadow-sm text-center">
              <AlertCircle className="text-red-500 mb-4" size={64} />
              <h3 className="text-2xl font-bold text-slate-800 mb-2">
                Failed to Load Data
              </h3>
              <p className="text-slate-500 mb-6">{error}</p>
              <button
                onClick={fetchDashboardStats}
                className="px-6 py-3 bg-red-50 text-red-700 font-bold rounded-xl hover:bg-red-100 transition-colors"
              >
                Retry Request
              </button>
            </div>
          );
        }

        const occupancyRate =
          stats.totalRooms > 0
            ? Math.round((stats.occupiedRooms / stats.totalRooms) * 100)
            : 0;
        const highlightCards = [
          {
            label: "New Enquiries",
            value: stats.newEnquiries,
            desc: "Pending review",
            icon: Mail,
            accent: "from-amber-500 via-orange-500 to-rose-500",
          },
          {
            label: "Available Rooms",
            value: stats.availableRooms,
            desc: `Out of ${stats.totalRooms} total`,
            icon: BedDouble,
            accent: "from-indigo-500 via-violet-500 to-fuchsia-500",
          },
          {
            label: "Unread Complaints",
            value: stats.unreadComplaints,
            desc: "Needs attention",
            icon: AlertCircle,
            accent: "from-emerald-500 via-cyan-500 to-blue-500",
          },
        ];

        return (
          <div className="space-y-6">
            <div className="grid gap-6 xl:grid-cols-[1.55fr_0.95fr]">
              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-950 via-blue-900 to-cyan-600 text-white shadow-[0_30px_80px_rgba(15,23,42,0.18)]"
              >
                <div className="absolute -right-24 -top-24 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
                <div className="absolute left-0 top-0 h-full w-full bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.2),_transparent_28%)]" />
                <div className="relative p-8 sm:p-10 lg:p-12">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="max-w-2xl">
                      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-200/75">
                        Admin command center
                      </p>
                      <h2 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
                        Hostel operations in one beautiful view
                      </h2>
                      <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-200/85">
                        Stay ahead of occupancy, enquiries, attendance and mess
                        status with a polished dashboard designed for fast
                        decisions.
                      </p>
                    </div>
                    <div className="rounded-3xl bg-white/10 px-4 py-3 text-sm font-semibold text-white ring-1 ring-white/20 backdrop-blur-sm">
                      Live summary
                    </div>
                  </div>

                  <div className="mt-10 grid gap-4 sm:grid-cols-3">
                    {[
                      {
                        label: "Total Enquiries",
                        value: stats.totalEnquiries,
                        icon: BarChart,
                      },
                      {
                        label: "Allocated Rooms",
                        value: stats.approvedStudents,
                        icon: CheckCircle,
                      },
                      {
                        label: "Occupancy",
                        value: `${occupancyRate}%`,
                        icon: Building,
                      },
                    ].map((item, idx) => (
                      <div
                        key={idx}
                        className="rounded-3xl bg-white/10 p-5 ring-1 ring-white/10 backdrop-blur-sm transition-all hover:-translate-y-1"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-xs uppercase tracking-[0.28em] text-slate-200/75">
                              {item.label}
                            </p>
                            <p className="mt-4 text-3xl font-semibold text-white">
                              {item.value}
                            </p>
                          </div>
                          <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-white/15 text-white">
                            <item.icon size={22} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>

              <div className="grid gap-6">
                <motion.div
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.05 }}
                  className="rounded-[1.75rem] bg-white p-6 shadow-sm border border-slate-200"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-500 uppercase tracking-[0.24em]">
                        Occupancy pulse
                      </p>
                      <h3 className="mt-3 text-2xl font-semibold text-slate-900">
                        {occupancyRate}% full
                      </h3>
                    </div>
                    <div className="rounded-2xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600">
                      {stats.occupiedRooms}/{stats.totalRooms} rooms
                    </div>
                  </div>

                  <div className="mt-6 space-y-4">
                    {[
                      {
                        label: "Room Occupancy",
                        value: occupancyRate,
                        color: "bg-cyan-500",
                      },
                      {
                        label: "New Enquiries",
                        value:
                          stats.newEnquiries > 0
                            ? Math.min(
                                100,
                                Math.round(
                                  (stats.newEnquiries /
                                    Math.max(1, stats.totalEnquiries)) *
                                    100,
                                ),
                              )
                            : 0,
                        color: "bg-amber-500",
                      },
                      {
                        label: "Unread Complaints",
                        value:
                          stats.unreadComplaints > 0
                            ? Math.min(100, stats.unreadComplaints * 12)
                            : 0,
                        color: "bg-emerald-500",
                      },
                    ].map((item, idx) => (
                      <div key={idx} className="space-y-2">
                        <div className="flex items-center justify-between gap-3 text-sm font-semibold text-slate-600">
                          <span>{item.label}</span>
                          <span>{item.value}%</span>
                        </div>
                        <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${item.color}`}
                            style={{ width: `${item.value}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.1 }}
                  className="rounded-[1.75rem] bg-white p-6 shadow-sm border border-slate-200"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-500 uppercase tracking-[0.24em]">
                        Quick actions
                      </p>
                      <h3 className="mt-3 text-2xl font-semibold text-slate-900">
                        Jump to management panels
                      </h3>
                    </div>
                    <div className="rounded-2xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600">
                      Fast access
                    </div>
                  </div>

                  <div className="mt-6 grid gap-3">
                    {[
                      { label: "Review Enquiries", target: "enquiries" },
                      { label: "Manage Rooms", target: "rooms" },
                      { label: "Face Attendance", target: "face-attendance" },
                    ].map((item, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActivePage(item.target)}
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-left text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-100"
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </motion.div>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {highlightCards.map((item, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: idx * 0.05 }}
                  className="rounded-[1.75rem] bg-white p-6 shadow-sm border border-slate-200"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">
                        {item.label}
                      </p>
                      <p className="mt-4 text-3xl font-semibold text-slate-900">
                        {item.value}
                      </p>
                    </div>
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-3xl bg-gradient-to-br ${item.accent} text-white shadow-lg shadow-slate-900/10`}
                    >
                      <item.icon size={24} />
                    </div>
                  </div>
                  <p className="mt-5 text-sm text-slate-500">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        );
      }
    }
  };

  const pageTitles = {
    dashboard: "Dashboard Overview",
    enquiries: "📫Enquiry Management",
    // rooms: "Room Management",
    students: "🧑‍🎓Student Management",
    users: "👤User Management",
    "face-registration": "Face Registration",
    "face-attendance": "Face Attendance Tracking",
    mess: "Mess Dashboard",
    "mess-management": "Mess Management",
  };

  const pageSubtitles = {
    dashboard: "Monitor your hostel operations",
    enquiries: "Manage student enquiries and applications",
    // rooms: "Manage rooms and bed assignments",
    students: "View and manage student information",
    users: "Create and manage system users",
    "face-registration": "Register student faces for biometric authentication",
    "face-attendance": "Track attendance using face recognition",
    mess: "View daily meal count based on attendance",
    "mess-management": "Manage mess fee structure, menus, and assignments",
  };

  return (
    <DashboardLayout
      menuItems={menuItems}
      activeMenu={activePage}
      setActiveMenu={setActivePage}
      user={user}
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">
            {pageTitles[activePage]}
          </h1>
          <p className="text-slate-500 font-medium mt-1">
            {pageSubtitles[activePage]}
          </p>
        </div>

        <motion.div
          key={activePage}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {renderContent()}
        </motion.div>
      </div>
    </DashboardLayout>
  );
}

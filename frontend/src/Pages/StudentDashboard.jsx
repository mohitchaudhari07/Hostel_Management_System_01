import { useState, useEffect } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  UserSquare,
  Home,
  ClipboardCheck,
  Wallet,
  MessageSquareWarning,
  CheckCircle,
  Clock,
  CreditCard,
  Sparkles,
  UtensilsCrossed,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../components/layout/DashboardLayout";
import AttendanceCard from "../components/student/AttendanceCard";

export default function StudentDashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));
  const [studentData, setStudentData] = useState(null);
  const [activeMenu, setActiveMenu] = useState("dashboard");
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("online");
  const [transactionId, setTransactionId] = useState("");
  const [paymentType, setPaymentType] = useState("total");
  const [complaints, setComplaints] = useState([]);
  const [showComplaintForm, setShowComplaintForm] = useState(false);
  const [complaintForm, setComplaintForm] = useState({ title: "", description: "", category: "maintenance" });

  useEffect(() => {
    fetchStudentData();
  }, []);

  useEffect(() => {
    if (activeMenu === "fees" && studentData) {
      fetchPaymentDetails();
      fetchInvoices();
    }
    if (activeMenu === "complaints" && studentData) {
      fetchComplaints();
    }
  }, [activeMenu, studentData]);

  const fetchStudentData = async () => {
    try {
      const response = await axios.get(
        `/auth/student-profile`,
      );
      setStudentData(response.data);
    } catch (error) {
      console.error("Error fetching student data:", error);
    }
  };

  const fetchPaymentDetails = async () => {
    try {
      if (!studentData) return;
      const response = await axios.get(
        `/payments/student/payment-details`,
        {
          headers: { "x-user-id": studentData._id, "x-user-role": "student" },
        },
      );
      setPaymentDetails({
        ...response.data.paymentDetails,
        hostelFeePaid: response.data.paymentDetails.hostelFeePaid || 0,
        messFeePaid: response.data.paymentDetails.messFeePaid || 0,
      });
    } catch (error) {
      console.error("Error fetching payment details:", error);
    }
  };

  const fetchInvoices = async () => {
    try {
      if (!studentData) return;
      const response = await axios.get(
        `/invoices/student/invoices`,
        {
          headers: { "x-user-id": studentData._id, "x-user-role": "student" },
        },
      );
      setInvoices(response.data.invoices);
    } catch (error) {
      console.error("Error fetching invoices:", error);
    }
  };

  const fetchComplaints = async () => {
    try {
      const response = await axios.get("/complaints/student", {
        headers: { "x-user-id": user.id, "x-user-role": user.role }
      });
      setComplaints(response.data);
    } catch (error) {
      console.error("Error fetching complaints:", error);
    }
  };

  const handleComplaintSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post("/complaints", complaintForm, {
        headers: { "x-user-id": user.id, "x-user-role": user.role }
      });
      alert("Complaint filed successfully");
      setShowComplaintForm(false);
      setComplaintForm({ title: "", description: "", category: "maintenance" });
      fetchComplaints();
    } catch (error) {
      alert("Failed to file complaint");
    } finally {
      setLoading(false);
    }
  };

  const getMaxAmount = () => {
    if (!paymentDetails) return 0;
    switch (paymentType) {
      case "hostel":
        return paymentDetails.hostelFeeAmount - paymentDetails.hostelFeePaid;
      case "mess":
        return paymentDetails.messFeeAmount - paymentDetails.messFeePaid;
      case "total":
      default:
        return paymentDetails.amountDue;
    }
  };

  const handlePayment = async () => {
    if (!paymentAmount || parseFloat(paymentAmount) <= 0)
      return alert("Please enter a valid payment amount");
    if (parseFloat(paymentAmount) > getMaxAmount())
      return alert("Payment amount cannot exceed allowed amount");

    setLoading(true);
    try {
      await axios.post(
        `/payments/student/pay`,
        {
          amount: parseFloat(paymentAmount),
          paymentMethod,
          transactionId: transactionId || null,
          paymentType,
        },
        {
          headers: { "x-user-id": studentData._id, "x-user-role": "student" },
        },
      );

      alert("Payment processed successfully!");
      setPaymentAmount("");
      setTransactionId("");
      fetchPaymentDetails();
      fetchInvoices();
    } catch (error) {
      alert(
        "Payment failed: " + (error.response?.data?.message || "Unknown error"),
      );
    } finally {
      setLoading(false);
    }
  };

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "profile", label: "Profile", icon: UserSquare },
    { id: "room", label: "Room Details", icon: Home },
    { id: "attendance", label: "Attendance", icon: ClipboardCheck },
    { id: "fees", label: "Fee Status", icon: Wallet },
    { id: "complaints", label: "Complaints", icon: MessageSquareWarning },
    { id: "mess-ai", label: "Smart Mess AI", icon: UtensilsCrossed },
  ];

  return (
    <DashboardLayout
      menuItems={menuItems}
      activeMenu={activeMenu}
      setActiveMenu={setActiveMenu}
      user={user}
      title={user?.name || "Student Dashboard"}
    >
      {activeMenu === "mess-ai" && (
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-2xl p-8 text-white shadow-lg">
          <div className="flex items-center gap-3 mb-3">
            <Sparkles size={28} />
            <h2 className="text-2xl font-bold">AI Mess Recommendations</h2>
          </div>
          <p className="text-indigo-100 mb-6 max-w-xl">
            Rate meals, get personalized suggestions, see trending dishes, and help reduce food wastage.
          </p>
          <button
            type="button"
            onClick={() => navigate("/student/mess-ai")}
            className="px-6 py-3 bg-white text-indigo-700 font-semibold rounded-xl hover:shadow-lg transition-shadow"
          >
            Open Smart Mess Hub
          </button>
        </div>
      )}

      {activeMenu === "dashboard" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                title: "Room Status",
                icon: Home,
                value: studentData?.isRoomAssigned
                  ? `Room ${studentData.roomNumber}`
                  : "Not Assigned",
                desc: studentData?.isRoomAssigned
                  ? `Bed ${studentData.bedId} • Block ${studentData.block}`
                  : "Pending",
                color: "text-blue-600",
                bg: "bg-blue-50",
              },
              {
                title: "Fee Status",
                icon: Wallet,
                value: "Paid",
                desc: "Next due: March 1, 2026",
                color: "text-emerald-600",
                bg: "bg-emerald-50",
              },
              {
                title: "Complaints",
                icon: MessageSquareWarning,
                value: "0 Active",
                desc: "All resolved",
                color: "text-amber-600",
                bg: "bg-amber-50",
              },
              {
                title: "Stay Duration",
                icon: Clock,
                value: "8 Months",
                desc: "Since July 2025",
                color: "text-indigo-600",
                bg: "bg-indigo-50",
              },
            ].map((stat, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
                    <stat.icon size={24} />
                  </div>
                  <div>
                    <h3 className="text-slate-500 text-sm font-medium">
                      {stat.title}
                    </h3>
                    <p
                      className={`text-xl font-bold ${stat.value === "Paid" ? "text-emerald-600" : "text-slate-800"}`}
                    >
                      {stat.value}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">{stat.desc}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200"
            >
              <h2 className="text-xl font-bold text-slate-800 mb-6">
                Recent Activity
              </h2>
              <div className="space-y-4">
                {[
                  {
                    icon: Home,
                    text: "Room assigned successfully",
                    time: "2 days ago",
                    color: "text-blue-600",
                    bg: "bg-blue-50",
                  },
                  {
                    icon: CreditCard,
                    text: "Monthly fee payment received",
                    time: "1 week ago",
                    color: "text-emerald-600",
                    bg: "bg-emerald-50",
                  },
                  {
                    icon: MessageSquareWarning,
                    text: "Welcome to HostelSync!",
                    time: "2 months ago",
                    color: "text-indigo-600",
                    bg: "bg-indigo-50",
                  },
                ].map((act, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-4 p-3 hover:bg-slate-50 rounded-xl transition-colors"
                  >
                    <div className={`p-2 rounded-lg ${act.bg} ${act.color}`}>
                      <act.icon size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-800">
                        {act.text}
                      </p>
                      <p className="text-xs text-slate-500">{act.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200"
            >
              <h2 className="text-xl font-bold text-slate-800 mb-6">
                Quick Actions
              </h2>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { id: "room", icon: Home, label: "View Room" },
                  { id: "fees", icon: CreditCard, label: "Pay Fees" },
                  {
                    id: "complaints",
                    icon: MessageSquareWarning,
                    label: "File Complaint",
                  },
                  { id: "profile", icon: UserSquare, label: "Update Profile" },
                ].map((action) => (
                  <button
                    key={action.id}
                    onClick={() => setActiveMenu(action.id)}
                    className="flex flex-col items-center justify-center gap-3 p-4 border border-slate-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 hover:text-blue-700 transition-all text-slate-600 font-medium"
                  >
                    <action.icon
                      size={24}
                      className="text-slate-400 group-hover:text-blue-600"
                    />
                    {action.label}
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      )}

      {activeMenu === "profile" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden"
        >
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 h-32"></div>
          <div className="px-8 pb-8">
            <div className="relative flex justify-between items-end -mt-28 mb-18">
              <div className="flex items-end gap-6">
                <div className="w-24 h-24 bg-white p-1 rounded-2xl shadow-lg">
                  <div className="w-full h-full bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center text-3xl font-bold text-blue-700">
                    {user?.name?.charAt(0).toUpperCase()}
                  </div>
                </div>
                <div className="mb-2">
                  <h2 className="text-2xl font-bold text-white">
                    {user?.name}
                  </h2>
                  <p className="text-slate-900 font-medium">Student</p>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6 max-w-2xl">
              {[
                { label: "Email Address", value: user?.email },
                {
                  label: "Phone Number",
                  value: studentData?.phone || "Not provided",
                },
                {
                  label: "Course",
                  value: studentData?.course || "Not specified",
                },
                {
                  label: "Registration Date",
                  value: studentData?.createdAt
                    ? new Date(studentData.createdAt).toLocaleDateString()
                    : "N/A",
                },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="bg-slate-50 p-4 rounded-xl border border-slate-100"
                >
                  <p className="text-xs text-slate-400 font-semibold uppercase mb-1">
                    {item.label}
                  </p>
                  <p className="text-slate-800 font-medium">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {activeMenu === "room" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 max-w-3xl"
        >
          <h2 className="text-2xl font-bold text-slate-800 mb-6">
            Room Details
          </h2>
          {studentData?.isRoomAssigned ? (
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-6 rounded-2xl border border-emerald-100">
              <div className="flex items-center gap-4 mb-8">
                <div className="p-4 bg-emerald-500 text-white rounded-2xl shadow-lg shadow-emerald-500/30">
                  <Home size={32} />
                </div>
                <div>
                  <h3 className="text-3xl font-bold text-slate-800">
                    Room {studentData.roomNumber}
                  </h3>
                  <p className="text-emerald-700 font-medium">
                    Your comfortable stay
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {[
                  { label: "Bed Number", value: studentData.bedId },
                  { label: "Floor", value: studentData.floor },
                  { label: "Block", value: studentData.block },
                  { label: "Room Type", value: studentData.roomType },
                  {
                    label: "Assigned Date",
                    value: studentData.roomAssignedDate
                      ? new Date(
                          studentData.roomAssignedDate,
                        ).toLocaleDateString()
                      : "N/A",
                  },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="bg-white p-4 rounded-xl shadow-sm border border-emerald-50"
                  >
                    <p className="text-xs text-slate-400 font-semibold uppercase mb-1">
                      {item.label}
                    </p>
                    <p className="text-emerald-700 font-bold text-lg">
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-12 px-4 bg-red-50 rounded-2xl border border-red-100 border-dashed">
              <Home className="mx-auto text-red-300 mb-4" size={48} />
              <h3 className="text-xl font-bold text-slate-800 mb-2">
                No Room Assigned
              </h3>
              <p className="text-slate-500 max-w-md mx-auto">
                Your room assignment is currently pending. Please contact the
                administration for more information.
              </p>
            </div>
          )}
        </motion.div>
      )}

      {activeMenu === "attendance" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h2 className="text-2xl font-bold text-slate-800 mb-6">
            Attendance Record
          </h2>
          {studentData?.faceRegistered ? (
            <AttendanceCard
              studentId={studentData._id}
              studentData={studentData}
            />
          ) : (
            <div className="text-center py-16 px-4 bg-amber-50 rounded-2xl border border-amber-200 border-dashed max-w-2xl">
              <div className="w-20 h-20 bg-amber-100 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <UserSquare size={40} />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-3">
                Face Registration Required
              </h3>
              <p className="text-slate-600 mb-2 text-lg">
                Please register your face with the admin to enable biometric
                attendance tracking.
              </p>
              <p className="text-slate-400 text-sm">
                Contact your hostel administration for face registration.
              </p>
            </div>
          )}
        </motion.div>
      )}

      {activeMenu === "fees" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          <h2 className="text-2xl font-bold text-slate-800">
            Fee Status & Payment
          </h2>

          {!paymentDetails ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 shadow-sm">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-slate-500">Loading payment details...</p>
            </div>
          ) : paymentDetails.paymentStatus === "not_assigned" ? (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center max-w-2xl">
              <Clock className="mx-auto text-amber-500 mb-4" size={40} />
              <h3 className="text-lg font-bold text-amber-800 mb-2">
                Payment Details Pending
              </h3>
              <p className="text-amber-700">
                Admin has not sent your payment details yet. Your account will
                be fully activated once details are shared.
              </p>
            </div>
          ) : (
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Fee Summary */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                <div className="flex items-center gap-4 mb-6">
                  <div
                    className={`p-3 rounded-full text-white ${paymentDetails.paymentStatus === "paid" ? "bg-emerald-500" : paymentDetails.paymentStatus === "partial" ? "bg-amber-500" : "bg-red-500"}`}
                  >
                    {paymentDetails.paymentStatus === "paid" ? (
                      <CheckCircle />
                    ) : (
                      <Wallet />
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">
                      {paymentDetails.paymentStatus === "paid"
                        ? "All Fees Paid"
                        : paymentDetails.paymentStatus === "partial"
                          ? "Partial Payment"
                          : "Payment Due"}
                    </h3>
                    <p className="text-sm text-slate-500">
                      {paymentDetails.paymentStatus === "paid"
                        ? "Your account is up to date"
                        : `Due date: ${new Date(paymentDetails.paymentDueDate).toLocaleDateString()}`}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {[
                    {
                      label: "Hostel Fee",
                      value: paymentDetails.hostelFeeAmount,
                    },
                    {
                      label: "Hostel Fee Paid",
                      value: paymentDetails.hostelFeePaid,
                    },
                    { label: "Mess Fee", value: paymentDetails.messFeeAmount },
                    {
                      label: "Mess Fee Paid",
                      value: paymentDetails.messFeePaid,
                    },
                    {
                      label: "Total Amount",
                      value: paymentDetails.totalFeeAmount,
                      bold: true,
                    },
                    {
                      label: "Amount Paid",
                      value: paymentDetails.amountPaid,
                      bold: true,
                      color: "text-emerald-600",
                    },
                  ].map((item, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between items-center py-2 border-b border-slate-50 last:border-0"
                    >
                      <span className="text-slate-600">{item.label}</span>
                      <span
                        className={`font-medium ${item.bold ? "font-bold" : ""} ${item.color || "text-slate-800"}`}
                      >
                        ₹{item.value}
                      </span>
                    </div>
                  ))}

                  <div className="flex justify-between items-center pt-4 border-t border-slate-200">
                    <span
                      className={`text-lg font-bold ${paymentDetails.amountDue > 0 ? "text-red-600" : "text-emerald-600"}`}
                    >
                      {paymentDetails.amountDue > 0 ? "Amount Due" : "Balance"}
                    </span>
                    <span
                      className={`text-2xl font-bold ${paymentDetails.amountDue > 0 ? "text-red-600" : "text-emerald-600"}`}
                    >
                      ₹{Math.abs(paymentDetails.amountDue)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment Form */}
              {paymentDetails.amountDue > 0 && (
                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                  <h3 className="text-lg font-bold text-slate-800 mb-6">
                    Make Payment
                  </h3>
                  <div className="space-y-5">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-3">
                        Payment Type
                      </label>
                      <div className="flex gap-4">
                        {["total", "hostel", "mess"].map((type) => (
                          <label
                            key={type}
                            className="flex items-center gap-2 cursor-pointer"
                          >
                            <input
                              type="radio"
                              value={type}
                              checked={paymentType === type}
                              onChange={(e) => setPaymentType(e.target.value)}
                              className="text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm font-medium text-slate-700 capitalize">
                              {type}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Amount (₹)
                      </label>
                      <input
                        type="number"
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(e.target.value)}
                        max={getMaxAmount()}
                        placeholder={`Max: ₹${getMaxAmount()}`}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                          Method
                        </label>
                        <select
                          value={paymentMethod}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                        >
                          <option value="online">Online Payment</option>
                          <option value="upi">UPI</option>
                          <option value="bank_transfer">Bank Transfer</option>
                          <option value="cash">Cash</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                          Transaction ID
                        </label>
                        <input
                          type="text"
                          value={transactionId}
                          onChange={(e) => setTransactionId(e.target.value)}
                          placeholder="Optional"
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                        />
                      </div>
                    </div>

                    <button
                      onClick={handlePayment}
                      disabled={loading}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-70 mt-2 shadow-lg shadow-blue-500/30"
                    >
                      {loading ? "Processing..." : "Pay Now"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Invoices List */}
          {invoices.length > 0 && (
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm mt-6">
              <h3 className="text-lg font-bold text-slate-800 mb-6">
                Payment History
              </h3>
              <div className="space-y-4">
                {invoices.map((invoice) => (
                  <div
                    key={invoice._id}
                    className="flex flex-col sm:flex-row justify-between sm:items-center p-4 bg-slate-50 border border-slate-100 rounded-xl gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <span className="font-bold text-slate-800">
                          {invoice.invoiceNumber}
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${invoice.invoiceStatus === "paid" ? "bg-emerald-100 text-emerald-700" : invoice.invoiceStatus === "partially_paid" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}`}
                        >
                          {invoice.invoiceStatus.replace("_", " ")}
                        </span>
                      </div>
                      <p className="text-sm text-slate-500">
                        Date:{" "}
                        {new Date(invoice.invoiceDate).toLocaleDateString()} •
                        Due: {new Date(invoice.dueDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right flex flex-row sm:flex-col justify-between sm:justify-center">
                      <p className="font-medium text-slate-600 text-sm">
                        Total: ₹{invoice.totalAmount}
                      </p>
                      <p className="font-bold text-emerald-600">
                        Paid: ₹{invoice.amountPaid}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}

      {activeMenu === "complaints" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 max-w-3xl"
        >
          <div className="flex items-center gap-4 mb-8">
            <div className="p-4 bg-blue-100 text-blue-600 rounded-2xl">
              <MessageSquareWarning size={32} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-800">
                Complaints & Support
              </h2>
              <p className="text-slate-500 font-medium">
                Report issues with your room or facilities
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-8">
            {[
              { label: "Active", value: complaints.filter(c => c.status !== "resolved").length, color: "text-blue-600" },
              { label: "Resolved", value: complaints.filter(c => c.status === "resolved").length, color: "text-emerald-600" },
              { label: "Total", value: complaints.length, color: "text-indigo-600" },
            ].map((stat, idx) => (
              <div
                key={idx}
                className="bg-slate-50 p-4 rounded-xl text-center border border-slate-100"
              >
                <p className={`text-3xl font-bold ${stat.color}`}>
                  {stat.value}
                </p>
                <p className="text-sm font-medium text-slate-500 mt-1">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>

          {showComplaintForm ? (
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 mb-8">
              <h3 className="font-bold text-lg mb-4 text-slate-800">File a New Complaint</h3>
              <form onSubmit={handleComplaintSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Category</label>
                  <select 
                    value={complaintForm.category}
                    onChange={(e) => setComplaintForm({...complaintForm, category: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500/20 outline-none"
                  >
                    <option value="maintenance">Maintenance</option>
                    <option value="food">Food & Mess</option>
                    <option value="cleaning">Cleaning</option>
                    <option value="security">Security</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Title</label>
                  <input 
                    type="text" 
                    required
                    value={complaintForm.title}
                    onChange={(e) => setComplaintForm({...complaintForm, title: e.target.value})}
                    placeholder="Brief description of the issue"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500/20 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Detailed Description</label>
                  <textarea 
                    required
                    rows="4"
                    value={complaintForm.description}
                    onChange={(e) => setComplaintForm({...complaintForm, description: e.target.value})}
                    placeholder="Provide detailed information about your complaint..."
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500/20 outline-none resize-none"
                  ></textarea>
                </div>
                <div className="flex gap-4 pt-2">
                  <button type="submit" disabled={loading} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-colors shadow-lg shadow-blue-500/30">
                    {loading ? "Submitting..." : "Submit Complaint"}
                  </button>
                  <button type="button" onClick={() => setShowComplaintForm(false)} className="px-6 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold py-3 rounded-xl transition-colors">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <button onClick={() => setShowComplaintForm(true)} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 rounded-xl transition-colors shadow-lg shadow-blue-500/30 mb-8">
              File New Complaint
            </button>
          )}

          <div className="space-y-4">
            <h3 className="font-bold text-lg text-slate-800">Your Recent Complaints</h3>
            {complaints.length === 0 ? (
              <p className="text-slate-500 text-center py-6 bg-slate-50 rounded-xl border border-slate-100">You haven't filed any complaints yet.</p>
            ) : (
              complaints.map(complaint => (
                <div key={complaint._id} className="p-5 border border-slate-200 rounded-xl bg-white hover:border-blue-300 transition-colors shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-slate-800 text-lg">{complaint.title}</h4>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                      complaint.status === 'resolved' ? 'bg-emerald-100 text-emerald-700' :
                      complaint.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {complaint.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-slate-600 text-sm mb-4">{complaint.description}</p>
                  
                  {complaint.adminReply && (
                    <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-200 border-l-4 border-l-blue-500">
                      <p className="text-xs font-bold text-blue-700 mb-1">Admin Reply:</p>
                      <p className="text-sm text-slate-700">{complaint.adminReply}</p>
                    </div>
                  )}
                  
                  <div className="mt-4 text-xs font-semibold text-slate-400 flex justify-between">
                    <span className="capitalize px-2 py-1 bg-slate-100 rounded-md">Category: {complaint.category}</span>
                    <span>Filed: {new Date(complaint.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      )}
    </DashboardLayout>
  );
}

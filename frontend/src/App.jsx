import { Routes, Route } from "react-router-dom";
import Login from "./Pages/Login";
import AdminDashboard from "./Pages/AdminDashboard";
import StudentDashboard from "./Pages/StudentDashboard";
import MessDashboard from "./Pages/MessDashboard";
import MessAdminPanel from "./Pages/MessAdminPanel";
import MessStaffDashboard from "./Pages/MessStaffDashboard";
import MessMenuManagement from "./Pages/MessMenuManagement";
import Enquiry from "./Pages/Enquiry";
import AdminEnquiries from "./Pages/AdminEnquiries";

function App() {
  return (
    <Routes>
      {/* Default route shows registration/enquiry form for students */}
      <Route path="/" element={<Enquiry />} />
      <Route path="/login" element={<Login />} />
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/student" element={<StudentDashboard />} />
      <Route path="/mess" element={<MessDashboard />} />
      <Route path="/mess/menu" element={<MessMenuManagement />} />
      <Route path="/mess-staff" element={<MessStaffDashboard />} />
      <Route path="/admin/mess-management" element={<MessAdminPanel />} />
      <Route path="/enquiry" element={<Enquiry />} />
      <Route path="/register" element={<Enquiry />} />
      <Route path="/admin/enquiries" element={<AdminEnquiries />} />
    </Routes>
  );
}

export default App;

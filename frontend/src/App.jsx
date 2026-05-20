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
import AdminRegister from "./Pages/AdminRegister";
import ProtectedRoute from "./components/ProtectedRoute";
import MessSmartStudent from "./Pages/MessSmartStudent";
import MessSmartAdmin from "./Pages/MessSmartAdmin";

function App() {
  return (
    <Routes>
      <Route path="/admin/register" element={<AdminRegister />} />
      {/* Default route shows registration/enquiry form for students */}
      <Route path="/" element={<Enquiry />} />
      <Route path="/login" element={<Login />} />

      {/* Admin Routes - Only accessible by admin role */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute
            element={<AdminDashboard />}
            requiredRoles={["admin"]}
          />
        }
      />
      <Route
        path="/admin/enquiries"
        element={
          <ProtectedRoute
            element={<AdminEnquiries />}
            requiredRoles={["admin"]}
          />
        }
      />
      <Route
        path="/admin/mess-management"
        element={
          <ProtectedRoute
            element={<MessAdminPanel />}
            requiredRoles={["admin"]}
          />
        }
      />

      {/* Student Routes - Accessible by student, mess, and mess_staff roles */}
      <Route
        path="/student"
        element={
          <ProtectedRoute
            element={<StudentDashboard />}
            requiredRoles={["student", "mess", "mess_staff"]}
          />
        }
      />
      <Route
        path="/student/mess-ai"
        element={
          <ProtectedRoute
            element={<MessSmartStudent />}
            requiredRoles={["student", "mess", "mess_staff"]}
          />
        }
      />
      <Route
        path="/admin/mess-ai"
        element={
          <ProtectedRoute
            element={<MessSmartAdmin />}
            requiredRoles={["admin", "mess", "mess_staff"]}
          />
        }
      />
      <Route
        path="/mess/ai-analytics"
        element={
          <ProtectedRoute
            element={<MessSmartAdmin />}
            requiredRoles={["mess", "mess_staff", "admin"]}
          />
        }
      />
      <Route
        path="/mess"
        element={
          <ProtectedRoute
            element={<MessDashboard />}
            requiredRoles={["mess", "mess_staff"]}
          />
        }
      />
      <Route
        path="/mess/menu"
        element={
          <ProtectedRoute
            element={<MessMenuManagement />}
            requiredRoles={["mess", "mess_staff"]}
          />
        }
      />
      <Route
        path="/mess-staff"
        element={
          <ProtectedRoute
            element={<MessStaffDashboard />}
            requiredRoles={["mess", "mess_staff"]}
          />
        }
      />

      {/* Public Routes */}
      <Route path="/enquiry" element={<Enquiry />} />
      <Route path="/register" element={<Enquiry />} />
    </Routes>
  );
}

export default App;

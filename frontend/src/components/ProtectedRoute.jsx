import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ element, requiredRoles = [] }) {
  const userJson = localStorage.getItem("user");

  // Not logged in - redirect to login
  if (!userJson) {
    return <Navigate to="/login" replace />;
  }

  const user = parseUser(userJson);

  if (!user) {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    return <Navigate to="/login" replace />;
  }

  // Check if user's role is allowed for this route
  if (requiredRoles.length > 0 && !requiredRoles.includes(user.role)) {
    return <Navigate to={getRoleHome(user.role)} replace />;
  }

  // User is authorized - render the element
  return element;
}

function parseUser(userJson) {
  try {
    return JSON.parse(userJson);
  } catch {
    return null;
  }
}

function getRoleHome(role) {
  if (role === "admin") return "/admin";
  if (role === "mess") return "/mess";
  if (role === "mess_staff") return "/mess-staff";
  if (role === "student") return "/student";
  return "/login";
}

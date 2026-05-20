// Logout user and clear session
export const logoutUser = () => {
  localStorage.removeItem("user");
  localStorage.removeItem("token");
  window.location.href = "/login";
};

// Get current logged-in user
export const getCurrentUser = () => {
  const userJson = localStorage.getItem("user");
  if (!userJson) return null;

  try {
    return JSON.parse(userJson);
  } catch (error) {
    console.error("Error parsing user data:", error);
    return null;
  }
};

// Check if user is admin
export const isAdmin = () => {
  const user = getCurrentUser();
  return user?.role === "admin";
};

// Check if user is student (student, mess, or mess_staff)
export const isStudent = () => {
  const user = getCurrentUser();
  return user && ["student", "mess", "mess_staff"].includes(user.role);
};

// Check if user is logged in
export const isLoggedIn = () => {
  return getCurrentUser() !== null;
};

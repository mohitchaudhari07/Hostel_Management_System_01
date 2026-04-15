// Authentication Middleware
const authenticate = async (req, res, next) => {
  try {
    // For now, we'll get the user ID from the request headers or session
    // In production, use JWT tokens
    const userId = req.headers["x-user-id"];
    const userRole = req.headers["x-user-role"];

    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    // Attach user info to request object
    req.user = {
      id: userId,
      role: userRole || "student"
    };

    next();
  } catch (error) {
    res.status(401).json({ message: "Authentication failed", error: error.message });
  }
};

// Authorization Middleware
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "You do not have permission to access this resource" });
    }

    next();
  };
};

module.exports = {
  authenticate,
  authorize
};

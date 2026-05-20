const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";

const getBearerToken = (req) => {
  const authHeader = req.headers.authorization || "";
  if (!authHeader.startsWith("Bearer ")) return null;
  return authHeader.slice("Bearer ".length);
};

const attachUserFromToken = (req) => {
  const token = getBearerToken(req);
  if (!token) return false;

  const decoded = jwt.verify(token, JWT_SECRET);
  req.user = {
    id: decoded.id,
    email: decoded.email,
    name: decoded.name,
    role: decoded.role,
  };
  return true;
};

// Authentication Middleware
const authenticate = async (req, res, next) => {
  try {
    if (attachUserFromToken(req)) {
      return next();
    }

    // Optional local-dev fallback. Accept x-user-id/x-user-role when running locally for tooling and testing.
    if (
      process.env.ALLOW_HEADER_AUTH === "true" ||
      process.env.NODE_ENV !== "production"
    ) {
      const userId = req.headers["x-user-id"];
      const userRole = req.headers["x-user-role"];

      if (userId) {
        req.user = {
          id: userId,
          role: userRole || "student",
        };
        return next();
      }
    }

    return res.status(401).json({ message: "Authentication required" });
  } catch (error) {
    res
      .status(401)
      .json({ message: "Authentication failed", error: error.message });
  }
};

const optionalAuthenticate = async (req, res, next) => {
  try {
    if (getBearerToken(req)) {
      attachUserFromToken(req);
    }

    next();
  } catch (error) {
    return res
      .status(401)
      .json({ message: "Authentication failed", error: error.message });
  }
};

// Authorization Middleware
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    if (!roles.includes(req.user.role)) {
      return res
        .status(403)
        .json({
          message: "You do not have permission to access this resource",
        });
    }

    next();
  };
};

module.exports = {
  authenticate,
  optionalAuthenticate,
  authorize,
};

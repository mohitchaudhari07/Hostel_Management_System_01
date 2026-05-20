const express = require("express");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
require("dotenv").config();

const app = express();

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Requested-With, Accept, X-User-Id, X-User-Role",
  );

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  next();
});

app.use(express.json());
app.use(cookieParser());
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log("MongoDB Connection Error:", err));

// ROUTES
const authRoutes = require("./routes/authRoutes");
app.use("/api/auth", authRoutes);

const enquiryRoutes = require("./routes/enquiryRoutes");
app.use("/api/enquiries", enquiryRoutes);

const roomRoutes = require("./routes/roomRoutes");
app.use("/api/rooms", roomRoutes);

const attendanceRoutes = require("./routes/attendanceRoutes");
app.use("/api/attendance", attendanceRoutes);

// Mess Management Routes
const messRoutes = require("./routes/messRoutes");
app.use("/api/mess", messRoutes);

const paymentRoutes = require("./routes/paymentRoutes");
app.use("/api/payments", paymentRoutes);

const invoiceRoutes = require("./routes/invoiceRoutes");
app.use("/api/invoices", invoiceRoutes);

const messAnalyticsRoutes = require("./routes/messAnalyticsRoutes");
app.use("/api/mess/analytics", messAnalyticsRoutes);

const paymentGatewayRoutes = require("./routes/paymentGatewayRoutes");
app.use("/api/payments", paymentGatewayRoutes);

const complaintRoutes = require("./routes/complaintRoutes");
app.use("/api/complaints", complaintRoutes);

const messRecommendationRoutes = require("./routes/messRecommendationRoutes");
app.use("/api/mess-ai", messRecommendationRoutes);

// Initialize cron jobs
require("./cronJobs");

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

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

// Initialize cron jobs
require("./cronJobs");

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

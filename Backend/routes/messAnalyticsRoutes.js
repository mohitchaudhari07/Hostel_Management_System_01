const express = require("express");
const router = express.Router();
const messAnalyticsController = require("../controllers/messAnalyticsController");
const { authenticate, authorize } = require("../middleware/auth");

// Get dashboard analytics (admin only)
router.get("/dashboard", authenticate, authorize("admin"), messAnalyticsController.getDashboardAnalytics);

// Get collection summary (admin only)
router.get("/collection-summary", authenticate, authorize("admin"), messAnalyticsController.getCollectionSummary);

// Get pending dues report (admin only)
router.get("/pending-dues-report", authenticate, authorize("admin"), messAnalyticsController.getPendingDuesReport);

// Get payment status distribution (admin only)
router.get("/payment-status-distribution", authenticate, authorize("admin"), messAnalyticsController.getPaymentStatusDistribution);

module.exports = router;

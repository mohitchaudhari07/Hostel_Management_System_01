const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/messRecommendationController");
const { authenticate, authorize } = require("../middleware/auth");

const studentRoles = ["student", "mess", "mess_staff", "admin"];
const staffRoles = ["admin", "mess", "mess_staff"];

router.get("/today-menu", authenticate, authorize(...studentRoles), ctrl.getTodayMenu);
router.get("/food-items", authenticate, authorize(...studentRoles), ctrl.getFoodItems);
router.get("/live-stats", authenticate, authorize(...studentRoles), ctrl.getLiveStats);

router.get("/recommendations/popular", authenticate, authorize(...studentRoles), ctrl.getPopular);
router.get(
  "/recommendations/personal",
  authenticate,
  authorize(...studentRoles),
  ctrl.getPersonalized,
);
router.get("/trending", authenticate, authorize(...studentRoles), ctrl.getTrending);
router.get("/combinations", authenticate, authorize(...studentRoles), ctrl.getCombinations);

router.post("/ratings", authenticate, authorize(...studentRoles), ctrl.upsertRating);
router.get("/ratings/me", authenticate, authorize(...studentRoles), ctrl.getMyRatings);

router.post("/reactions", authenticate, authorize(...studentRoles), ctrl.setReaction);
router.get("/reactions/me", authenticate, authorize(...studentRoles), ctrl.getMyReactions);

router.post("/reviews", authenticate, authorize(...studentRoles), ctrl.createReview);
router.get("/reviews", authenticate, authorize(...studentRoles), ctrl.getReviews);

router.post("/food-items", authenticate, authorize(...staffRoles), ctrl.ensureFoodItemByName);
router.post("/food-items/sync", authenticate, authorize(...staffRoles), ctrl.syncFoodItems);

router.get("/analytics", authenticate, authorize(...staffRoles), ctrl.getAnalytics);
router.get("/demand-prediction", authenticate, authorize(...staffRoles), ctrl.getDemandPrediction);
router.post(
  "/weekly-suggestions",
  authenticate,
  authorize(...staffRoles),
  ctrl.getWeeklySuggestions,
);

module.exports = router;

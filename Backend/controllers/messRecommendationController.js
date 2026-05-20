const FoodItem = require("../models/FoodItem");
const Rating = require("../models/Rating");
const Review = require("../models/Review");
const FoodReaction = require("../models/FoodReaction");
const engine = require("../services/recommendationEngine");
const aiService = require("../services/aiService");

const getTodayMenu = async (req, res) => {
  try {
    const count = await FoodItem.countDocuments();
    if (count === 0) await engine.syncFoodItemsFromMenus();
    const menu = await engine.getTodayMenu();
    res.json({ success: true, menu });
  } catch (error) {
    console.error("getTodayMenu:", error);
    res.status(500).json({ message: "Failed to load today's menu", error: error.message });
  }
};

const getFoodItems = async (req, res) => {
  try {
    const { search, category } = req.query;
    const filter = { isActive: true };
    if (category) filter.category = category;
    if (search) filter.name = { $regex: search, $options: "i" };

    const items = await FoodItem.find(filter).sort({ popularityScore: -1 }).limit(100);
    res.json({ success: true, items });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const syncFoodItems = async (req, res) => {
  try {
    const result = await engine.syncFoodItemsFromMenus();
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const upsertRating = async (req, res) => {
  try {
    const { foodItemId, stars, mealSlot } = req.body;
    if (!foodItemId || !stars || stars < 1 || stars > 5) {
      return res.status(400).json({ message: "foodItemId and stars (1-5) required" });
    }

    const food = await FoodItem.findById(foodItemId);
    if (!food) return res.status(404).json({ message: "Food item not found" });

    const rating = await Rating.findOneAndUpdate(
      { userId: req.user.id, foodItemId },
      { stars, mealSlot: mealSlot || engine.getCurrentMealSlot(), date: new Date() },
      { upsert: true, new: true },
    );

    await engine.recalculateFoodStats(foodItemId);
    res.json({ success: true, rating });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getMyRatings = async (req, res) => {
  try {
    const ratings = await Rating.find({ userId: req.user.id })
      .populate("foodItemId", "name slug avgRating")
      .sort({ updatedAt: -1 });
    res.json({ success: true, ratings });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const setReaction = async (req, res) => {
  try {
    const { foodItemId, reaction } = req.body;
    if (!foodItemId || !["like", "dislike"].includes(reaction)) {
      return res.status(400).json({ message: "foodItemId and reaction (like|dislike) required" });
    }

    const food = await FoodItem.findById(foodItemId);
    if (!food) return res.status(404).json({ message: "Food item not found" });

    await FoodReaction.findOneAndUpdate(
      { userId: req.user.id, foodItemId },
      { reaction },
      { upsert: true, new: true },
    );

    await engine.recalculateFoodStats(foodItemId);
    res.json({ success: true, reaction });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getMyReactions = async (req, res) => {
  try {
    const reactions = await FoodReaction.find({ userId: req.user.id });
    res.json({ success: true, reactions });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createReview = async (req, res) => {
  try {
    const { foodItemId, text } = req.body;
    if (!foodItemId || !text?.trim()) {
      return res.status(400).json({ message: "foodItemId and review text required" });
    }

    const food = await FoodItem.findById(foodItemId);
    if (!food) return res.status(404).json({ message: "Food item not found" });

    const sentiment = await aiService.analyzeSentiment(text.trim());

    const review = await Review.create({
      userId: req.user.id,
      foodItemId,
      text: text.trim(),
      sentiment: sentiment.sentiment,
      sentimentScore: sentiment.sentimentScore,
      aiSummary: sentiment.aiSummary,
    });

    await engine.recalculateFoodStats(foodItemId);
    res.status(201).json({ success: true, review });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getReviews = async (req, res) => {
  try {
    const { foodItemId, limit = 30 } = req.query;
    const filter = foodItemId ? { foodItemId } : {};
    const reviews = await Review.find(filter)
      .populate("userId", "name")
      .populate("foodItemId", "name")
      .sort({ createdAt: -1 })
      .limit(Number(limit));
    res.json({ success: true, reviews });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getPopular = async (req, res) => {
  try {
    const items = await engine.getPopularMeals(Number(req.query.limit) || 8);
    res.json({ success: true, items });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getPersonalized = async (req, res) => {
  try {
    const items = await engine.getPersonalizedRecommendations(
      req.user.id,
      Number(req.query.limit) || 6,
    );
    res.json({ success: true, items, mealSlot: engine.getCurrentMealSlot() });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getTrending = async (req, res) => {
  try {
    const items = await engine.getTrendingMeals(Number(req.query.limit) || 6);
    res.json({ success: true, items });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getCombinations = async (req, res) => {
  try {
    const combos = await engine.getBestCombinations(5);
    const insight = await aiService.generateCombinationInsight(combos);
    res.json({ success: true, combinations: combos, insight });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getDemandPrediction = async (req, res) => {
  try {
    const prediction = await engine.predictDemand();
    res.json({ success: true, ...prediction });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAnalytics = async (req, res) => {
  try {
    const analytics = await engine.getAdminAnalytics();
    res.json({ success: true, analytics });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getWeeklySuggestions = async (req, res) => {
  try {
    await engine.syncFoodItemsFromMenus();
    const popular = await engine.getPopularMeals(20);
    const menu = await engine.getTodayMenu();
    const result = await aiService.generateWeeklyMenuSuggestions(
      menu,
      popular.map((p) => p.name),
    );
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getLiveStats = async (req, res) => {
  try {
    const [popular, trending, totals] = await Promise.all([
      engine.getPopularMeals(5),
      engine.getTrendingMeals(5),
      FoodItem.aggregate([
        {
          $group: {
            _id: null,
            avgRating: { $avg: "$avgRating" },
            totalLikes: { $sum: "$likeCount" },
            totalReviews: { $sum: "$reviewCount" },
          },
        },
      ]),
    ]);

    res.json({
      success: true,
      popular,
      trending,
      summary: totals[0] || { avgRating: 0, totalLikes: 0, totalReviews: 0 },
      updatedAt: new Date(),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const ensureFoodItemByName = async (req, res) => {
  try {
    const { name, category, mealType } = req.body;
    if (!name?.trim()) return res.status(400).json({ message: "name required" });

    const slug = engine.slugify(name);
    const item = await FoodItem.findOneAndUpdate(
      { slug },
      { name: name.trim(), slug, category: category || "lunch", mealType: mealType || "veg" },
      { upsert: true, new: true },
    );
    res.json({ success: true, item });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getTodayMenu,
  getFoodItems,
  syncFoodItems,
  upsertRating,
  getMyRatings,
  setReaction,
  getMyReactions,
  createReview,
  getReviews,
  getPopular,
  getPersonalized,
  getTrending,
  getCombinations,
  getDemandPrediction,
  getAnalytics,
  getWeeklySuggestions,
  getLiveStats,
  ensureFoodItemByName,
};

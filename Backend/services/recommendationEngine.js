const FoodItem = require("../models/FoodItem");
const Rating = require("../models/Rating");
const Review = require("../models/Review");
const FoodReaction = require("../models/FoodReaction");
const WeeklyMenu = require("../models/WeeklyMenu");
const Recommendation = require("../models/Recommendation");

const slugify = (name) =>
  name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

function getMonday(d = new Date()) {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  date.setDate(diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function getCurrentMealSlot() {
  const hour = new Date().getHours();
  if (hour < 11) return "breakfast";
  if (hour < 16) return "lunch";
  return "dinner";
}

function startOfDay(d = new Date()) {
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  return date;
}

/** Normalize Mongoose Map / subdocuments into a plain object keyed by lowercase day name */
function normalizeDays(days) {
  if (!days) return {};

  const result = {};
  const assign = (key, value) => {
    const k = String(key).toLowerCase();
    const raw = value?.toObject ? value.toObject() : value;
    result[k] = raw;
  };

  if (typeof days.forEach === "function") {
    days.forEach((value, key) => assign(key, value));
    return result;
  }

  if (typeof days.toObject === "function") {
    const obj = days.toObject();
    Object.entries(obj).forEach(([key, value]) => assign(key, value));
    return result;
  }

  Object.entries(days).forEach(([key, value]) => assign(key, value));
  return result;
}

function extractMeals(dayMenu) {
  const dm = dayMenu?.toObject ? dayMenu.toObject() : dayMenu || {};
  return {
    breakfast: Array.isArray(dm.breakfast) ? dm.breakfast.filter(Boolean) : [],
    lunch: Array.isArray(dm.lunch) ? dm.lunch.filter(Boolean) : [],
    dinner: Array.isArray(dm.dinner) ? dm.dinner.filter(Boolean) : [],
  };
}

/** Find weekly menu that contains today (handles timezone / weekOf mismatches) */
async function findWeeklyMenuForToday() {
  const menus = await WeeklyMenu.find().sort({ weekOf: -1 }).limit(12);
  if (!menus.length) return null;

  const today = startOfDay();

  for (const menu of menus) {
    const weekStart = startOfDay(menu.weekOf);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);
    if (today >= weekStart && today < weekEnd) return menu;
  }

  // Fallback: most recently saved menu
  return menus[0];
}

async function syncFoodItemsFromMenus() {
  const menus = await WeeklyMenu.find().sort({ weekOf: -1 }).limit(3);
  const names = new Set();

  menus.forEach((menu) => {
    const days = normalizeDays(menu.days);
    for (const dayMenu of Object.values(days)) {
      const meals = extractMeals(dayMenu);
      ["breakfast", "lunch", "dinner"].forEach((slot) => {
        meals[slot].forEach((item) => {
          if (item && typeof item === "string") names.add(item.trim());
        });
      });
    }
  });

  let created = 0;
  for (const name of names) {
    if (!name) continue;
    const slug = slugify(name);
    const exists = await FoodItem.findOne({ slug });
    if (!exists) {
      await FoodItem.create({ name, slug, category: "lunch", tags: ["menu"] });
      created += 1;
    }
  }

  return { synced: names.size, created };
}

async function recalculateFoodStats(foodItemId) {
  const [ratingAgg, reviewAgg, reactions] = await Promise.all([
    Rating.aggregate([
      { $match: { foodItemId } },
      {
        $group: {
          _id: null,
          avg: { $avg: "$stars" },
          count: { $sum: 1 },
        },
      },
    ]),
    Review.aggregate([
      { $match: { foodItemId } },
      { $group: { _id: null, count: { $sum: 1 } } },
    ]),
    FoodReaction.aggregate([
      { $match: { foodItemId } },
      {
        $group: {
          _id: "$reaction",
          count: { $sum: 1 },
        },
      },
    ]),
  ]);

  const avgRating = ratingAgg[0]?.avg || 0;
  const ratingCount = ratingAgg[0]?.count || 0;
  const reviewCount = reviewAgg[0]?.count || 0;
  let likeCount = 0;
  let dislikeCount = 0;
  reactions.forEach((r) => {
    if (r._id === "like") likeCount = r.count;
    if (r._id === "dislike") dislikeCount = r.count;
  });

  const popularityScore =
    avgRating * 20 + ratingCount * 2 + likeCount * 3 - dislikeCount * 2 + reviewCount;

  await FoodItem.findByIdAndUpdate(foodItemId, {
    avgRating: Math.round(avgRating * 10) / 10,
    ratingCount,
    reviewCount,
    likeCount,
    dislikeCount,
    popularityScore,
  });
}

async function getTodayMenu() {
  const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  const todayKey = dayNames[new Date().getDay()];
  const mealSlot = getCurrentMealSlot();

  const menu = await findWeeklyMenuForToday();

  if (!menu) {
    return {
      date: new Date(),
      day: todayKey,
      mealSlot,
      breakfast: [],
      lunch: [],
      dinner: [],
      items: [],
      hasMenu: false,
    };
  }

  const days = normalizeDays(menu.days);
  const dayMenu = days[todayKey] || {};
  const { breakfast, lunch, dinner } = extractMeals(dayMenu);

  const allNames = [...new Set([...breakfast, ...lunch, ...dinner])];
  const slugs = allNames.map(slugify);
  const foodItems = slugs.length
    ? await FoodItem.find({ slug: { $in: slugs } })
    : [];

  return {
    date: new Date(),
    day: todayKey,
    mealSlot,
    breakfast,
    lunch,
    dinner,
    items: foodItems,
    weekOf: menu.weekOf,
    hasMenu: breakfast.length + lunch.length + dinner.length > 0,
  };
}

async function getPopularMeals(limit = 8) {
  return FoodItem.find({ isActive: true })
    .sort({ popularityScore: -1, avgRating: -1 })
    .limit(limit)
    .lean();
}

async function getTrendingMeals(limit = 6) {
  const since = new Date();
  since.setDate(since.getDate() - 7);

  const trending = await Rating.aggregate([
    { $match: { createdAt: { $gte: since } } },
    {
      $group: {
        _id: "$foodItemId",
        recentRatings: { $sum: 1 },
        avgStars: { $avg: "$stars" },
      },
    },
    { $sort: { recentRatings: -1, avgStars: -1 } },
    { $limit: limit },
  ]);

  const ids = trending.map((t) => t._id);
  const items = await FoodItem.find({ _id: { $in: ids } }).lean();
  const map = Object.fromEntries(items.map((i) => [String(i._id), i]));

  return trending.map((t) => ({
    ...map[String(t._id)],
    recentRatings: t.recentRatings,
    trendScore: t.recentRatings * (t.avgStars || 3),
  }));
}

async function getPersonalizedRecommendations(userId, limit = 6) {
  const userRatings = await Rating.find({ userId }).sort({ createdAt: -1 }).limit(50);
  const liked = await FoodReaction.find({ userId, reaction: "like" }).limit(30);

  if (!userRatings.length && !liked.length) {
    return getPopularMeals(limit);
  }

  const preferredIds = [
    ...userRatings.filter((r) => r.stars >= 4).map((r) => r.foodItemId),
    ...liked.map((l) => l.foodItemId),
  ];

  const preferred = await FoodItem.find({ _id: { $in: preferredIds } });
  const tags = new Set();
  preferred.forEach((p) => (p.tags || []).forEach((t) => tags.add(t)));

  const candidates = await FoodItem.find({
    isActive: true,
    _id: { $nin: preferredIds },
    $or: [{ tags: { $in: [...tags] } }, { avgRating: { $gte: 4 } }],
  })
    .sort({ popularityScore: -1 })
    .limit(limit)
    .lean();

  if (candidates.length >= limit) return candidates;
  const popular = await getPopularMeals(limit);
  const seen = new Set(candidates.map((c) => String(c._id)));
  popular.forEach((p) => {
    if (!seen.has(String(p._id)) && candidates.length < limit) candidates.push(p);
  });
  return candidates;
}

async function getBestCombinations(limit = 5) {
  const top = await FoodItem.find({ isActive: true })
    .sort({ avgRating: -1, likeCount: -1 })
    .limit(12)
    .lean();

  const combos = [];
  for (let i = 0; i < top.length - 1 && combos.length < limit; i += 2) {
    combos.push({
      items: [top[i].name, top[i + 1]?.name].filter(Boolean),
      score: (top[i].popularityScore + (top[i + 1]?.popularityScore || 0)) / 2,
      reason: "High-rated pairing based on student preferences",
    });
  }
  return combos;
}

async function predictDemand() {
  const menu = await getTodayMenu();
  const slots = ["breakfast", "lunch", "dinner"];
  const predictions = [];

  for (const slot of slots) {
    const items = menu[slot] || [];
    const slugs = items.map(slugify);
    const foodItems = await FoodItem.find({ slug: { $in: slugs } });

    const totalPopularity = foodItems.reduce((s, f) => s + (f.popularityScore || 1), 0);
    const baseStudents = 180;
    const slotMultiplier = slot === "lunch" ? 1.15 : slot === "dinner" ? 1.05 : 0.85;

    predictions.push({
      mealSlot: slot,
      items: items.map((name) => {
        const fi = foodItems.find((f) => f.slug === slugify(name));
        const weight = fi ? (fi.popularityScore || 10) / Math.max(totalPopularity, 1) : 1 / Math.max(items.length, 1);
        const estimatedPlates = Math.round(baseStudents * slotMultiplier * weight);
        const wastageRisk =
          estimatedPlates < 40 ? "low" : estimatedPlates > 120 ? "high" : "medium";
        return {
          name,
          estimatedPlates,
          wastageRisk,
          avgRating: fi?.avgRating || null,
        };
      }),
      totalEstimated: Math.round(baseStudents * slotMultiplier),
    });
  }

  return { date: new Date(), predictions, confidence: "medium" };
}

async function getAdminAnalytics() {
  const [items, reviews, ratings, reactions] = await Promise.all([
    FoodItem.find({ isActive: true }).sort({ popularityScore: -1 }).limit(20).lean(),
    Review.find().sort({ createdAt: -1 }).limit(100).lean(),
    Rating.aggregate([
      {
        $group: {
          _id: "$stars",
          count: { $sum: 1 },
        },
      },
    ]),
    Review.aggregate([
      {
        $group: {
          _id: "$sentiment",
          count: { $sum: 1 },
        },
      },
    ]),
  ]);

  const starDistribution = [1, 2, 3, 4, 5].map((star) => ({
    star,
    count: ratings.find((r) => r._id === star)?.count || 0,
  }));

  const sentimentBreakdown = ["positive", "neutral", "negative"].map((s) => ({
    sentiment: s,
    count: reactions.find((r) => r._id === s)?.count || 0,
  }));

  const avgRating =
    items.length > 0
      ? items.reduce((s, i) => s + (i.avgRating || 0), 0) / items.length
      : 0;

  return {
    topMeals: items.slice(0, 10),
    starDistribution,
    sentimentBreakdown,
    recentReviews: reviews.slice(0, 15),
    totals: {
      foodItems: await FoodItem.countDocuments(),
      ratings: await Rating.countDocuments(),
      reviews: await Review.countDocuments(),
      likes: await FoodReaction.countDocuments({ reaction: "like" }),
    },
    avgRating: Math.round(avgRating * 10) / 10,
  };
}

async function cacheRecommendation(userId, type, payload, hours = 6) {
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + hours);

  await Recommendation.findOneAndUpdate(
    { userId: userId || null, type },
    { payload, expiresAt, generatedBy: payload.source || "engine" },
    { upsert: true, new: true },
  );
}

module.exports = {
  slugify,
  getMonday,
  startOfDay,
  normalizeDays,
  extractMeals,
  findWeeklyMenuForToday,
  getCurrentMealSlot,
  syncFoodItemsFromMenus,
  recalculateFoodStats,
  getTodayMenu,
  getPopularMeals,
  getTrendingMeals,
  getPersonalizedRecommendations,
  getBestCombinations,
  predictDemand,
  getAdminAnalytics,
  cacheRecommendation,
};

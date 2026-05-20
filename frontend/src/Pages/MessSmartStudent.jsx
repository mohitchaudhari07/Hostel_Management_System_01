import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  UtensilsCrossed,
  Sparkles,
  TrendingUp,
  Sun,
  Moon,
  RefreshCw,
  X,
  Loader2,
  ChefHat,
  Coffee,
  Sunset,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { cn } from "../lib/utils";
import FoodCard from "../components/mess/FoodCard";
import { getCurrentUser } from "../utils/authUtils";
import { parseTodayMenuFromWeekly } from "../utils/messMenuUtils";

const MEAL_ICONS = { breakfast: Coffee, lunch: UtensilsCrossed, dinner: Sunset };

export default function MessSmartStudent() {
  const navigate = useNavigate();
  const user = useMemo(() => getCurrentUser(), []);
  const { darkMode, toggleTheme } = useTheme();

  const [loading, setLoading] = useState(true);
  const [menu, setMenu] = useState(null);
  const [recommended, setRecommended] = useState([]);
  const [trending, setTrending] = useState([]);
  const [combinations, setCombinations] = useState([]);
  const [comboInsight, setComboInsight] = useState("");
  const [foodItems, setFoodItems] = useState([]);
  const [ratingsMap, setRatingsMap] = useState({});
  const [reactionsMap, setReactionsMap] = useState({});
  const [reviewModal, setReviewModal] = useState(null);
  const [reviewText, setReviewText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [menuRes, personalRes, trendRes, comboRes, itemsRes, ratingsRes, reactRes] =
        await Promise.all([
          axios.get("/mess-ai/today-menu"),
          axios.get("/mess-ai/recommendations/personal"),
          axios.get("/mess-ai/trending"),
          axios.get("/mess-ai/combinations"),
          axios.get("/mess-ai/food-items"),
          axios.get("/mess-ai/ratings/me"),
          axios.get("/mess-ai/reactions/me"),
        ]);

      let menuData = menuRes.data.menu;

      const hasMeals =
        menuData?.hasMenu ||
        (menuData?.breakfast?.length || 0) +
          (menuData?.lunch?.length || 0) +
          (menuData?.dinner?.length || 0) >
          0;

      if (!hasMeals) {
        try {
          const weeklyRes = await axios.get("/mess/menus");
          const parsed = parseTodayMenuFromWeekly(weeklyRes.data?.menus || []);
          if (parsed?.hasMenu) menuData = { ...menuData, ...parsed };
        } catch (weeklyErr) {
          console.warn("Weekly menu fallback failed", weeklyErr);
        }
      }

      setMenu(menuData);
      setRecommended(personalRes.data.items || []);
      setTrending(trendRes.data.items || []);
      setCombinations(comboRes.data.combinations || []);
      setComboInsight(comboRes.data.insight || "");
      setFoodItems(itemsRes.data.items || []);

      const rMap = {};
      (ratingsRes.data.ratings || []).forEach((r) => {
        if (r.foodItemId?._id) rMap[r.foodItemId._id] = r.stars;
        else if (r.foodItemId) rMap[r.foodItemId] = r.stars;
      });
      setRatingsMap(rMap);

      const reactMap = {};
      (reactRes.data.reactions || []).forEach((r) => {
        reactMap[r.foodItemId] = r.reaction;
      });
      setReactionsMap(reactMap);
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Mess AI load error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user?.id) {
      navigate("/login");
      return;
    }
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [user?.id, navigate, loadData]);

  const todayItems = useMemo(() => {
    if (!menu) return foodItems;
    const names = [...(menu.breakfast || []), ...(menu.lunch || []), ...(menu.dinner || [])];
    const slugs = names.map((n) => n.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-"));
    const matched = foodItems.filter((f) => slugs.includes(f.slug));
    return matched.length ? matched : menu.items?.length ? menu.items : foodItems.slice(0, 12);
  }, [menu, foodItems]);

  const handleRate = async (foodItemId, stars) => {
    try {
      await axios.post("/mess-ai/ratings", {
        foodItemId,
        stars,
        mealSlot: menu?.mealSlot,
      });
      setRatingsMap((prev) => ({ ...prev, [foodItemId]: stars }));
      loadData();
    } catch {
      alert("Could not save rating");
    }
  };

  const handleReact = async (foodItemId, reaction) => {
    try {
      await axios.post("/mess-ai/reactions", { foodItemId, reaction });
      setReactionsMap((prev) => ({ ...prev, [foodItemId]: reaction }));
      loadData();
    } catch {
      alert("Could not save reaction");
    }
  };

  const submitReview = async () => {
    if (!reviewModal || !reviewText.trim()) return;
    setSubmitting(true);
    try {
      await axios.post("/mess-ai/reviews", {
        foodItemId: reviewModal._id,
        text: reviewText,
      });
      setReviewModal(null);
      setReviewText("");
      loadData();
    } catch {
      alert("Review failed");
    } finally {
      setSubmitting(false);
    }
  };

  const pageBg = darkMode
    ? "bg-gradient-to-br from-slate-950 via-indigo-950 to-violet-950"
    : "bg-gradient-to-br from-slate-50 via-blue-50 to-violet-50";

  const cardBg = darkMode ? "bg-slate-900/80 border-slate-700" : "bg-white/90 border-slate-200";

  return (
    <div className={cn("min-h-screen", pageBg)}>
      <header className="sticky top-0 z-30 backdrop-blur-xl border-b border-white/10">
        <motion.div
          className={cn(
            "max-w-7xl mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-4",
            darkMode ? "bg-slate-900/70" : "bg-white/70",
          )}
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-violet-500">
              HostelSync · Mess AI
            </p>
            <h1 className={cn("text-2xl font-bold", darkMode ? "text-white" : "text-slate-900")}>
              Smart Mess Recommendations
            </h1>
            <p className={cn("text-sm", darkMode ? "text-slate-400" : "text-slate-500")}>
              Hi {user?.name || "Student"} · Updated {lastUpdated.toLocaleTimeString()}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadData}
              className="p-2.5 rounded-xl border border-violet-500/30 text-violet-500 hover:bg-violet-500/10"
            >
              <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
            </button>
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2.5 rounded-xl border border-violet-500/30 text-violet-500"
            >
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button
              type="button"
              onClick={() => navigate("/student")}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-medium"
            >
              Dashboard
            </button>
          </div>
        </motion.div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {loading && !menu ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-violet-500" size={40} />
          </div>
        ) : (
          <>
            {/* Today's Menu */}
            <section className={cn("rounded-3xl border p-6 shadow-xl", cardBg)}>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white">
                  <ChefHat size={24} />
                </div>
                <div>
                  <h2 className={cn("text-xl font-bold", darkMode ? "text-white" : "text-slate-800")}>
                    Today&apos;s Menu
                  </h2>
                  <p className={cn("text-sm capitalize", darkMode ? "text-slate-400" : "text-slate-500")}>
                    {menu?.day} · Current: {menu?.mealSlot}
                  </p>
                </div>
              </div>
              {!menu?.hasMenu &&
                !(menu?.breakfast?.length || menu?.lunch?.length || menu?.dinner?.length) && (
                  <motion.div
                    className={cn(
                      "mb-4 p-4 rounded-xl border text-sm",
                      darkMode
                        ? "border-amber-500/40 bg-amber-500/10 text-amber-200"
                        : "border-amber-200 bg-amber-50 text-amber-800",
                    )}
                  >
                    No menu published for this week yet. Mess admin can add it under Mess Management →
                    Weekly Menu.
                  </motion.div>
                )}
              <div className="grid md:grid-cols-3 gap-4">
                {["breakfast", "lunch", "dinner"].map((slot) => {
                  const Icon = MEAL_ICONS[slot];
                  const items = menu?.[slot] || [];
                  const active = menu?.mealSlot === slot;
                  return (
                    <motion.div
                      key={slot}
                      whileHover={{ scale: 1.02 }}
                      className={cn(
                        "rounded-2xl p-4 border transition-all",
                        active
                          ? "border-violet-500 bg-violet-500/10 ring-2 ring-violet-500/30"
                          : darkMode
                            ? "border-slate-700 bg-slate-800/50"
                            : "border-slate-200 bg-slate-50",
                      )}
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <Icon size={18} className="text-violet-500" />
                        <span className="font-semibold capitalize">{slot}</span>
                        {active && (
                          <span className="text-xs bg-violet-500 text-white px-2 py-0.5 rounded-full">
                            Now
                          </span>
                        )}
                      </div>
                      <ul className={cn("space-y-1 text-sm", darkMode ? "text-slate-300" : "text-slate-600")}>
                        {items.length ? items.map((item, i) => <li key={i}>• {item}</li>) : <li>No items listed</li>}
                      </ul>
                    </motion.div>
                  );
                })}
              </div>
            </section>

            {/* Recommended */}
            <section>
              <h2 className={cn("text-lg font-bold mb-4 flex items-center gap-2", darkMode ? "text-white" : "")}>
                <Sparkles className="text-violet-500" /> Recommended for You
              </h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {recommended.map((item) => (
                  <FoodCard
                    key={item._id}
                    item={item}
                    darkMode={darkMode}
                    highlight
                    userRating={ratingsMap[item._id]}
                    userReaction={reactionsMap[item._id]}
                    onRate={handleRate}
                    onReact={handleReact}
                    onReview={setReviewModal}
                  />
                ))}
              </div>
            </section>

            {/* Trending */}
            <section>
              <h2 className={cn("text-lg font-bold mb-4 flex items-center gap-2", darkMode ? "text-white" : "")}>
                <TrendingUp className="text-emerald-500" /> Trending This Week
              </h2>
              <div className="flex gap-4 overflow-x-auto pb-2 custom-scrollbar">
                {trending.map((item, idx) => (
                  <motion.div
                    key={item._id || idx}
                    className={cn(
                      "min-w-[200px] rounded-2xl p-4 border",
                      cardBg,
                    )}
                    whileHover={{ y: -4 }}
                  >
                    <p className="font-bold">{item.name}</p>
                    <p className="text-sm text-violet-500 mt-1">
                      {item.recentRatings || 0} ratings this week
                    </p>
                    <p className="text-amber-500 text-sm mt-2">★ {item.avgRating?.toFixed(1) || "—"}</p>
                  </motion.div>
                ))}
              </div>
            </section>

            {/* Combinations */}
            {combinations.length > 0 && (
              <section className={cn("rounded-3xl border p-6", cardBg)}>
                <h2 className={cn("text-lg font-bold mb-2", darkMode ? "text-white" : "")}>
                  Best Food Combinations
                </h2>
                <p className={cn("text-sm mb-4", darkMode ? "text-slate-400" : "text-slate-500")}>{comboInsight}</p>
                <motion.div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {combinations.map((c, i) => (
                    <div
                      key={i}
                      className={cn(
                        "p-4 rounded-xl border",
                        darkMode ? "border-violet-500/30 bg-violet-500/10" : "border-indigo-100 bg-indigo-50",
                      )}
                    >
                      <p className="font-medium">{c.items?.join(" + ")}</p>
                      <p className="text-xs text-violet-500 mt-1">{c.reason}</p>
                    </div>
                  ))}
                </motion.div>
              </section>
            )}

            {/* Rate today's items */}
            <section>
              <h2 className={cn("text-lg font-bold mb-4", darkMode ? "text-white" : "")}>
                Rate & Review Today&apos;s Meals
              </h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {todayItems.map((item) => (
                  <FoodCard
                    key={item._id}
                    item={item}
                    darkMode={darkMode}
                    userRating={ratingsMap[item._id]}
                    userReaction={reactionsMap[item._id]}
                    onRate={handleRate}
                    onReact={handleReact}
                    onReview={setReviewModal}
                  />
                ))}
              </div>
            </section>
          </>
        )}
      </main>

      <AnimatePresence>
        {reviewModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className={cn("w-full max-w-md rounded-2xl p-6 shadow-2xl", cardBg)}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className={cn("font-bold text-lg", darkMode ? "text-white" : "")}>
                  Review: {reviewModal.name}
                </h3>
                <button type="button" onClick={() => setReviewModal(null)}>
                  <X />
                </button>
              </div>
              <textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                rows={4}
                placeholder="Share your experience... AI will analyze sentiment."
                className={cn(
                  "w-full rounded-xl border p-3 text-sm resize-none",
                  darkMode ? "bg-slate-800 border-slate-600 text-white" : "border-slate-200",
                )}
              />
              <button
                type="button"
                disabled={submitting}
                onClick={submitReview}
                className="mt-4 w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-medium disabled:opacity-50"
              >
                {submitting ? "Analyzing..." : "Submit Review (AI Sentiment)"}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

import { motion } from "framer-motion";
import { ThumbsUp, ThumbsDown, MessageSquare, Sparkles } from "lucide-react";
import { cn } from "../../lib/utils";
import StarRating from "./StarRating";

export default function FoodCard({
  item,
  userRating = 0,
  userReaction = null,
  onRate,
  onReact,
  onReview,
  darkMode,
  highlight,
}) {
  const cardClass = cn(
    "rounded-2xl border p-5 shadow-sm transition-all duration-300",
    darkMode
      ? "border-slate-700/80 bg-slate-800/90 hover:border-violet-500/50 hover:shadow-violet-500/10"
      : "border-slate-200 bg-white hover:border-indigo-300 hover:shadow-lg",
    highlight && "ring-2 ring-violet-500/40",
  );

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      className={cardClass}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          {highlight && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-violet-500 mb-1">
              <Sparkles size={12} /> AI Pick
            </span>
          )}
          <h3 className={cn("font-bold text-lg", darkMode ? "text-white" : "text-slate-800")}>
            {item.name}
          </h3>
          <p className={cn("text-sm", darkMode ? "text-slate-400" : "text-slate-500")}>
            {item.avgRating?.toFixed(1) || "—"} ★ · {item.ratingCount || 0} ratings
          </p>
        </div>
        <div
          className={cn(
            "px-2 py-1 rounded-lg text-xs font-medium capitalize",
            darkMode ? "bg-violet-500/20 text-violet-300" : "bg-indigo-50 text-indigo-600",
          )}
        >
          {item.category || "meal"}
        </div>
      </div>

      <StarRating value={userRating || item.avgRating || 0} onChange={(s) => onRate?.(item._id, s)} />

      <div className="flex items-center gap-2 mt-4">
        <button
          type="button"
          onClick={() => onReact?.(item._id, "like")}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-colors",
            userReaction === "like"
              ? "bg-emerald-500 text-white"
              : darkMode
                ? "bg-slate-700 text-slate-300 hover:bg-emerald-600/30"
                : "bg-slate-100 text-slate-600 hover:bg-emerald-50",
          )}
        >
          <ThumbsUp size={16} /> {item.likeCount || 0}
        </button>
        <button
          type="button"
          onClick={() => onReact?.(item._id, "dislike")}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-colors",
            userReaction === "dislike"
              ? "bg-rose-500 text-white"
              : darkMode
                ? "bg-slate-700 text-slate-300 hover:bg-rose-600/30"
                : "bg-slate-100 text-slate-600 hover:bg-rose-50",
          )}
        >
          <ThumbsDown size={16} />
        </button>
        <button
          type="button"
          onClick={() => onReview?.(item)}
          className={cn(
            "ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium",
            darkMode
              ? "bg-violet-600/30 text-violet-200 hover:bg-violet-600/50"
              : "bg-gradient-to-r from-indigo-500 to-violet-500 text-white hover:opacity-90",
          )}
        >
          <MessageSquare size={16} /> Review
        </button>
      </div>
    </motion.div>
  );
}

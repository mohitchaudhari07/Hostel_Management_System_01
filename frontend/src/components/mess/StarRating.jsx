import { Star } from "lucide-react";
import { cn } from "../../lib/utils";

export default function StarRating({ value = 0, onChange, size = 20, readonly = false }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => !readonly && onChange?.(star)}
          className={cn(
            "transition-transform",
            !readonly && "hover:scale-110 active:scale-95",
            readonly && "cursor-default",
          )}
        >
          <Star
            size={size}
            className={cn(
              star <= value
                ? "fill-amber-400 text-amber-400"
                : "text-slate-300 dark:text-slate-600",
            )}
          />
        </button>
      ))}
    </div>
  );
}

const DAY_NAMES = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

function normalizeDays(days) {
  if (!days) return {};
  if (typeof days === "object" && !Array.isArray(days)) {
    const out = {};
    Object.entries(days).forEach(([key, value]) => {
      out[String(key).toLowerCase()] = value;
    });
    return out;
  }
  return {};
}

function extractMeals(dayMenu) {
  if (!dayMenu) return { breakfast: [], lunch: [], dinner: [] };
  return {
    breakfast: Array.isArray(dayMenu.breakfast) ? dayMenu.breakfast : [],
    lunch: Array.isArray(dayMenu.lunch) ? dayMenu.lunch : [],
    dinner: Array.isArray(dayMenu.dinner) ? dayMenu.dinner : [],
  };
}

/** Parse today's meals from weekly menu API response (fallback when mess-ai returns empty) */
export function parseTodayMenuFromWeekly(menus = []) {
  if (!menus.length) return null;

  const todayKey = DAY_NAMES[new Date().getDay()];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const sorted = [...menus].sort((a, b) => new Date(b.weekOf) - new Date(a.weekOf));

  let selected = sorted[0];
  for (const menu of sorted) {
    const weekStart = new Date(menu.weekOf);
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);
    if (today >= weekStart && today < weekEnd) {
      selected = menu;
      break;
    }
  }

  const days = normalizeDays(selected.days);
  const meals = extractMeals(days[todayKey]);

  const hour = new Date().getHours();
  const mealSlot = hour < 11 ? "breakfast" : hour < 16 ? "lunch" : "dinner";

  return {
    day: todayKey,
    mealSlot,
    weekOf: selected.weekOf,
    ...meals,
    hasMenu: meals.breakfast.length + meals.lunch.length + meals.dinner.length > 0,
  };
}

const axios = require("axios");

const POSITIVE_WORDS = [
  "delicious",
  "tasty",
  "amazing",
  "love",
  "great",
  "excellent",
  "fresh",
  "yummy",
  "best",
  "good",
  "awesome",
  "perfect",
  "satisfying",
  "flavorful",
];

const NEGATIVE_WORDS = [
  "bad",
  "terrible",
  "awful",
  "bland",
  "cold",
  "stale",
  "worst",
  "hate",
  "disgusting",
  "oily",
  "salty",
  "undercooked",
  "overcooked",
  "dirty",
];

function ruleBasedSentiment(text) {
  const lower = (text || "").toLowerCase();
  let score = 0;
  POSITIVE_WORDS.forEach((w) => {
    if (lower.includes(w)) score += 1;
  });
  NEGATIVE_WORDS.forEach((w) => {
    if (lower.includes(w)) score -= 1;
  });

  let sentiment = "neutral";
  if (score >= 2) sentiment = "positive";
  else if (score <= -1) sentiment = "negative";
  else if (score === 1) sentiment = "positive";

  const normalized = Math.max(-1, Math.min(1, score / 5));
  return { sentiment, sentimentScore: normalized, aiSummary: "" };
}

async function callGroq(prompt, system) {
  const key = process.env.GROQ_API_KEY;
  if (!key) return null;

  const res = await axios.post(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: system },
        { role: "user", content: prompt },
      ],
      temperature: 0.3,
      max_tokens: 800,
    },
    {
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      timeout: 20000,
    },
  );

  return res.data?.choices?.[0]?.message?.content?.trim() || null;
}

async function callOpenAI(prompt, system) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;

  const res = await axios.post(
    "https://api.openai.com/v1/chat/completions",
    {
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      messages: [
        { role: "system", content: system },
        { role: "user", content: prompt },
      ],
      temperature: 0.3,
      max_tokens: 800,
    },
    {
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      timeout: 20000,
    },
  );

  return res.data?.choices?.[0]?.message?.content?.trim() || null;
}

async function callGemini(prompt, system) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;

  const model = process.env.GEMINI_MODEL || "gemini-2.0-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;

  const res = await axios.post(
    url,
    {
      contents: [
        {
          parts: [{ text: `${system}\n\n${prompt}` }],
        },
      ],
    },
    { timeout: 20000 },
  );

  return res.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || null;
}

async function askAI(prompt, system) {
  try {
    return (
      (await callGroq(prompt, system)) ||
      (await callOpenAI(prompt, system)) ||
      (await callGemini(prompt, system))
    );
  } catch (err) {
    console.warn("AI provider error:", err.message);
    return null;
  }
}

function parseJsonFromAI(raw) {
  if (!raw) return null;
  const match = raw.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]);
  } catch {
    return null;
  }
}

async function analyzeSentiment(text) {
  const system =
    "You analyze hostel mess food reviews. Reply ONLY with valid JSON: {\"sentiment\":\"positive|neutral|negative\",\"sentimentScore\":number between -1 and 1,\"aiSummary\":\"one short sentence\"}";

  const raw = await askAI(`Review: "${text}"`, system);
  const parsed = parseJsonFromAI(raw);

  if (parsed?.sentiment) {
    return {
      sentiment: ["positive", "neutral", "negative"].includes(parsed.sentiment)
        ? parsed.sentiment
        : "neutral",
      sentimentScore: Number(parsed.sentimentScore) || 0,
      aiSummary: parsed.aiSummary || "",
    };
  }

  return ruleBasedSentiment(text);
}

async function generateWeeklyMenuSuggestions(menuContext, popularItems) {
  const system =
    "You are HostelSync mess AI. Suggest a balanced weekly vegetarian hostel menu for Indian students. Reply ONLY JSON: {\"suggestions\":[{\"day\":\"monday\",\"breakfast\":[],\"lunch\":[],\"dinner\":[]}],\"notes\":\"string\"}";

  const prompt = `Popular items: ${popularItems.slice(0, 15).join(", ") || "dal, rice, roti, paneer"}. Current week sample: ${JSON.stringify(menuContext).slice(0, 1500)}`;

  const raw = await askAI(prompt, system);
  const parsed = parseJsonFromAI(raw);

  if (parsed?.suggestions) return { suggestions: parsed.suggestions, notes: parsed.notes || "", source: "ai" };

  const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
  const pool = popularItems.length ? popularItems : ["Poha", "Dal Chawal", "Roti Sabzi", "Paneer Butter Masala", "Idli Sambar"];
  return {
    suggestions: days.map((day, i) => ({
      day,
      breakfast: [pool[i % pool.length]],
      lunch: [pool[(i + 1) % pool.length], "Dal", "Rice"],
      dinner: [pool[(i + 2) % pool.length], "Roti"],
    })),
    notes: "Rule-based weekly plan (configure GROQ_API_KEY, OPENAI_API_KEY, or GEMINI_API_KEY for AI menus)",
    source: "engine",
  };
}

async function generateCombinationInsight(combos) {
  const system = "Summarize best food pairings for students in 2 sentences. Plain text only.";
  const raw = await askAI(`Top combos: ${JSON.stringify(combos)}`, system);
  return raw || "Students prefer pairing dal with rice and roti with paneer dishes for balanced meals.";
}

module.exports = {
  analyzeSentiment,
  generateWeeklyMenuSuggestions,
  generateCombinationInsight,
  ruleBasedSentiment,
  askAI,
};

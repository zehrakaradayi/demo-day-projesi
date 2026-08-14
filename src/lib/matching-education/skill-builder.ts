import type { SkillLevel, SkillMode, TeachingStyle } from "@/generated/prisma/client";

/**
 * AI Skill Builder (MVP) — brief bölüm 3 "Doğal dili structured skill'e dönüştür".
 * Bu proje henüz bir LLM API key'i içermiyor (bkz. .env.example); bu yüzden gerçek bir
 * dil modeli yerine kural tabanlı bir anahtar kelime analizi kullanılıyor. Amaç formu
 * kullanıcı adına önceden doldurmak — kullanıcı öneriyi her zaman değiştirebilir.
 * İleride gerçek bir AI entegrasyonu bu fonksiyonun yerine geçebilir; imza aynı kalabilir.
 */
export type SkillBuilderSuggestion = {
  mode: SkillMode;
  level: SkillLevel;
  teachingStyle: TeachingStyle | null;
  confidence: "low" | "medium" | "high";
};

const LEARN_HINTS = [
  "öğrenmek istiyorum",
  "öğrenmek",
  "merak ediyorum",
  "yeni başlıyorum",
  "geliştirmek istiyorum",
  "başlamak istiyorum",
];

const TEACH_HINTS = [
  "öğretebilirim",
  "öğretirim",
  "anlatabilirim",
  "yardımcı olabilirim",
  "biliyorum",
  "deneyimliyim",
];

const EXPERT_HINTS = ["uzman", "profesyonel", "yıllardır", "senedir"];
const ADVANCED_HINTS = ["çok iyi", "ileri seviye", "iyi derecede", "rahatlıkla"];
const BEGINNER_HINTS = ["yeni başl", "biraz biliyorum", "temel seviye", "acemi"];

const PROJECT_HINTS = ["proje", "birlikte yap", "uygulamalı"];
const CONVERSATION_HINTS = ["konuşarak", "sohbet", "pratik yapmak"];
const THEORY_HINTS = ["teorik", "kavram", "anlatım"];

function includesAny(text: string, hints: string[]): boolean {
  return hints.some((hint) => text.includes(hint));
}

export function suggestSkillFields(freeText: string): SkillBuilderSuggestion {
  const text = freeText.trim().toLowerCase();

  if (!text) {
    return { mode: "TEACH", level: "INTERMEDIATE", teachingStyle: null, confidence: "low" };
  }

  let mode: SkillMode = "TEACH";
  if (includesAny(text, LEARN_HINTS) && !includesAny(text, TEACH_HINTS)) {
    mode = "LEARN";
  }

  let level: SkillLevel = "INTERMEDIATE";
  if (includesAny(text, EXPERT_HINTS)) level = "EXPERT";
  else if (includesAny(text, ADVANCED_HINTS)) level = "ADVANCED";
  else if (includesAny(text, BEGINNER_HINTS)) level = "BEGINNER";

  let teachingStyle: TeachingStyle | null = null;
  if (includesAny(text, PROJECT_HINTS)) teachingStyle = "PROJECT";
  else if (includesAny(text, CONVERSATION_HINTS)) teachingStyle = "CONVERSATION";
  else if (includesAny(text, THEORY_HINTS)) teachingStyle = "THEORY";

  const matchedHints = [
    includesAny(text, LEARN_HINTS),
    includesAny(text, TEACH_HINTS),
    includesAny(text, EXPERT_HINTS) || includesAny(text, ADVANCED_HINTS) || includesAny(text, BEGINNER_HINTS),
  ].filter(Boolean).length;

  const confidence: SkillBuilderSuggestion["confidence"] =
    matchedHints >= 2 ? "high" : matchedHints === 1 ? "medium" : "low";

  return { mode, level, teachingStyle, confidence };
}

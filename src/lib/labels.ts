// Enum değerleri için Türkçe etiketler (UI görüntüleme + form seçenekleri).

export const SKILL_LEVEL_LABELS = {
  BEGINNER: "Başlangıç",
  INTERMEDIATE: "Orta",
  ADVANCED: "İleri",
  EXPERT: "Uzman",
} as const;

export const YEAR_STATUS_LABELS = {
  PREP: "Hazırlık",
  YEAR_1: "1. Sınıf",
  YEAR_2: "2. Sınıf",
  YEAR_3: "3. Sınıf",
  YEAR_4: "4. Sınıf",
  GRADUATE: "Mezun",
} as const;

export const SOCIAL_ENERGY_LABELS = {
  LOW: "Düşük",
  MEDIUM: "Orta",
  HIGH: "Yüksek",
} as const;

export const PLANNING_STYLE_LABELS = {
  PLANNED: "Planlı",
  SPONTANEOUS: "Spontan",
} as const;

export const PACE_LABELS = {
  CALM: "Sakin",
  ACTIVE: "Aktif",
} as const;

export const MEETING_PREFERENCE_LABELS = {
  ONLINE: "Online",
  IN_PERSON: "Yüz yüze",
  BOTH: "Fark etmez",
} as const;

export const GENDER_LABELS = {
  MALE: "Erkek",
  FEMALE: "Kadın",
  OTHER: "Diğer",
  PREFER_NOT_TO_SAY: "Belirtmek istemiyorum",
} as const;

export const MATCH_MODE_PREFERENCE_LABELS = {
  SIMILAR: "Bana benzeyen biriyle eşleş",
  COMPLEMENTARY: "Beni tamamlayan biriyle eşleş",
  OPPOSITE: "Bana zıt biriyle eşleş",
  NO_PREFERENCE: "Fark etmez",
} as const;

export const SCHOOL_TYPE_LABELS: Record<string, string> = {
  university: "Üniversite",
  high_school: "Lise",
};

export const BUDGET_LEVEL_LABELS: Record<number, string> = {
  1: "Düşük",
  2: "Orta",
  3: "Yüksek",
};

export const AGE_RANGE_OPTIONS = ["13-17", "18-24", "25-34", "35-44", "45+"];

export const AVAILABILITY_SLOTS = [
  "Hafta içi sabah",
  "Hafta içi öğlen",
  "Hafta içi akşam",
  "Hafta sonu sabah",
  "Hafta sonu öğlen",
  "Hafta sonu akşam",
] as const;

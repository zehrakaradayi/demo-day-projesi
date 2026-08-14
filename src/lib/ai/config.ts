// Tüm src/lib/ai/* call site'ları modeli buradan okur — hiçbir yerde hardcode edilmez.
// Google AI Studio'nun ücretsiz katmanı (aistudio.google.com, kredi kartı istemez)
// bu kısa sohbet üretimleri için yeterli — demo day bütçesi için maliyet sıfır.
export const AI_MODEL = process.env.GEMINI_MODEL ?? "gemini-flash-latest";

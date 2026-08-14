// Tüm src/lib/ai/* call site'ları modeli buradan okur — hiçbir yerde hardcode edilmez.
// Google AI Studio'nun ücretsiz katmanı (aistudio.google.com, kredi kartı istemez)
// bu kısa sohbet üretimleri için yeterli — demo day bütçesi için maliyet sıfır.
// "gemini-flash-latest" değil "gemini-flash-lite-latest": ikisinin ücretsiz katman
// kotası (günde 20 istek/model) AYRI sayılıyor — "latest" alias'ı yoğun kullanımdan
// (test + demo) hızlıca tükenebiliyor, "lite" varyantının kendi kotası bu kısa
// yapısal üretimler için zaten fazlasıyla yeterli.
export const AI_MODEL = process.env.GEMINI_MODEL ?? "gemini-flash-lite-latest";

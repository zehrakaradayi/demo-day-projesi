import { z } from "zod";
import { gemini } from "./client";
import { AI_MODEL } from "./config";
import { MeetupPlanSchema, type MeetupPlan } from "./schemas";

export type MeetupPlanInput = {
  city: string;
  peopleCount: number;
  budgetLevel: number | null;
  date: string | null;
  timeRangeStart: string | null;
  timeRangeEnd: string | null;
  vibe: string | null;
  transportPreference: string | null;
  foodOrActivityPreference: string | null;
};

const BUDGET_LEVEL_TEXT: Record<number, string> = {
  1: "düşük",
  2: "orta",
  3: "yüksek",
};

// AI önerisi asla otomatik onaylanmaz/gönderilmez — kullanıcı 3 alternatiften
// birini kendisi seçer. Mekan isimleri modelin genel bilgisinden gelir, canlı
// arama yapılmaz; UI bunu bir uyarı olarak gösterir.
export async function generateMeetupPlan(input: MeetupPlanInput): Promise<MeetupPlan> {
  const prompt = `Bir arkadaş grubu için ${input.city} şehrinde bir buluşma (meetup) planla.

Grup büyüklüğü: ${input.peopleCount} kişi
Bütçe seviyesi: ${input.budgetLevel ? BUDGET_LEVEL_TEXT[input.budgetLevel] : "belirtilmedi"}
Tarih: ${input.date ?? "belirtilmedi"}
Saat aralığı: ${input.timeRangeStart ?? "?"} - ${input.timeRangeEnd ?? "?"}
Hava/tarz (vibe): ${input.vibe ?? "belirtilmedi"}
Ulaşım tercihi: ${input.transportPreference ?? "belirtilmedi"}
Yemek/aktivite tercihi: ${input.foodOrActivityPreference ?? "belirtilmedi"}

Tam olarak 3 alternatif üret: BUDGET (ekonomik), BALANCED (dengeli), PREMIUM (üst düzey).
Her alternatif için 2-4 duraklık bir rota yaz (ör. kafe → atölye/aktivite → yemek → rooftop).
Her durak için: sıra numarası, başlangıç saati ("19:30" formatında), mekan/semt adı, aktivite tipi
(ör. "kafe", "workshop", "yemek", "rooftop", "yürüyüş"), bir önceki duraktan yaklaşık ulaşım
süresi (dakika, ilk durak için null), ve varsa kısa bir not.
Her alternatif için toplam ve kişi başı tahmini bütçe (TL) ve kısa bir özet cümlesi ekle.
Mekan isimleri şehir hakkındaki genel bilgine dayanarak gerçekçi olsun ama uydurma olabileceğini
unutma — kullanıcı bunları teyit etmeli.`;

  // Ücretsiz katmanda model zaman zaman 503 (geçici aşırı yük) döndürüyor —
  // kısa bir backoff ile 2 kez daha dene, sonra çağırana hata olarak bırak.
  const maxAttempts = 3;
  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await gemini.models.generateContent({
        model: AI_MODEL,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseJsonSchema: z.toJSONSchema(MeetupPlanSchema),
        },
      });

      if (!response.text) {
        throw new Error("Meetup planı üretilemedi.");
      }

      return MeetupPlanSchema.parse(JSON.parse(response.text));
    } catch (error) {
      lastError = error;
      if (attempt < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, attempt * 1500));
      }
    }
  }
  throw lastError;
}

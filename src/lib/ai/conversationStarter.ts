import { z } from "zod";
import { gemini } from "./client";
import { AI_MODEL } from "./config";
import { getMatchContext } from "./context";
import { ConversationStarterSchema, type ConversationStarter } from "./schemas";

// Öneri asla otomatik gönderilmez — çağıran taraf (Server Action) bu sonucu
// kullanıcıya onay için gösterir, gönderim ayrı bir action ile yapılır.
export async function generateConversationStarter(
  userAId: string,
  userBId: string,
): Promise<ConversationStarter> {
  const context = await getMatchContext(userAId, userBId);

  const prompt = `İki SkillSwap kullanıcısı yeni eşleşti. ${context.userA.name} için, ${context.userB.name}'e gönderebileceği kısa, samimi ve Türkçe bir ilk mesaj öner.

${context.userA.name} hakkında: şehir=${context.userA.city ?? "bilinmiyor"}, ilgi alanları=${context.userA.interests.join(", ") || "yok"}, okul=${context.userA.school ?? "yok"}, bölüm=${context.userA.department ?? "yok"}
${context.userB.name} hakkında: şehir=${context.userB.city ?? "bilinmiyor"}, ilgi alanları=${context.userB.interests.join(", ") || "yok"}, okul=${context.userB.school ?? "yok"}, bölüm=${context.userB.department ?? "yok"}

Ortak ilgi alanları: ${context.sharedInterests.join(", ") || "yok"}
Tamamlayıcı skill'ler: ${
    context.complementarySkills
      .map(
        (s) =>
          `${s.skillName} (${s.aTeachesBLearns ? `${context.userA.name} öğretebilir` : `${context.userB.name} öğretebilir`})`,
      )
      .join(", ") || "yok"
  }
Aynı şehir: ${context.sameCity ? "evet" : "hayır"}
Aynı okul: ${context.sameSchool ? "evet" : "hayır"}
Aynı bölüm: ${context.sameDepartment ? "evet" : "hayır"}

Mesaj 1-2 cümle olsun, doğal ve arkadaşça bir tonda olsun, doğrudan bir soru içersin. "basedOn" alanına, mesajı hangi ortak noktalara dayandırdığını kısa maddeler halinde yaz (kullanıcıya "neden bu öneri" diye gösterilecek).`;

  const response = await gemini.models.generateContent({
    model: AI_MODEL,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseJsonSchema: z.toJSONSchema(ConversationStarterSchema),
    },
  });

  if (!response.text) {
    throw new Error("Conversation starter üretilemedi.");
  }

  return ConversationStarterSchema.parse(JSON.parse(response.text));
}

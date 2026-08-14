import { prisma } from "@/lib/prisma";
import { awardSkillCredits } from "@/lib/matching-education/queries/skill-credits";
import { checkAndAwardAchievements } from "@/lib/matching-education/queries/missions";

/**
 * Brif bölüm 5 "Rehberlik Session'ları ile puan kazanma": 30 dk → +30, 60 dk → +60.
 * Diğer süreler için de aynı 1:1 oran uygulanıyor.
 */
export function pointsForDuration(durationMinutes: number): number {
  return durationMinutes;
}

export async function awardGuideSessionPoints(sessionId: string) {
  const session = await prisma.guideSession.findUnique({ where: { id: sessionId } });
  if (!session || session.status !== "COMPLETED") return null;

  const existingEntry = await prisma.contributionLedger.findFirst({ where: { guideSessionId: sessionId } });
  if (existingEntry) return existingEntry;

  const points = pointsForDuration(session.durationMinutes);

  const entry = await prisma.contributionLedger.create({
    data: {
      userId: session.guideId,
      points,
      source: "GUIDE_SESSION",
      guideSessionId: sessionId,
    },
  });

  await awardSkillCredits({
    userId: session.guideId,
    amount: points,
    source: "GUIDE_SESSION",
    counterpartyId: session.participantId,
    relatedSessionId: sessionId,
  });

  await checkAndAwardAchievements(session.guideId);

  return entry;
}

export async function getContributionTotal(userId: string) {
  const result = await prisma.contributionLedger.aggregate({
    where: { userId },
    _sum: { points: true },
  });
  return result._sum.points ?? 0;
}

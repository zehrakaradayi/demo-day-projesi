import { prisma } from "@/lib/prisma";

export async function getMissionCatalog() {
  return prisma.mission.findMany({ where: { isActive: true }, include: { skill: true } });
}

export async function getUserMissions(userId: string) {
  return prisma.userMission.findMany({
    where: { userId },
    include: { mission: { include: { skill: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function assignMission(userId: string, missionId: string) {
  return prisma.userMission.upsert({
    where: { userId_missionId: { userId, missionId } },
    update: {},
    create: { userId, missionId },
  });
}

export async function completeMission(userMissionId: string, userId: string, evidence?: string) {
  const um = await prisma.userMission.findUnique({ where: { id: userMissionId }, include: { mission: true } });
  if (!um || um.userId !== userId) throw new Error("Bu mission sana ait değil.");
  if (um.status === "COMPLETED") return um;

  const updated = await prisma.userMission.update({
    where: { id: userMissionId },
    data: { status: "COMPLETED", completedAt: new Date(), evidence: evidence ?? um.evidence },
  });

  await prisma.contributionLedger.create({
    data: { userId, points: um.mission.rewardPoints, source: "OTHER" },
  });

  return updated;
}

const ACHIEVEMENT_CATALOG = [
  { code: "FIRST_EXCHANGE", title: "İlk Exchange", description: "İlk skill'ini ekledin." },
  { code: "FIRST_GUIDE_SESSION", title: "İlk Guide Session", description: "İlk rehberlik session'ını tamamladın." },
  { code: "TEN_PEOPLE_HELPED", title: "10 Kişiye Yardım", description: "10 farklı kişiye rehberlik sağladın." },
  { code: "SCHOOL_GUIDE", title: "School Guide", description: "Okulunda aktif bir rehber oldun." },
] as const;

export async function ensureAchievementCatalog() {
  for (const a of ACHIEVEMENT_CATALOG) {
    await prisma.achievement.upsert({ where: { code: a.code }, update: {}, create: a });
  }
}

async function award(userId: string, code: string) {
  const achievement = await prisma.achievement.findUnique({ where: { code } });
  if (!achievement) return;
  await prisma.userAchievement.upsert({
    where: { userId_achievementId: { userId, achievementId: achievement.id } },
    update: {},
    create: { userId, achievementId: achievement.id },
  });
}

export async function checkAndAwardAchievements(userId: string) {
  const [skillCount, guideSessionCount, distinctHelped, guideProfile] = await Promise.all([
    prisma.userSkill.count({ where: { userId } }),
    prisma.guideSession.count({ where: { guideId: userId, status: "COMPLETED" } }),
    prisma.guideSession.findMany({
      where: { guideId: userId, status: "COMPLETED" },
      distinct: ["participantId"],
      select: { participantId: true },
    }),
    prisma.guideProfile.findUnique({ where: { userId } }),
  ]);

  if (skillCount > 0) await award(userId, "FIRST_EXCHANGE");
  if (guideSessionCount > 0) await award(userId, "FIRST_GUIDE_SESSION");
  if (distinctHelped.length >= 10) await award(userId, "TEN_PEOPLE_HELPED");
  if (guideProfile?.isActive) await award(userId, "SCHOOL_GUIDE");
}

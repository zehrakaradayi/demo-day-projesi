import { prisma } from "@/lib/prisma";
import type { SkillLevel, SkillMode } from "@/generated/prisma/enums";
import { GamificationLevel } from "@/generated/prisma/enums";

const TIERS: { level: GamificationLevel; minPoints: number; label: string }[] = [
  { level: "SKILL_MASTER", minPoints: 500, label: "Skill Master" },
  { level: "MENTOR", minPoints: 200, label: "Mentor" },
  { level: "SKILL_SHARER", minPoints: 60, label: "Skill Sharer" },
  { level: "ACTIVE_LEARNER", minPoints: 20, label: "Active Learner" },
  { level: GamificationLevel.BEGINNER, minPoints: 0, label: "Beginner" },
];

export function gamificationLevelForPoints(points: number) {
  return TIERS.find((tier) => points >= tier.minPoints) ?? TIERS[TIERS.length - 1];
}

export async function recordSkillLevelEvent(userId: string, skillId: string, mode: SkillMode, level: SkillLevel) {
  await prisma.skillLevelEvent.create({ data: { userId, skillId, mode, level } });
}

export async function getSkillDNA(userId: string) {
  const skills = await prisma.userSkill.findMany({ where: { userId }, include: { skill: true } });
  const byCategory = new Map<string, number>();
  for (const s of skills) {
    byCategory.set(s.skill.category, (byCategory.get(s.skill.category) ?? 0) + 1);
  }
  const total = skills.length || 1;
  return [...byCategory.entries()]
    .map(([category, count]) => ({ category, count, percent: Math.round((count / total) * 100) }))
    .sort((a, b) => b.count - a.count);
}

export async function getSkillEvolution(userId: string) {
  return prisma.skillLevelEvent.findMany({
    where: { userId },
    include: { skill: true },
    orderBy: { recordedAt: "asc" },
  });
}

export async function getPassport(userId: string) {
  const [
    userSkills,
    taughtSessions,
    learnedSessions,
    guideSessionsAsGuide,
    contributionSum,
    skillCreditSum,
    hoursTaught,
    hoursLearned,
    guideMinutes,
    userMissions,
    userAchievements,
  ] = await Promise.all([
    prisma.userSkill.findMany({ where: { userId } }),
    prisma.skillSession.count({ where: { teacherId: userId, status: "COMPLETED" } }),
    prisma.skillSession.count({ where: { learnerId: userId, status: "COMPLETED" } }),
    prisma.guideSession.count({ where: { guideId: userId, status: "COMPLETED" } }),
    prisma.contributionLedger.aggregate({ where: { userId }, _sum: { points: true } }),
    prisma.skillCreditLedger.aggregate({ where: { userId }, _sum: { amount: true } }),
    prisma.skillSession.aggregate({ where: { teacherId: userId, status: "COMPLETED" }, _sum: { durationMinutes: true } }),
    prisma.skillSession.aggregate({ where: { learnerId: userId, status: "COMPLETED" }, _sum: { durationMinutes: true } }),
    prisma.guideSession.aggregate({ where: { guideId: userId, status: "COMPLETED" }, _sum: { durationMinutes: true } }),
    prisma.userMission.findMany({ where: { userId }, include: { mission: true }, orderBy: { createdAt: "desc" } }),
    prisma.userAchievement.findMany({ where: { userId }, include: { achievement: true }, orderBy: { earnedAt: "desc" } }),
  ]);

  const totalPoints = contributionSum._sum.points ?? 0;

  return {
    teachSkillCount: userSkills.filter((s) => s.mode === "TEACH").length,
    learnSkillCount: userSkills.filter((s) => s.mode === "LEARN").length,
    completedSkillSessionsTaught: taughtSessions,
    completedSkillSessionsLearned: learnedSessions,
    completedGuideSessions: guideSessionsAsGuide,
    hoursTaughtMinutes: hoursTaught._sum.durationMinutes ?? 0,
    hoursLearnedMinutes: hoursLearned._sum.durationMinutes ?? 0,
    guideMinutes: guideMinutes._sum.durationMinutes ?? 0,
    contributionPoints: totalPoints,
    skillCredits: skillCreditSum._sum.amount ?? 0,
    gamification: gamificationLevelForPoints(totalPoints),
    missions: userMissions,
    achievements: userAchievements,
  };
}

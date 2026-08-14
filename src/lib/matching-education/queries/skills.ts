import { prisma } from "@/lib/prisma";
import type {
  LearningPurpose,
  SkillLevel,
  SkillMode,
  TeachingStyle,
} from "@/generated/prisma/client";

export async function getSkillCatalog() {
  const [skills, counts] = await Promise.all([
    prisma.skill.findMany({ orderBy: [{ category: "asc" }, { name: "asc" }] }),
    prisma.userSkill.groupBy({ by: ["skillId", "mode"], _count: { id: true } }),
  ]);

  return skills.map((skill) => {
    const teachCount = counts.find((c) => c.skillId === skill.id && c.mode === "TEACH")?._count.id ?? 0;
    const learnCount = counts.find((c) => c.skillId === skill.id && c.mode === "LEARN")?._count.id ?? 0;
    return { ...skill, teachCount, learnCount };
  });
}

export async function getUserSkills(userId: string) {
  return prisma.userSkill.findMany({
    where: { userId },
    include: { skill: true },
    orderBy: [{ mode: "asc" }, { createdAt: "desc" }],
  });
}

export async function getSkillById(skillId: string) {
  return prisma.skill.findUnique({ where: { id: skillId } });
}

export async function getPeopleForSkill(skillId: string, mode: SkillMode, excludeUserId?: string) {
  return prisma.userSkill.findMany({
    where: { skillId, mode, ...(excludeUserId ? { userId: { not: excludeUserId } } : {}) },
    include: { user: { select: { id: true, name: true, city: true, network: true, avatarUrl: true } } },
    orderBy: { createdAt: "desc" },
    take: 30,
  });
}

export async function findOrCreateSkillByName(name: string, category: string) {
  const trimmed = name.trim();
  return prisma.skill.upsert({
    where: { name: trimmed },
    update: {},
    create: { name: trimmed, category: category.trim() || "Diğer" },
  });
}

export type UpsertUserSkillInput = {
  userId: string;
  skillId: string;
  mode: SkillMode;
  level: SkillLevel;
  teachingStyle?: TeachingStyle | null;
  learningPurpose?: LearningPurpose | null;
  experienceYears?: number | null;
};

export async function upsertUserSkill(input: UpsertUserSkillInput) {
  return prisma.userSkill.upsert({
    where: { userId_skillId_mode: { userId: input.userId, skillId: input.skillId, mode: input.mode } },
    update: {
      level: input.level,
      teachingStyle: input.teachingStyle ?? null,
      learningPurpose: input.learningPurpose ?? null,
      experienceYears: input.experienceYears ?? null,
    },
    create: input,
  });
}

export async function deleteUserSkill(id: string, userId: string) {
  return prisma.userSkill.deleteMany({ where: { id, userId } });
}

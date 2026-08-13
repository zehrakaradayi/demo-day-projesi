import { prisma } from "@/lib/prisma";
import type { SkillLevel, SkillMode } from "@/generated/prisma/client";

export async function getCourseCatalog() {
  const [courses, counts] = await Promise.all([
    prisma.course.findMany({
      orderBy: { name: "asc" },
      include: { topics: { orderBy: [{ level: "asc" }, { name: "asc" }] } },
    }),
    prisma.userCourseTopic.groupBy({ by: ["topicId", "mode"], _count: { id: true } }),
  ]);

  return courses.map((course) => ({
    ...course,
    topics: course.topics.map((topic) => ({
      ...topic,
      teachCount: counts.find((c) => c.topicId === topic.id && c.mode === "TEACH")?._count.id ?? 0,
      learnCount: counts.find((c) => c.topicId === topic.id && c.mode === "LEARN")?._count.id ?? 0,
    })),
  }));
}

export async function getUserCourseTopics(userId: string) {
  return prisma.userCourseTopic.findMany({
    where: { userId },
    include: { topic: { include: { course: true } } },
    orderBy: [{ mode: "asc" }, { createdAt: "desc" }],
  });
}

export async function getTopicById(topicId: string) {
  return prisma.courseTopic.findUnique({ where: { id: topicId }, include: { course: true } });
}

export async function getPeopleForTopic(topicId: string, mode: SkillMode, excludeUserId?: string) {
  return prisma.userCourseTopic.findMany({
    where: { topicId, mode, ...(excludeUserId ? { userId: { not: excludeUserId } } : {}) },
    include: { user: { select: { id: true, name: true, city: true, network: true, avatarUrl: true } } },
    orderBy: { createdAt: "desc" },
    take: 30,
  });
}

export async function findOrCreateTopic(courseId: string, name: string, level: string) {
  const trimmedName = name.trim();
  const trimmedLevel = level.trim();
  return prisma.courseTopic.upsert({
    where: { courseId_name_level: { courseId, name: trimmedName, level: trimmedLevel } },
    update: {},
    create: { courseId, name: trimmedName, level: trimmedLevel },
  });
}

export type UpsertUserCourseTopicInput = {
  userId: string;
  topicId: string;
  mode: SkillMode;
  level: SkillLevel;
};

export async function upsertUserCourseTopic(input: UpsertUserCourseTopicInput) {
  return prisma.userCourseTopic.upsert({
    where: { userId_topicId_mode: { userId: input.userId, topicId: input.topicId, mode: input.mode } },
    update: { level: input.level },
    create: input,
  });
}

export async function deleteUserCourseTopic(id: string, userId: string) {
  return prisma.userCourseTopic.deleteMany({ where: { id, userId } });
}

import { prisma } from "@/lib/prisma";
import type { Network } from "@/generated/prisma/client";

export async function searchCatalog(query: string) {
  const q = query.trim();
  if (!q) return { skills: [], topics: [], schools: [], departments: [] };

  const [skills, topics, schools, departments] = await Promise.all([
    prisma.skill.findMany({
      where: { name: { contains: q, mode: "insensitive" } },
      orderBy: { name: "asc" },
      take: 8,
    }),
    prisma.courseTopic.findMany({
      where: { name: { contains: q, mode: "insensitive" } },
      include: { course: true },
      orderBy: { name: "asc" },
      take: 8,
    }),
    prisma.school.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { city: { contains: q, mode: "insensitive" } },
        ],
      },
      orderBy: { name: "asc" },
      take: 8,
    }),
    prisma.department.findMany({
      where: { name: { contains: q, mode: "insensitive" } },
      include: { school: true },
      orderBy: { name: "asc" },
      take: 8,
    }),
  ]);

  return { skills, topics, schools, departments };
}

export async function getNewInTownUsers(network: Network | undefined, excludeUserId: string) {
  return prisma.user.findMany({
    where: {
      id: { not: excludeUserId },
      lifestyleProfile: { isNewInCity: true },
      ...(network ? { network } : {}),
    },
    include: {
      lifestyleProfile: true,
      educations: { include: { school: true }, take: 1 },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
}

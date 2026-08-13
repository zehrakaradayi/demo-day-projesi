import { prisma } from "@/lib/prisma";
import type { YearStatus } from "@/generated/prisma/client";

export async function searchSchools(query?: string) {
  const [schools, studentCounts, departmentCounts] = await Promise.all([
    prisma.school.findMany({
      where: query
        ? {
            OR: [
              { name: { contains: query, mode: "insensitive" } },
              { city: { contains: query, mode: "insensitive" } },
            ],
          }
        : undefined,
      orderBy: { name: "asc" },
    }),
    prisma.userEducation.groupBy({ by: ["schoolId"], _count: { id: true } }),
    prisma.department.groupBy({ by: ["schoolId"], _count: { id: true } }),
  ]);

  return schools.map((school) => ({
    ...school,
    studentCount: studentCounts.find((c) => c.schoolId === school.id)?._count.id ?? 0,
    departmentCount: departmentCounts.find((c) => c.schoolId === school.id)?._count.id ?? 0,
  }));
}

export async function getSchoolById(schoolId: string) {
  const school = await prisma.school.findUnique({
    where: { id: schoolId },
    include: { departments: { orderBy: { name: "asc" } } },
  });
  if (!school) return null;

  const [departmentStudentCounts, educations] = await Promise.all([
    prisma.userEducation.groupBy({
      by: ["departmentId"],
      where: { schoolId },
      _count: { id: true },
    }),
    prisma.userEducation.findMany({
      where: { schoolId },
      select: { userId: true },
    }),
  ]);

  const studentUserIds = educations.map((e) => e.userId);

  const topSkills = studentUserIds.length
    ? await prisma.userSkill.groupBy({
        by: ["skillId"],
        where: { userId: { in: studentUserIds } },
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: 8,
      })
    : [];

  const skillDetails = topSkills.length
    ? await prisma.skill.findMany({ where: { id: { in: topSkills.map((s) => s.skillId) } } })
    : [];

  const guides = studentUserIds.length
    ? await prisma.guideProfile.findMany({
        where: { userId: { in: studentUserIds }, isActive: true },
        include: { user: { select: { id: true, name: true, city: true } } },
        take: 10,
      })
    : [];

  return {
    ...school,
    departments: school.departments.map((department) => ({
      ...department,
      studentCount:
        departmentStudentCounts.find((c) => c.departmentId === department.id)?._count.id ?? 0,
    })),
    studentCount: studentUserIds.length,
    popularSkills: topSkills
      .map((entry) => ({
        skill: skillDetails.find((s) => s.id === entry.skillId)!,
        count: entry._count.id,
      }))
      .filter((entry) => entry.skill),
    guides,
  };
}

export async function getDepartmentById(schoolId: string, departmentId: string, yearFilter?: YearStatus) {
  const department = await prisma.department.findFirst({
    where: { id: departmentId, schoolId },
    include: { school: true },
  });
  if (!department) return null;

  const educations = await prisma.userEducation.findMany({
    where: { departmentId, ...(yearFilter ? { yearStatus: yearFilter } : {}) },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          avatarUrl: true,
          city: true,
          userSkills: { include: { skill: true }, where: { mode: "TEACH" }, take: 4 },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const studentUserIds = educations.map((e) => e.userId);

  const guides = studentUserIds.length
    ? await prisma.guideProfile.findMany({
        where: { userId: { in: studentUserIds }, isActive: true },
        include: { user: { select: { id: true, name: true, avatarUrl: true, city: true } } },
      })
    : [];

  return { department, educations, guides };
}

export type UpsertUserEducationInput = {
  userId: string;
  schoolId: string;
  departmentId?: string | null;
  yearStatus?: YearStatus | null;
};

export async function upsertUserEducation(input: UpsertUserEducationInput) {
  const departmentId = input.departmentId ?? null;
  const existing = await prisma.userEducation.findFirst({
    where: { userId: input.userId, schoolId: input.schoolId, departmentId },
  });

  if (existing) {
    return prisma.userEducation.update({
      where: { id: existing.id },
      data: { yearStatus: input.yearStatus ?? existing.yearStatus },
    });
  }

  return prisma.userEducation.create({
    data: {
      userId: input.userId,
      schoolId: input.schoolId,
      departmentId,
      yearStatus: input.yearStatus ?? null,
    },
  });
}

export async function getUserEducations(userId: string) {
  return prisma.userEducation.findMany({
    where: { userId },
    include: { school: true, department: true },
    orderBy: { createdAt: "desc" },
  });
}

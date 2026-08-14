import { prisma } from "@/lib/prisma";

export type MatchContextUser = {
  id: string;
  name: string;
  city: string | null;
  interests: string[];
  hobbies: string[];
  skills: { name: string; mode: "TEACH" | "LEARN" }[];
  school: string | null;
  department: string | null;
};

export type MatchContext = {
  userA: MatchContextUser;
  userB: MatchContextUser;
  sharedInterests: string[];
  complementarySkills: { skillName: string; aTeachesBLearns: boolean }[];
  sameSchool: boolean;
  sameDepartment: boolean;
  sameCity: boolean;
};

async function loadMatchContextUser(userId: string): Promise<MatchContextUser> {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    include: {
      lifestyleProfile: true,
      userSkills: { include: { skill: true } },
      educations: {
        include: { school: true, department: true },
        take: 1,
        orderBy: { createdAt: "desc" },
      },
    },
  });

  const education = user.educations[0];

  return {
    id: user.id,
    name: user.name,
    city: user.city,
    interests: user.lifestyleProfile?.interests ?? [],
    hobbies: user.lifestyleProfile?.hobbies ?? [],
    skills: user.userSkills.map((us) => ({ name: us.skill.name, mode: us.mode })),
    school: education?.school.name ?? null,
    department: education?.department?.name ?? null,
  };
}

export async function getMatchContext(
  userAId: string,
  userBId: string,
): Promise<MatchContext> {
  const [userA, userB] = await Promise.all([
    loadMatchContextUser(userAId),
    loadMatchContextUser(userBId),
  ]);

  const sharedInterests = userA.interests.filter((interest) =>
    userB.interests.includes(interest),
  );

  const complementarySkills: MatchContext["complementarySkills"] = [];
  for (const skillA of userA.skills) {
    if (skillA.mode !== "TEACH") continue;
    const bLearns = userB.skills.some(
      (s) => s.name === skillA.name && s.mode === "LEARN",
    );
    if (bLearns) {
      complementarySkills.push({ skillName: skillA.name, aTeachesBLearns: true });
    }
  }
  for (const skillB of userB.skills) {
    if (skillB.mode !== "TEACH") continue;
    const aLearns = userA.skills.some(
      (s) => s.name === skillB.name && s.mode === "LEARN",
    );
    if (aLearns) {
      complementarySkills.push({ skillName: skillB.name, aTeachesBLearns: false });
    }
  }

  return {
    userA,
    userB,
    sharedInterests,
    complementarySkills,
    sameSchool: Boolean(userA.school) && userA.school === userB.school,
    sameDepartment: Boolean(userA.department) && userA.department === userB.department,
    sameCity: Boolean(userA.city) && userA.city === userB.city,
  };
}

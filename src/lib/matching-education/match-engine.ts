import { prisma } from "@/lib/prisma";
import type { MatchModePreference } from "@/generated/prisma/client";

const PROFILE_INCLUDE = {
  lifestyleProfile: true,
  userSkills: { include: { skill: true } },
  userCourseTopics: { include: { topic: { include: { course: true } } } },
  educations: { include: { school: true, department: true } },
} as const;

async function loadProfile(userId: string) {
  return prisma.user.findUnique({ where: { id: userId }, include: PROFILE_INCLUDE });
}

type Profile = NonNullable<Awaited<ReturnType<typeof loadProfile>>>;

export type MatchReason = {
  factor: string;
  label: string;
  detail: string;
  points: number;
};

export type MatchResult = {
  userId: string;
  name: string;
  avatarUrl: string | null;
  city: string | null;
  network: string;
  score: number;
  reasons: MatchReason[];
  mode: MatchModePreference;
  status: string;
  topTeachSkills: string[];
  school: string | null;
  department: string | null;
};

function passesSafetyFilters(me: Profile, candidate: Profile): boolean {
  if (me.isMinor !== candidate.isMinor) return false; // bölüm 16: reşit olmayanlar ayrı havuzda

  const meWants = me.genderPreference;
  if (meWants && meWants !== "EVERYONE" && candidate.gender && candidate.gender !== meWants) return false;

  const candidateWants = candidate.genderPreference;
  if (candidateWants && candidateWants !== "EVERYONE" && me.gender && me.gender !== candidateWants) return false;

  return true;
}

function similarityRatio(me: Profile, candidate: Profile): number {
  const a = me.lifestyleProfile;
  const b = candidate.lifestyleProfile;
  if (!a || !b) return 0.5;

  const fields = ["socialEnergy", "planningStyle", "pace", "groupSizePreference"] as const;
  let comparable = 0;
  let matches = 0;
  for (const field of fields) {
    if (a[field] && b[field]) {
      comparable++;
      if (a[field] === b[field]) matches++;
    }
  }
  return comparable === 0 ? 0.5 : matches / comparable;
}

function availabilityOverlapCount(me: Profile, candidate: Profile): number {
  const a = me.lifestyleProfile?.availability;
  const b = candidate.lifestyleProfile?.availability;
  if (!a || !b || typeof a !== "object" || typeof b !== "object" || Array.isArray(a) || Array.isArray(b)) return 0;

  let shared = 0;
  for (const day of Object.keys(a as Record<string, unknown>)) {
    const slotsA = (a as Record<string, unknown>)[day];
    const slotsB = (b as Record<string, unknown>)[day];
    if (Array.isArray(slotsA) && Array.isArray(slotsB) && slotsA.some((slot) => slotsB.includes(slot))) {
      shared++;
    }
  }
  return shared;
}

function scorePair(me: Profile, candidate: Profile): { score: number; reasons: MatchReason[]; mode: MatchModePreference } {
  const reasons: MatchReason[] = [];

  // 1) Skill reciprocity (0-25)
  const myTeach = new Set(me.userSkills.filter((s) => s.mode === "TEACH").map((s) => s.skillId));
  const myLearn = new Set(me.userSkills.filter((s) => s.mode === "LEARN").map((s) => s.skillId));
  const theirTeach = candidate.userSkills.filter((s) => s.mode === "TEACH");
  const theirLearn = candidate.userSkills.filter((s) => s.mode === "LEARN");

  const iCanTeachThem = theirLearn.filter((s) => myTeach.has(s.skillId));
  const theyCanTeachMe = theirTeach.filter((s) => myLearn.has(s.skillId));
  const reciprocalNames = [...iCanTeachThem, ...theyCanTeachMe].map((s) => s.skill.name);
  const skillScore = Math.min(25, (iCanTeachThem.length + theyCanTeachMe.length) * 9);
  if (skillScore > 0) {
    reasons.push({
      factor: "skill_reciprocity",
      label: "Karşılıklı skill uyumu",
      detail: `Ortak: ${[...new Set(reciprocalNames)].join(", ")}`,
      points: skillScore,
    });
  }

  // 2) Ortak ders konuları (0-10)
  const myTopics = new Set(me.userCourseTopics.map((t) => t.topicId));
  const sharedTopics = candidate.userCourseTopics.filter((t) => myTopics.has(t.topicId));
  const courseScore = Math.min(10, sharedTopics.length * 6);
  if (courseScore > 0) {
    reasons.push({
      factor: "course_topic_overlap",
      label: "Ortak ders konusu",
      detail: `Ortak: ${[...new Set(sharedTopics.map((t) => t.topic.name))].join(", ")}`,
      points: courseScore,
    });
  }

  // 3) Okul / bölüm uyumu (0-15)
  const mySchoolIds = new Set(me.educations.map((e) => e.schoolId));
  const myDepartmentIds = new Set(me.educations.filter((e) => e.departmentId).map((e) => e.departmentId));
  const sameDeptEdu = candidate.educations.find((e) => e.departmentId && myDepartmentIds.has(e.departmentId));
  const sameSchoolEdu = candidate.educations.find((e) => mySchoolIds.has(e.schoolId));
  let schoolScore = 0;
  if (sameDeptEdu) {
    schoolScore = 15;
    reasons.push({
      factor: "department_match",
      label: "Aynı bölüm",
      detail: `${sameDeptEdu.school.name} — ${sameDeptEdu.department?.name}`,
      points: schoolScore,
    });
  } else if (sameSchoolEdu) {
    schoolScore = 8;
    reasons.push({
      factor: "school_match",
      label: "Aynı okul",
      detail: sameSchoolEdu.school.name,
      points: schoolScore,
    });
  }

  // 4) Network (TR/Global) uyumu (0-10)
  const networkScore = me.network === candidate.network ? 10 : 0;
  if (networkScore > 0) {
    reasons.push({
      factor: "network_match",
      label: "Aynı ağ",
      detail: me.network === "TURKIYE" ? "Türkiye" : "Global",
      points: networkScore,
    });
  }

  // 5) Ortak ilgi alanları / hobiler (0-15)
  const myInterests = new Set([
    ...(me.lifestyleProfile?.interests ?? []),
    ...(me.lifestyleProfile?.hobbies ?? []),
  ]);
  const theirInterests = [
    ...(candidate.lifestyleProfile?.interests ?? []),
    ...(candidate.lifestyleProfile?.hobbies ?? []),
  ];
  const sharedInterests = [...new Set(theirInterests.filter((i) => myInterests.has(i)))];
  const interestScore = Math.min(15, sharedInterests.length * 5);
  if (interestScore > 0) {
    reasons.push({
      factor: "shared_interests",
      label: "Ortak ilgi alanları",
      detail: sharedInterests.join(", "),
      points: interestScore,
    });
  }

  // 6) Lifestyle / match mode uyumu (0-15)
  const ratio = similarityRatio(me, candidate);
  const preference: MatchModePreference = me.lifestyleProfile?.matchModePreference ?? "NO_PREFERENCE";
  let matchModeScore: number;
  let matchModeLabel: string;
  if (preference === "SIMILAR") {
    matchModeScore = Math.round(ratio * 15);
    matchModeLabel = "Benzer yaşam tarzı";
  } else if (preference === "OPPOSITE") {
    matchModeScore = Math.round((1 - ratio) * 15);
    matchModeLabel = "Zıt yaşam tarzı";
  } else if (preference === "COMPLEMENTARY") {
    matchModeScore = Math.round((1 - Math.abs(ratio - 0.5) * 2) * 15);
    matchModeLabel = "Tamamlayıcı yaşam tarzı";
  } else {
    matchModeScore = Math.round(ratio * 7); // tercih yoksa hafif "benzerlik" varsayımı
    matchModeLabel = "Yaşam tarzı uyumu";
  }
  if (matchModeScore > 0) {
    reasons.push({
      factor: "lifestyle_compatibility",
      label: matchModeLabel,
      detail: `Uyum oranı: %${Math.round(ratio * 100)}`,
      points: matchModeScore,
    });
  }

  // 7) Müsaitlik örtüşmesi (0-5)
  const overlapDays = availabilityOverlapCount(me, candidate);
  const availabilityScore = Math.min(5, overlapDays * 3);
  if (availabilityScore > 0) {
    reasons.push({
      factor: "availability_overlap",
      label: "Müsaitlik örtüşmesi",
      detail: `${overlapDays} gün ortak müsaitlik`,
      points: availabilityScore,
    });
  }

  // 8) New in Town (0-5) — bölüm 9: yeni şehre gelenlere yerel bağlantı önceliği
  let newInTownScore = 0;
  if (candidate.lifestyleProfile?.isNewInCity && me.city && me.city === candidate.city) {
    newInTownScore = 5;
    reasons.push({
      factor: "new_in_town",
      label: "Şehirde yeni",
      detail: `${candidate.city} için yerel bağlantı`,
      points: newInTownScore,
    });
  }

  const total = Math.min(
    100,
    skillScore + courseScore + schoolScore + networkScore + interestScore + matchModeScore + availabilityScore + newInTownScore,
  );

  reasons.sort((a, b) => b.points - a.points);

  return { score: total, reasons, mode: preference };
}

export async function computeMatches(userId: string, limit = 20): Promise<MatchResult[]> {
  const me = await loadProfile(userId);
  if (!me) return [];

  const blocks = await prisma.block.findMany({
    where: { OR: [{ blockerId: userId }, { blockedId: userId }] },
  });
  const blockedIds = new Set(blocks.map((b) => (b.blockerId === userId ? b.blockedId : b.blockerId)));

  const candidates = await prisma.user.findMany({
    where: { id: { notIn: [userId, ...blockedIds] } },
    include: PROFILE_INCLUDE,
  });

  const scored = candidates
    .filter((candidate) => passesSafetyFilters(me, candidate))
    .map((candidate) => ({ candidate, ...scorePair(me, candidate) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  const upserted = await Promise.all(
    scored.map(({ candidate, score, reasons, mode }) =>
      prisma.match.upsert({
        where: { userAId_userBId: { userAId: userId, userBId: candidate.id } },
        update: { score, reasons, mode },
        create: { userAId: userId, userBId: candidate.id, score, reasons, mode },
      }),
    ),
  );

  return scored.map(({ candidate, reasons, mode }, index) => {
    const row = upserted[index];
    return {
      userId: candidate.id,
      name: candidate.name,
      avatarUrl: candidate.avatarUrl,
      city: candidate.city,
      network: candidate.network,
      score: row.score,
      reasons,
      mode,
      status: row.status,
      topTeachSkills: candidate.userSkills
        .filter((s) => s.mode === "TEACH")
        .slice(0, 4)
        .map((s) => s.skill.name),
      school: candidate.educations[0]?.school.name ?? null,
      department: candidate.educations[0]?.department?.name ?? null,
    };
  });
}

export async function isMutualLike(userId: string, otherUserId: string): Promise<boolean> {
  const [mine, theirs] = await Promise.all([
    prisma.match.findUnique({ where: { userAId_userBId: { userAId: userId, userBId: otherUserId } } }),
    prisma.match.findUnique({ where: { userAId_userBId: { userAId: otherUserId, userBId: userId } } }),
  ]);
  return mine?.status === "LIKED" && theirs?.status === "LIKED";
}

export async function setMatchStatus(userId: string, otherUserId: string, status: "LIKED" | "PASSED") {
  const updated = await prisma.match.update({
    where: { userAId_userBId: { userAId: userId, userBId: otherUserId } },
    data: { status },
  });

  if (status === "LIKED" && (await isMutualLike(userId, otherUserId))) {
    await prisma.match.update({
      where: { userAId_userBId: { userAId: userId, userBId: otherUserId } },
      data: { status: "MUTUAL" },
    });
    await prisma.match.updateMany({
      where: { userAId: otherUserId, userBId: userId },
      data: { status: "MUTUAL" },
    });
  }

  return updated;
}

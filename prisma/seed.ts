import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import type {
  School,
  Department,
  Skill,
  CourseTopic,
} from "../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const SKILLS: { name: string; category: string }[] = [
  { name: "Python", category: "Yazılım" },
  { name: "JavaScript", category: "Yazılım" },
  { name: "Figma", category: "Tasarım" },
  { name: "Machine Learning", category: "Yazılım" },
  { name: "Almanca", category: "Dil" },
  { name: "İngilizce", category: "Dil" },
  { name: "Gitar", category: "Müzik" },
  { name: "Fotoğrafçılık", category: "Sanat" },
  { name: "Excel", category: "Ofis" },
  { name: "Public Speaking", category: "Kişisel Gelişim" },
];

const COURSES: { name: string; category: string; topics: { name: string; level: string }[] }[] = [
  {
    name: "Matematik",
    category: "Fen Bilimleri",
    topics: [
      { name: "Türev", level: "Lise" },
      { name: "İntegral", level: "Lise" },
      { name: "Lineer Cebir", level: "Üniversite" },
    ],
  },
  {
    name: "Fizik",
    category: "Fen Bilimleri",
    topics: [
      { name: "Newton Yasaları", level: "Lise" },
      { name: "Elektromanyetizma", level: "Üniversite" },
    ],
  },
  {
    name: "Bilgisayar Bilimleri",
    category: "Mühendislik",
    topics: [
      { name: "Veri Yapıları", level: "Üniversite" },
      { name: "Algoritmalar", level: "Üniversite" },
    ],
  },
];

const SCHOOLS: {
  name: string;
  country: string;
  city: string;
  type: string;
  departments: { name: string; faculty: string; category: string }[];
}[] = [
  {
    name: "İstanbul Teknik Üniversitesi",
    country: "Türkiye",
    city: "İstanbul",
    type: "university",
    departments: [
      { name: "Bilgisayar Mühendisliği", faculty: "Bilgisayar ve Bilişim Fakültesi", category: "Mühendislik" },
      { name: "Elektrik-Elektronik Mühendisliği", faculty: "Elektrik-Elektronik Fakültesi", category: "Mühendislik" },
      { name: "Endüstri Mühendisliği", faculty: "İşletme Fakültesi", category: "Mühendislik" },
    ],
  },
  {
    name: "Boğaziçi Üniversitesi",
    country: "Türkiye",
    city: "İstanbul",
    type: "university",
    departments: [
      { name: "Bilgisayar Mühendisliği", faculty: "Mühendislik Fakültesi", category: "Mühendislik" },
      { name: "Psikoloji", faculty: "Fen-Edebiyat Fakültesi", category: "Sosyal Bilimler" },
    ],
  },
  {
    name: "Orta Doğu Teknik Üniversitesi",
    country: "Türkiye",
    city: "Ankara",
    type: "university",
    departments: [
      { name: "Bilgisayar Mühendisliği", faculty: "Mühendislik Fakültesi", category: "Mühendislik" },
      { name: "İşletme", faculty: "İktisadi ve İdari Bilimler Fakültesi", category: "Sosyal Bilimler" },
    ],
  },
];

async function main() {
  const skillsByName = new Map<string, Awaited<ReturnType<typeof prisma.skill.upsert>>>();
  const topicsByKey = new Map<string, Awaited<ReturnType<typeof prisma.courseTopic.upsert>>>();
  const schoolsByName = new Map<string, Awaited<ReturnType<typeof prisma.school.upsert>>>();
  const departmentsByKey = new Map<string, Awaited<ReturnType<typeof prisma.department.upsert>>>();

  for (const skill of SKILLS) {
    const createdSkill = await prisma.skill.upsert({
      where: { name: skill.name },
      update: {},
      create: skill,
    });
    skillsByName.set(skill.name, createdSkill);
  }

  for (const course of COURSES) {
    const createdCourse = await prisma.course.upsert({
      where: { name: course.name },
      update: {},
      create: { name: course.name, category: course.category },
    });

    for (const topic of course.topics) {
      const createdTopic = await prisma.courseTopic.upsert({
        where: {
          courseId_name_level: {
            courseId: createdCourse.id,
            name: topic.name,
            level: topic.level,
          },
        },
        update: {},
        create: {
          courseId: createdCourse.id,
          name: topic.name,
          level: topic.level,
        },
      });
      topicsByKey.set(`${course.name}::${topic.name}`, createdTopic);
    }
  }

  for (const school of SCHOOLS) {
    const createdSchool = await prisma.school.upsert({
      where: {
        name_city_country: {
          name: school.name,
          city: school.city,
          country: school.country,
        },
      },
      update: {},
      create: {
        name: school.name,
        country: school.country,
        city: school.city,
        type: school.type,
      },
    });
    schoolsByName.set(school.name, createdSchool);

    for (const department of school.departments) {
      const createdDepartment = await prisma.department.upsert({
        where: {
          schoolId_name: {
            schoolId: createdSchool.id,
            name: department.name,
          },
        },
        update: {},
        create: {
          schoolId: createdSchool.id,
          name: department.name,
          faculty: department.faculty,
          category: department.category,
        },
      });
      departmentsByKey.set(`${school.name}::${department.name}`, createdDepartment);
    }
  }

  console.log("Seed tamamlandı: skills, courses, schools/departments.");

  await seedDemoUsers({ skillsByName, topicsByKey, schoolsByName, departmentsByKey });

  console.log("Seed tamamlandı: demo kullanıcılar (matching-education).");
}

// ---------- Demo kullanıcılar (student2 / feature/matching-education) ----------
// Auth branch henüz gerçek Supabase kullanıcıları üretmediği için /skills, /dersler,
// /okullar, /eslesme sayfalarını test edilebilir kılan sabit id'li demo kullanıcılar.
// Bkz. src/lib/matching-education/current-user.ts (dev-only fallback bu kullanıcılara düşer).

type SeedContext = {
  skillsByName: Map<string, Skill>;
  topicsByKey: Map<string, CourseTopic>;
  schoolsByName: Map<string, School>;
  departmentsByKey: Map<string, Department>;
};

type DemoUserSpec = {
  id: string;
  email: string;
  name: string;
  city: string | null;
  country: string | null;
  network: "TURKIYE" | "GLOBAL";
  gender?: "MALE" | "FEMALE" | "OTHER" | "PREFER_NOT_TO_SAY";
  genderPreference?: "MALE" | "FEMALE" | "EVERYONE";
  languages?: string[];
  lifestyle?: {
    socialEnergy?: "LOW" | "MEDIUM" | "HIGH";
    planningStyle?: "PLANNED" | "SPONTANEOUS";
    pace?: "CALM" | "ACTIVE";
    groupSizePreference?: "SMALL_GROUP" | "LARGE_GROUP" | "EITHER";
    matchModePreference?: "SIMILAR" | "COMPLEMENTARY" | "OPPOSITE" | "NO_PREFERENCE";
    interests?: string[];
    hobbies?: string[];
    isNewInCity?: boolean;
  };
  teach?: { skill: string; level: "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "EXPERT" }[];
  learn?: { skill: string; level: "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "EXPERT" }[];
  teachTopics?: { course: string; topic: string; level: "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "EXPERT" }[];
  learnTopics?: { course: string; topic: string; level: "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "EXPERT" }[];
  education?: {
    school: string;
    department?: string;
    yearStatus?: "PREP" | "YEAR_1" | "YEAR_2" | "YEAR_3" | "YEAR_4" | "GRADUATE";
  };
  guide?: { topics: string[]; sessionDurations: number[]; guideType: "STUDENT" | "ALUMNI" };
};

const DEMO_USERS: DemoUserSpec[] = [
  {
    id: "11111111-1111-4111-8111-111111111111",
    email: "demo.ayse@skillswap.local",
    name: "Ayşe Yılmaz",
    city: "İstanbul",
    country: "Türkiye",
    network: "TURKIYE",
    gender: "FEMALE",
    genderPreference: "EVERYONE",
    languages: ["Türkçe", "İngilizce"],
    lifestyle: {
      socialEnergy: "MEDIUM",
      planningStyle: "PLANNED",
      pace: "CALM",
      groupSizePreference: "SMALL_GROUP",
      matchModePreference: "SIMILAR",
      interests: ["Kahve", "Kitap"],
      hobbies: ["Gitar"],
    },
    teach: [
      { skill: "Python", level: "ADVANCED" },
      { skill: "Figma", level: "INTERMEDIATE" },
    ],
    learn: [{ skill: "Machine Learning", level: "BEGINNER" }],
    teachTopics: [{ course: "Matematik", topic: "Türev", level: "ADVANCED" }],
    education: { school: "İstanbul Teknik Üniversitesi", department: "Bilgisayar Mühendisliği", yearStatus: "YEAR_3" },
    guide: {
      topics: ["Bölümümü tanıtabilirim", "Hazırlık nasıl?"],
      sessionDurations: [30, 60],
      guideType: "STUDENT",
    },
  },
  {
    id: "22222222-2222-4222-8222-222222222222",
    email: "demo.mert@skillswap.local",
    name: "Mert Kaya",
    city: "İstanbul",
    country: "Türkiye",
    network: "TURKIYE",
    gender: "MALE",
    genderPreference: "EVERYONE",
    languages: ["Türkçe", "İngilizce", "Almanca"],
    lifestyle: {
      socialEnergy: "MEDIUM",
      planningStyle: "PLANNED",
      pace: "ACTIVE",
      groupSizePreference: "EITHER",
      matchModePreference: "COMPLEMENTARY",
      interests: ["Yapay zeka", "Girişimcilik"],
    },
    teach: [
      { skill: "Machine Learning", level: "EXPERT" },
      { skill: "JavaScript", level: "ADVANCED" },
    ],
    learn: [{ skill: "Almanca", level: "BEGINNER" }],
    education: { school: "İstanbul Teknik Üniversitesi", department: "Bilgisayar Mühendisliği", yearStatus: "GRADUATE" },
    guide: {
      topics: ["Staj ve kulüp deneyimimi paylaşabilirim.", "Bu bölümü seçmeden önce bilmem gerekenler neler?"],
      sessionDurations: [30, 60],
      guideType: "ALUMNI",
    },
  },
  {
    id: "33333333-3333-4333-8333-333333333333",
    email: "demo.zeynep@skillswap.local",
    name: "Zeynep Demir",
    city: "İstanbul",
    country: "Türkiye",
    network: "TURKIYE",
    gender: "FEMALE",
    genderPreference: "EVERYONE",
    languages: ["Türkçe", "İngilizce"],
    lifestyle: {
      socialEnergy: "HIGH",
      planningStyle: "SPONTANEOUS",
      pace: "ACTIVE",
      groupSizePreference: "LARGE_GROUP",
      matchModePreference: "COMPLEMENTARY",
      interests: ["Sinema", "Seyahat"],
      isNewInCity: true,
    },
    teach: [{ skill: "Fotoğrafçılık", level: "ADVANCED" }],
    learn: [
      { skill: "Python", level: "BEGINNER" },
      { skill: "Excel", level: "BEGINNER" },
    ],
    learnTopics: [{ course: "Matematik", topic: "İntegral", level: "BEGINNER" }],
    education: { school: "Boğaziçi Üniversitesi", department: "Bilgisayar Mühendisliği", yearStatus: "YEAR_2" },
  },
  {
    id: "44444444-4444-4444-8444-444444444444",
    email: "demo.can@skillswap.local",
    name: "Can Öztürk",
    city: "Ankara",
    country: "Türkiye",
    network: "TURKIYE",
    gender: "MALE",
    genderPreference: "EVERYONE",
    languages: ["Türkçe"],
    lifestyle: {
      socialEnergy: "LOW",
      planningStyle: "PLANNED",
      pace: "CALM",
      groupSizePreference: "EITHER",
      matchModePreference: "NO_PREFERENCE",
      interests: ["Satranç"],
    },
    teach: [{ skill: "Excel", level: "INTERMEDIATE" }],
    learn: [
      { skill: "JavaScript", level: "BEGINNER" },
      { skill: "Python", level: "BEGINNER" },
    ],
    learnTopics: [{ course: "Bilgisayar Bilimleri", topic: "Veri Yapıları", level: "BEGINNER" }],
    education: { school: "Orta Doğu Teknik Üniversitesi", department: "Bilgisayar Mühendisliği", yearStatus: "YEAR_1" },
  },
  {
    id: "55555555-5555-4555-8555-555555555555",
    email: "demo.elif@skillswap.local",
    name: "Elif Şahin",
    city: "İstanbul",
    country: "Türkiye",
    network: "TURKIYE",
    gender: "FEMALE",
    genderPreference: "EVERYONE",
    languages: ["Türkçe", "İngilizce"],
    lifestyle: {
      socialEnergy: "HIGH",
      planningStyle: "SPONTANEOUS",
      pace: "ACTIVE",
      groupSizePreference: "SMALL_GROUP",
      matchModePreference: "SIMILAR",
      interests: ["Psikoloji", "Kitap"],
    },
    teach: [
      { skill: "Public Speaking", level: "ADVANCED" },
      { skill: "İngilizce", level: "EXPERT" },
    ],
    learn: [{ skill: "Gitar", level: "BEGINNER" }],
    teachTopics: [{ course: "Fizik", topic: "Newton Yasaları", level: "ADVANCED" }],
    education: { school: "Boğaziçi Üniversitesi", department: "Psikoloji", yearStatus: "YEAR_3" },
    guide: {
      topics: ["Bölümümü tanıtabilirim", "Bu bölümü seçmeden önce bilmem gerekenler neler?"],
      sessionDurations: [30],
      guideType: "STUDENT",
    },
  },
  {
    id: "66666666-6666-4666-8666-666666666666",
    email: "demo.deniz@skillswap.local",
    name: "Deniz Aydın",
    city: "Berlin",
    country: "Almanya",
    network: "GLOBAL",
    gender: "OTHER",
    genderPreference: "EVERYONE",
    languages: ["Almanca", "İngilizce", "Türkçe"],
    lifestyle: {
      socialEnergy: "MEDIUM",
      planningStyle: "PLANNED",
      pace: "CALM",
      groupSizePreference: "EITHER",
      matchModePreference: "OPPOSITE",
      interests: ["Kültür", "Yemek"],
    },
    teach: [
      { skill: "Almanca", level: "EXPERT" },
      { skill: "Public Speaking", level: "INTERMEDIATE" },
    ],
    learn: [{ skill: "Python", level: "BEGINNER" }],
  },
  {
    id: "77777777-7777-4777-8777-777777777777",
    email: "demo.selin@skillswap.local",
    name: "Selin Arslan",
    city: "İstanbul",
    country: "Türkiye",
    network: "TURKIYE",
    gender: "FEMALE",
    genderPreference: "EVERYONE",
    languages: ["Türkçe", "İngilizce"],
    lifestyle: {
      socialEnergy: "MEDIUM",
      planningStyle: "SPONTANEOUS",
      pace: "ACTIVE",
      groupSizePreference: "SMALL_GROUP",
      matchModePreference: "COMPLEMENTARY",
      interests: ["Müzik", "Gitar"],
      isNewInCity: true,
    },
    teach: [{ skill: "Gitar", level: "ADVANCED" }],
    learn: [
      { skill: "Figma", level: "BEGINNER" },
      { skill: "Machine Learning", level: "BEGINNER" },
    ],
    learnTopics: [{ course: "Matematik", topic: "Lineer Cebir", level: "BEGINNER" }],
    education: {
      school: "İstanbul Teknik Üniversitesi",
      department: "Elektrik-Elektronik Mühendisliği",
      yearStatus: "YEAR_2",
    },
  },
];

async function seedDemoUsers(ctx: SeedContext) {
  const { skillsByName, topicsByKey, schoolsByName, departmentsByKey } = ctx;

  function requireSkill(name: string) {
    const found = skillsByName.get(name);
    if (!found) throw new Error(`Seed skill bulunamadı: ${name}`);
    return found;
  }
  function requireTopic(courseName: string, topicName: string) {
    const found = topicsByKey.get(`${courseName}::${topicName}`);
    if (!found) throw new Error(`Seed course topic bulunamadı: ${courseName}::${topicName}`);
    return found;
  }
  function requireSchool(name: string) {
    const found = schoolsByName.get(name);
    if (!found) throw new Error(`Seed school bulunamadı: ${name}`);
    return found;
  }
  function requireDepartment(schoolName: string, departmentName: string) {
    const found = departmentsByKey.get(`${schoolName}::${departmentName}`);
    if (!found) throw new Error(`Seed department bulunamadı: ${schoolName}::${departmentName}`);
    return found;
  }

  for (const spec of DEMO_USERS) {
    const user = await prisma.user.upsert({
      where: { email: spec.email },
      update: {},
      create: {
        id: spec.id,
        email: spec.email,
        name: spec.name,
        city: spec.city,
        country: spec.country,
        network: spec.network,
        gender: spec.gender,
        genderPreference: spec.genderPreference,
        languages: spec.languages ?? [],
      },
    });

    if (spec.lifestyle) {
      await prisma.lifestyleProfile.upsert({
        where: { userId: user.id },
        update: {},
        create: {
          userId: user.id,
          socialEnergy: spec.lifestyle.socialEnergy,
          planningStyle: spec.lifestyle.planningStyle,
          pace: spec.lifestyle.pace,
          groupSizePreference: spec.lifestyle.groupSizePreference,
          matchModePreference: spec.lifestyle.matchModePreference,
          interests: spec.lifestyle.interests ?? [],
          hobbies: spec.lifestyle.hobbies ?? [],
          isNewInCity: spec.lifestyle.isNewInCity ?? false,
        },
      });
    }

    for (const t of spec.teach ?? []) {
      const s = requireSkill(t.skill);
      await prisma.userSkill.upsert({
        where: { userId_skillId_mode: { userId: user.id, skillId: s.id, mode: "TEACH" } },
        update: { level: t.level },
        create: { userId: user.id, skillId: s.id, mode: "TEACH", level: t.level },
      });
    }
    for (const l of spec.learn ?? []) {
      const s = requireSkill(l.skill);
      await prisma.userSkill.upsert({
        where: { userId_skillId_mode: { userId: user.id, skillId: s.id, mode: "LEARN" } },
        update: { level: l.level },
        create: { userId: user.id, skillId: s.id, mode: "LEARN", level: l.level },
      });
    }

    for (const t of spec.teachTopics ?? []) {
      const top = requireTopic(t.course, t.topic);
      await prisma.userCourseTopic.upsert({
        where: { userId_topicId_mode: { userId: user.id, topicId: top.id, mode: "TEACH" } },
        update: { level: t.level },
        create: { userId: user.id, topicId: top.id, mode: "TEACH", level: t.level },
      });
    }
    for (const l of spec.learnTopics ?? []) {
      const top = requireTopic(l.course, l.topic);
      await prisma.userCourseTopic.upsert({
        where: { userId_topicId_mode: { userId: user.id, topicId: top.id, mode: "LEARN" } },
        update: { level: l.level },
        create: { userId: user.id, topicId: top.id, mode: "LEARN", level: l.level },
      });
    }

    if (spec.education) {
      const sch = requireSchool(spec.education.school);
      const dept = spec.education.department ? requireDepartment(spec.education.school, spec.education.department) : null;
      const existingEducation = await prisma.userEducation.findFirst({
        where: { userId: user.id, schoolId: sch.id, departmentId: dept?.id ?? null },
      });
      if (!existingEducation) {
        await prisma.userEducation.create({
          data: {
            userId: user.id,
            schoolId: sch.id,
            departmentId: dept?.id ?? null,
            yearStatus: spec.education.yearStatus,
          },
        });
      }
    }

    if (spec.guide) {
      await prisma.guideProfile.upsert({
        where: { userId: user.id },
        update: {
          topics: spec.guide.topics,
          sessionDurations: spec.guide.sessionDurations,
          guideType: spec.guide.guideType,
        },
        create: {
          userId: user.id,
          topics: spec.guide.topics,
          sessionDurations: spec.guide.sessionDurations,
          guideType: spec.guide.guideType,
        },
      });
    }
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

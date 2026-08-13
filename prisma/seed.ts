import { randomUUID } from "crypto";
import {
  PrismaClient,
  Gender,
  GenderPreference,
  GroupSizePreference,
  MatchModePreference,
  Network,
  Pace,
  PlanningStyle,
  SkillLevel,
  SkillMode,
  SocialEnergy,
  YearStatus,
} from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

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
  {
    name: "Koç Üniversitesi",
    country: "Türkiye",
    city: "İstanbul",
    type: "university",
    departments: [
      { name: "Bilgisayar Mühendisliği", faculty: "Mühendislik Fakültesi", category: "Mühendislik" },
      { name: "İşletme", faculty: "İktisadi ve İdari Bilimler Fakültesi", category: "Sosyal Bilimler" },
    ],
  },
  {
    name: "İstanbul Üniversitesi",
    country: "Türkiye",
    city: "İstanbul",
    type: "university",
    departments: [
      { name: "Hukuk", faculty: "Hukuk Fakültesi", category: "Sosyal Bilimler" },
      { name: "İşletme", faculty: "İktisat Fakültesi", category: "Sosyal Bilimler" },
    ],
  },
  {
    name: "Marmara Üniversitesi",
    country: "Türkiye",
    city: "İstanbul",
    type: "university",
    departments: [
      { name: "İşletme", faculty: "İşletme Fakültesi", category: "Sosyal Bilimler" },
      { name: "Bilgisayar Mühendisliği", faculty: "Teknoloji Fakültesi", category: "Mühendislik" },
    ],
  },
];

type SeedEducation = { school: string; department: string; yearStatus: YearStatus };
type SeedSkill = { skill: string; mode: SkillMode; level: SkillLevel };
type SeedLifestyle = {
  socialEnergy?: SocialEnergy;
  planningStyle?: PlanningStyle;
  pace?: Pace;
  groupSizePreference?: GroupSizePreference;
  matchModePreference?: MatchModePreference;
  isNewInCity?: boolean;
  hobbies?: string[];
  interests?: string[];
};

type SeedUser = {
  // Sabit id sadece ilk oluşturmada kullanılır (email zaten varsa upsert
  // mevcut satırı günceller, id'ye dokunmaz). Verilmezse rastgele üretilir.
  id?: string;
  name: string;
  email: string;
  city: string;
  country: string;
  ageRange?: string;
  gender?: Gender;
  genderPreference?: GenderPreference;
  network?: Network;
  languages?: string[];
  educations: SeedEducation[];
  skills: SeedSkill[];
  lifestyle?: SeedLifestyle;
};

// İlk 7 kullanıcı (Ayşe...Selin) paylaşılan dev veritabanında halihazırda
// var olan kayıtların birebir aynısı — burada sabitlenmesinin amacı, fresh
// bir DB'de de aynı demo verisinin üretilebilmesini sağlamak (reproducibility).
const USERS: SeedUser[] = [
  {
    id: "11111111-1111-4111-8111-111111111111",
    name: "Ayşe Yılmaz",
    email: "demo.ayse@skillswap.local",
    city: "İstanbul",
    country: "Türkiye",
    gender: Gender.FEMALE,
    genderPreference: GenderPreference.EVERYONE,
    network: Network.TURKIYE,
    languages: ["Türkçe", "İngilizce"],
    educations: [
      { school: "İstanbul Teknik Üniversitesi", department: "Bilgisayar Mühendisliği", yearStatus: YearStatus.YEAR_3 },
    ],
    skills: [
      { skill: "Python", mode: SkillMode.TEACH, level: SkillLevel.ADVANCED },
      { skill: "Figma", mode: SkillMode.TEACH, level: SkillLevel.INTERMEDIATE },
      { skill: "Machine Learning", mode: SkillMode.LEARN, level: SkillLevel.BEGINNER },
    ],
    lifestyle: {
      socialEnergy: SocialEnergy.MEDIUM,
      planningStyle: PlanningStyle.PLANNED,
      pace: Pace.CALM,
      groupSizePreference: GroupSizePreference.SMALL_GROUP,
      matchModePreference: MatchModePreference.SIMILAR,
      hobbies: ["Gitar"],
      interests: ["Kahve", "Kitap"],
    },
  },
  {
    id: "22222222-2222-4222-8222-222222222222",
    name: "Mert Kaya",
    email: "demo.mert@skillswap.local",
    city: "İstanbul",
    country: "Türkiye",
    gender: Gender.MALE,
    genderPreference: GenderPreference.EVERYONE,
    network: Network.TURKIYE,
    languages: ["Türkçe", "İngilizce", "Almanca"],
    educations: [
      { school: "İstanbul Teknik Üniversitesi", department: "Bilgisayar Mühendisliği", yearStatus: YearStatus.GRADUATE },
    ],
    skills: [
      { skill: "Machine Learning", mode: SkillMode.TEACH, level: SkillLevel.EXPERT },
      { skill: "JavaScript", mode: SkillMode.TEACH, level: SkillLevel.ADVANCED },
      { skill: "Almanca", mode: SkillMode.LEARN, level: SkillLevel.BEGINNER },
    ],
    lifestyle: {
      socialEnergy: SocialEnergy.MEDIUM,
      planningStyle: PlanningStyle.PLANNED,
      pace: Pace.ACTIVE,
      groupSizePreference: GroupSizePreference.EITHER,
      matchModePreference: MatchModePreference.COMPLEMENTARY,
      interests: ["Yapay zeka", "Girişimcilik"],
    },
  },
  {
    id: "33333333-3333-4333-8333-333333333333",
    name: "Zeynep Demir",
    email: "demo.zeynep@skillswap.local",
    city: "İstanbul",
    country: "Türkiye",
    gender: Gender.FEMALE,
    genderPreference: GenderPreference.EVERYONE,
    network: Network.TURKIYE,
    languages: ["Türkçe", "İngilizce"],
    educations: [
      { school: "Boğaziçi Üniversitesi", department: "Bilgisayar Mühendisliği", yearStatus: YearStatus.YEAR_2 },
      { school: "İstanbul Teknik Üniversitesi", department: "Bilgisayar Mühendisliği", yearStatus: YearStatus.YEAR_2 },
    ],
    skills: [
      { skill: "Fotoğrafçılık", mode: SkillMode.TEACH, level: SkillLevel.ADVANCED },
      { skill: "Python", mode: SkillMode.LEARN, level: SkillLevel.BEGINNER },
      { skill: "Excel", mode: SkillMode.LEARN, level: SkillLevel.BEGINNER },
      { skill: "Python", mode: SkillMode.TEACH, level: SkillLevel.INTERMEDIATE },
      { skill: "Machine Learning", mode: SkillMode.LEARN, level: SkillLevel.BEGINNER },
    ],
    lifestyle: {
      socialEnergy: SocialEnergy.HIGH,
      planningStyle: PlanningStyle.SPONTANEOUS,
      pace: Pace.ACTIVE,
      groupSizePreference: GroupSizePreference.LARGE_GROUP,
      matchModePreference: MatchModePreference.COMPLEMENTARY,
      isNewInCity: true,
      interests: ["Sinema", "Seyahat"],
    },
  },
  {
    id: "44444444-4444-4444-8444-444444444444",
    name: "Can Öztürk",
    email: "demo.can@skillswap.local",
    city: "Ankara",
    country: "Türkiye",
    gender: Gender.MALE,
    genderPreference: GenderPreference.EVERYONE,
    network: Network.TURKIYE,
    languages: ["Türkçe"],
    educations: [
      { school: "Orta Doğu Teknik Üniversitesi", department: "Bilgisayar Mühendisliği", yearStatus: YearStatus.YEAR_1 },
      { school: "İstanbul Teknik Üniversitesi", department: "Elektrik-Elektronik Mühendisliği", yearStatus: YearStatus.YEAR_3 },
    ],
    skills: [
      { skill: "Excel", mode: SkillMode.TEACH, level: SkillLevel.INTERMEDIATE },
      { skill: "JavaScript", mode: SkillMode.LEARN, level: SkillLevel.BEGINNER },
      { skill: "Python", mode: SkillMode.LEARN, level: SkillLevel.BEGINNER },
      { skill: "Gitar", mode: SkillMode.TEACH, level: SkillLevel.ADVANCED },
      { skill: "İngilizce", mode: SkillMode.LEARN, level: SkillLevel.BEGINNER },
    ],
    lifestyle: {
      socialEnergy: SocialEnergy.LOW,
      planningStyle: PlanningStyle.PLANNED,
      pace: Pace.CALM,
      groupSizePreference: GroupSizePreference.EITHER,
      matchModePreference: MatchModePreference.NO_PREFERENCE,
      interests: ["Satranç"],
    },
  },
  {
    id: "55555555-5555-4555-8555-555555555555",
    name: "Elif Şahin",
    email: "demo.elif@skillswap.local",
    city: "İstanbul",
    country: "Türkiye",
    gender: Gender.FEMALE,
    genderPreference: GenderPreference.EVERYONE,
    network: Network.TURKIYE,
    languages: ["Türkçe", "İngilizce"],
    educations: [
      { school: "Boğaziçi Üniversitesi", department: "Psikoloji", yearStatus: YearStatus.YEAR_3 },
      { school: "Boğaziçi Üniversitesi", department: "Bilgisayar Mühendisliği", yearStatus: YearStatus.YEAR_1 },
    ],
    skills: [
      { skill: "Public Speaking", mode: SkillMode.TEACH, level: SkillLevel.ADVANCED },
      { skill: "İngilizce", mode: SkillMode.TEACH, level: SkillLevel.EXPERT },
      { skill: "Gitar", mode: SkillMode.LEARN, level: SkillLevel.BEGINNER },
      { skill: "Fotoğrafçılık", mode: SkillMode.TEACH, level: SkillLevel.INTERMEDIATE },
      { skill: "JavaScript", mode: SkillMode.LEARN, level: SkillLevel.BEGINNER },
    ],
    lifestyle: {
      socialEnergy: SocialEnergy.HIGH,
      planningStyle: PlanningStyle.SPONTANEOUS,
      pace: Pace.ACTIVE,
      groupSizePreference: GroupSizePreference.SMALL_GROUP,
      matchModePreference: MatchModePreference.SIMILAR,
      interests: ["Psikoloji", "Kitap"],
    },
  },
  {
    id: "66666666-6666-4666-8666-666666666666",
    name: "Deniz Aydın",
    email: "demo.deniz@skillswap.local",
    city: "Berlin",
    country: "Almanya",
    gender: Gender.OTHER,
    genderPreference: GenderPreference.EVERYONE,
    network: Network.GLOBAL,
    languages: ["Almanca", "İngilizce", "Türkçe"],
    educations: [
      { school: "Boğaziçi Üniversitesi", department: "Psikoloji", yearStatus: YearStatus.GRADUATE },
    ],
    skills: [
      { skill: "Almanca", mode: SkillMode.TEACH, level: SkillLevel.EXPERT },
      { skill: "Public Speaking", mode: SkillMode.TEACH, level: SkillLevel.EXPERT },
      { skill: "Python", mode: SkillMode.LEARN, level: SkillLevel.BEGINNER },
      { skill: "Figma", mode: SkillMode.LEARN, level: SkillLevel.BEGINNER },
    ],
    lifestyle: {
      socialEnergy: SocialEnergy.MEDIUM,
      planningStyle: PlanningStyle.PLANNED,
      pace: Pace.CALM,
      groupSizePreference: GroupSizePreference.EITHER,
      matchModePreference: MatchModePreference.OPPOSITE,
      interests: ["Kültür", "Yemek"],
    },
  },
  {
    id: "77777777-7777-4777-8777-777777777777",
    name: "Selin Arslan",
    email: "demo.selin@skillswap.local",
    city: "İstanbul",
    country: "Türkiye",
    gender: Gender.FEMALE,
    genderPreference: GenderPreference.EVERYONE,
    network: Network.TURKIYE,
    languages: ["Türkçe", "İngilizce"],
    educations: [
      { school: "İstanbul Teknik Üniversitesi", department: "Elektrik-Elektronik Mühendisliği", yearStatus: YearStatus.YEAR_2 },
    ],
    skills: [
      { skill: "Gitar", mode: SkillMode.TEACH, level: SkillLevel.ADVANCED },
      { skill: "Figma", mode: SkillMode.LEARN, level: SkillLevel.BEGINNER },
      { skill: "Machine Learning", mode: SkillMode.LEARN, level: SkillLevel.BEGINNER },
    ],
    lifestyle: {
      socialEnergy: SocialEnergy.MEDIUM,
      planningStyle: PlanningStyle.SPONTANEOUS,
      pace: Pace.ACTIVE,
      groupSizePreference: GroupSizePreference.SMALL_GROUP,
      matchModePreference: MatchModePreference.COMPLEMENTARY,
      isNewInCity: true,
      interests: ["Müzik", "Gitar"],
    },
  },
  // Yeni: daha önce hiç kullanıcısı olmayan okulları (Koç, İstanbul Ü,
  // Marmara) da kapsayacak 3 ek örnek kullanıcı.
  {
    name: "Kerem Yıldız",
    email: "demo.kerem@skillswap.local",
    city: "İstanbul",
    country: "Türkiye",
    ageRange: "18-24",
    educations: [
      { school: "Koç Üniversitesi", department: "Bilgisayar Mühendisliği", yearStatus: YearStatus.YEAR_3 },
    ],
    skills: [
      { skill: "Machine Learning", mode: SkillMode.TEACH, level: SkillLevel.INTERMEDIATE },
      { skill: "Gitar", mode: SkillMode.LEARN, level: SkillLevel.BEGINNER },
    ],
  },
  {
    name: "İrem Çelik",
    email: "demo.irem@skillswap.local",
    city: "İstanbul",
    country: "Türkiye",
    ageRange: "18-24",
    educations: [
      { school: "İstanbul Üniversitesi", department: "Hukuk", yearStatus: YearStatus.YEAR_1 },
    ],
    skills: [
      { skill: "Almanca", mode: SkillMode.TEACH, level: SkillLevel.INTERMEDIATE },
      { skill: "Excel", mode: SkillMode.LEARN, level: SkillLevel.BEGINNER },
    ],
  },
  {
    name: "Onur Kaya",
    email: "demo.onur@skillswap.local",
    city: "İstanbul",
    country: "Türkiye",
    ageRange: "18-24",
    educations: [
      { school: "Marmara Üniversitesi", department: "Bilgisayar Mühendisliği", yearStatus: YearStatus.PREP },
    ],
    skills: [
      { skill: "Fotoğrafçılık", mode: SkillMode.TEACH, level: SkillLevel.BEGINNER },
      { skill: "JavaScript", mode: SkillMode.LEARN, level: SkillLevel.BEGINNER },
    ],
  },
];

async function main() {
  const skillIdByName = new Map<string, string>();
  for (const skill of SKILLS) {
    const created = await prisma.skill.upsert({
      where: { name: skill.name },
      update: {},
      create: skill,
    });
    skillIdByName.set(skill.name, created.id);
  }

  for (const course of COURSES) {
    const createdCourse = await prisma.course.upsert({
      where: { name: course.name },
      update: {},
      create: { name: course.name, category: course.category },
    });

    for (const topic of course.topics) {
      await prisma.courseTopic.upsert({
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
    }
  }

  const schoolIdByName = new Map<string, string>();
  const departmentIdByKey = new Map<string, string>();

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
    schoolIdByName.set(school.name, createdSchool.id);

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
      departmentIdByKey.set(`${school.name}::${department.name}`, createdDepartment.id);
    }
  }

  for (const user of USERS) {
    const createdUser = await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: {
        id: user.id ?? randomUUID(),
        email: user.email,
        name: user.name,
        city: user.city,
        country: user.country,
        ageRange: user.ageRange ?? null,
        gender: user.gender,
        genderPreference: user.genderPreference,
        network: user.network ?? Network.TURKIYE,
        languages: user.languages ?? [],
      },
    });

    for (const edu of user.educations) {
      const schoolId = schoolIdByName.get(edu.school);
      const departmentId = departmentIdByKey.get(`${edu.school}::${edu.department}`);
      if (!schoolId || !departmentId) {
        throw new Error(`Seed hatası: ${user.name} için okul/bölüm bulunamadı (${edu.school} / ${edu.department}).`);
      }

      await prisma.userEducation.upsert({
        where: {
          userId_schoolId_departmentId: {
            userId: createdUser.id,
            schoolId,
            departmentId,
          },
        },
        update: { yearStatus: edu.yearStatus },
        create: {
          userId: createdUser.id,
          schoolId,
          departmentId,
          yearStatus: edu.yearStatus,
        },
      });
    }

    for (const s of user.skills) {
      const skillId = skillIdByName.get(s.skill);
      if (!skillId) {
        throw new Error(`Seed hatası: ${user.name} için skill bulunamadı (${s.skill}).`);
      }

      await prisma.userSkill.upsert({
        where: {
          userId_skillId_mode: {
            userId: createdUser.id,
            skillId,
            mode: s.mode,
          },
        },
        update: { level: s.level },
        create: {
          userId: createdUser.id,
          skillId,
          mode: s.mode,
          level: s.level,
        },
      });
    }

    if (user.lifestyle) {
      await prisma.lifestyleProfile.upsert({
        where: { userId: createdUser.id },
        update: user.lifestyle,
        create: { userId: createdUser.id, ...user.lifestyle },
      });
    }
  }

  console.log(
    `Seed tamamlandı: ${SKILLS.length} skill, ${COURSES.length} course, ${SCHOOLS.length} okul, ${USERS.length} örnek kullanıcı.`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

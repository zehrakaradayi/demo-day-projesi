import { PrismaClient } from "../src/generated/prisma/client";
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
];

async function main() {
  for (const skill of SKILLS) {
    await prisma.skill.upsert({
      where: { name: skill.name },
      update: {},
      create: skill,
    });
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

    for (const department of school.departments) {
      await prisma.department.upsert({
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
    }
  }

  console.log("Seed tamamlandı: skills, courses, schools/departments.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

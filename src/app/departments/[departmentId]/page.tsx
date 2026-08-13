import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { YearStatus } from "@/generated/prisma/client";
import { YEAR_STATUS_LABELS } from "@/lib/labels";
import { Avatar } from "@/components/avatar";
import { Section, Chip, Empty } from "@/components/ui";

const YEAR_FILTER_OPTIONS = Object.entries(YEAR_STATUS_LABELS) as [
  YearStatus,
  string,
][];

function isYearStatus(value: string): value is YearStatus {
  return (Object.values(YearStatus) as string[]).includes(value);
}

export default async function DepartmentProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ departmentId: string }>;
  searchParams: Promise<{ year?: string }>;
}) {
  const { departmentId } = await params;
  const { year } = await searchParams;
  const yearFilter = year && isYearStatus(year) ? year : null;

  const department = await prisma.department.findUnique({
    where: { id: departmentId },
    include: {
      school: true,
      educations: {
        where: yearFilter ? { yearStatus: yearFilter } : undefined,
        orderBy: { createdAt: "asc" },
        include: { user: true },
      },
      _count: { select: { educations: true } },
    },
  });

  if (!department) {
    notFound();
  }

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-16">
      <div className="space-y-1">
        <Link
          href={`/schools/${department.schoolId}`}
          className="text-sm font-medium text-violet-600 hover:underline"
        >
          ← {department.school.name}
        </Link>
        <h1 className="text-3xl font-semibold tracking-tight">
          {department.name}
        </h1>
        {department.faculty && (
          <p className="text-neutral-600">{department.faculty}</p>
        )}
        <p className="text-sm text-neutral-500">
          {department._count.educations} kullanıcı
        </p>
      </div>

      <Section title="Sınıf / yıl filtresi">
        <ul className="flex flex-wrap gap-2">
          <li>
            <Link
              href={`/departments/${departmentId}`}
              className={`rounded-full border px-3 py-1 text-sm ${
                !yearFilter
                  ? "border-violet-600 bg-violet-50 text-violet-700"
                  : "border-neutral-300 text-neutral-700 hover:border-violet-400"
              }`}
            >
              Tümü
            </Link>
          </li>
          {YEAR_FILTER_OPTIONS.map(([value, label]) => (
            <li key={value}>
              <Link
                href={`/departments/${departmentId}?year=${value}`}
                className={`rounded-full border px-3 py-1 text-sm ${
                  yearFilter === value
                    ? "border-violet-600 bg-violet-50 text-violet-700"
                    : "border-neutral-300 text-neutral-700 hover:border-violet-400"
                }`}
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Bu bölümdeki kullanıcılar">
        {department.educations.length > 0 ? (
          <ul className="flex flex-col gap-3">
            {department.educations.map((education) => (
              <li
                key={education.id}
                className="flex items-center gap-3 rounded-lg border border-neutral-200 p-3"
              >
                <Avatar
                  name={education.user.name}
                  avatarUrl={education.user.avatarUrl}
                  size={40}
                />
                <div className="flex-1">
                  <p className="font-medium">{education.user.name}</p>
                  <p className="text-sm text-neutral-600">
                    {[education.user.ageRange, education.user.city]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
                <ul className="flex flex-wrap gap-2">
                  {education.yearStatus && (
                    <Chip>{YEAR_STATUS_LABELS[education.yearStatus]}</Chip>
                  )}
                  <Chip>
                    {education.yearStatus === YearStatus.GRADUATE
                      ? "Alumni"
                      : "Öğrenci"}
                  </Chip>
                </ul>
              </li>
            ))}
          </ul>
        ) : (
          <Empty text="Bu bölümde (bu filtreyle) henüz kimse yok." />
        )}
      </Section>
    </main>
  );
}

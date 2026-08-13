import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Section, Chip, Empty } from "@/components/ui";
import { SCHOOL_TYPE_LABELS } from "@/lib/labels";

export default async function SchoolProfilePage({
  params,
}: {
  params: Promise<{ schoolId: string }>;
}) {
  const { schoolId } = await params;

  const school = await prisma.school.findUnique({
    where: { id: schoolId },
    include: {
      departments: {
        orderBy: { name: "asc" },
        include: { _count: { select: { educations: true } } },
      },
      _count: { select: { educations: true } },
    },
  });

  if (!school) {
    notFound();
  }

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-16">
      <div className="space-y-1">
        <Link
          href="/schools"
          className="text-sm font-medium text-violet-600 hover:underline"
        >
          ← Okullar
        </Link>
        <h1 className="text-3xl font-semibold tracking-tight">
          {school.name}
        </h1>
        <p className="text-neutral-600">
          {[school.city, school.country].filter(Boolean).join(", ")}
        </p>
        <ul className="mt-2 flex flex-wrap gap-2">
          {school.type && (
            <Chip>{SCHOOL_TYPE_LABELS[school.type] ?? school.type}</Chip>
          )}
          <Chip>{school._count.educations} kullanıcı</Chip>
        </ul>
      </div>

      <Section title="Bölümler">
        {school.departments.length > 0 ? (
          <ul className="flex flex-col gap-2">
            {school.departments.map((department) => (
              <li key={department.id}>
                <Link
                  href={`/departments/${department.id}`}
                  className="block rounded-lg border border-neutral-200 p-4 transition-colors hover:border-violet-400"
                >
                  <p className="font-medium">{department.name}</p>
                  {department.faculty && (
                    <p className="text-sm text-neutral-600">
                      {department.faculty}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-neutral-500">
                    {department._count.educations} kullanıcı
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <Empty text="Bu okulda henüz bölüm eklenmedi." />
        )}
      </Section>
    </main>
  );
}

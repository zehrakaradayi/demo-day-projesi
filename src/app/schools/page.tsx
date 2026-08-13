import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Empty } from "@/components/ui";
import { SCHOOL_TYPE_LABELS } from "@/lib/labels";

export default async function SchoolsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";

  const schools = await prisma.school.findMany({
    where: query
      ? { name: { contains: query, mode: "insensitive" } }
      : undefined,
    orderBy: { name: "asc" },
    include: {
      _count: { select: { departments: true, educations: true } },
    },
  });

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-16">
      <div className="space-y-1">
        <span className="text-sm font-medium text-violet-600">
          Bölüm 5 · MVP
        </span>
        <h1 className="text-3xl font-semibold tracking-tight">Okullar</h1>
        <p className="text-neutral-600">
          Bir okula tıklayarak bölümlerini ve o bölümdeki kullanıcıları
          keşfet.
        </p>
      </div>

      <form className="flex gap-2">
        <input
          type="text"
          name="q"
          defaultValue={query}
          placeholder="Okul ara..."
          className="flex-1 rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none"
        />
        <button
          type="submit"
          className="rounded-md bg-violet-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-violet-700"
        >
          Ara
        </button>
      </form>

      {schools.length > 0 ? (
        <ul className="flex flex-col gap-3">
          {schools.map((school) => (
            <li key={school.id}>
              <Link
                href={`/schools/${school.id}`}
                className="block rounded-lg border border-neutral-200 p-4 transition-colors hover:border-violet-400"
              >
                <p className="font-medium">{school.name}</p>
                <p className="text-sm text-neutral-600">
                  {[
                    school.city,
                    school.country,
                    school.type && SCHOOL_TYPE_LABELS[school.type],
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
                <p className="mt-1 text-xs text-neutral-500">
                  {school._count.departments} bölüm ·{" "}
                  {school._count.educations} kullanıcı
                </p>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <Empty
          text={
            query
              ? `"${query}" için okul bulunamadı.`
              : "Henüz okul eklenmedi."
          }
        />
      )}
    </main>
  );
}

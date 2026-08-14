import Link from "next/link";
import { requireCurrentUser, extractAsParam } from "@/lib/matching-education/current-user";
import { DevUserSwitcher } from "@/lib/matching-education/dev-user-switcher";
import { searchSchools, getUserEducations } from "@/lib/matching-education/queries/schools";
import { PageHeader, Section, Card, Badge, EmptyState, inputClass, buttonClass } from "@/lib/matching-education/ui";

export default async function OkullarPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const asParam = extractAsParam(sp);
  const query = typeof sp.q === "string" ? sp.q : undefined;

  const user = await requireCurrentUser(asParam);
  const [schools, myEducations] = await Promise.all([searchSchools(query), getUserEducations(user.id)]);

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-6 py-12">
      <DevUserSwitcher activeUserId={user.id} />

      <PageHeader
        briefSection="Bölüm 5 · MVP"
        title="Okullar"
        description="Okul ara → okul profili → bölümler → öğrenciler → alumni → rehberlik session'ları."
      />

      {myEducations.length > 0 ? (
        <Section title="Benim Okullarım">
          <div className="flex flex-wrap gap-2">
            {myEducations.map((edu) => (
              <Link key={edu.id} href={`/okullar/${edu.schoolId}${asParam ? `?as=${asParam}` : ""}`}>
                <Badge tone="violet">
                  {edu.school.name}
                  {edu.department ? ` — ${edu.department.name}` : ""}
                </Badge>
              </Link>
            ))}
          </div>
        </Section>
      ) : null}

      <Section title="Okul Ara">
        <form method="get" className="flex gap-2">
          {asParam ? <input type="hidden" name="as" value={asParam} /> : null}
          <input type="text" name="q" defaultValue={query} placeholder="Okul veya şehir ara…" className={inputClass} />
          <button type="submit" className={buttonClass}>
            Ara
          </button>
        </form>
      </Section>

      <Section title="Sonuçlar">
        {schools.length === 0 ? (
          <EmptyState>Aramanla eşleşen okul bulunamadı.</EmptyState>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {schools.map((school) => (
              <Link key={school.id} href={`/okullar/${school.id}${asParam ? `?as=${asParam}` : ""}`}>
                <Card className="h-full transition-colors hover:border-violet-400">
                  <p className="font-medium">{school.name}</p>
                  <p className="text-sm text-neutral-500">
                    {school.city ? `${school.city}, ` : ""}
                    {school.country}
                  </p>
                  <p className="mt-2 text-xs text-neutral-400">
                    {school.departmentCount} bölüm · {school.studentCount} öğrenci
                  </p>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </Section>
    </main>
  );
}

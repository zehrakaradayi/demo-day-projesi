import Link from "next/link";
import { requireCurrentUser, extractAsParam } from "@/lib/matching-education/current-user";
import { DevUserSwitcher } from "@/lib/matching-education/dev-user-switcher";
import { searchCatalog, getNewInTownUsers } from "@/lib/matching-education/queries/discover";
import { PageHeader, Section, Card, Badge, EmptyState, inputClass, buttonSecondaryClass } from "@/lib/matching-education/ui";
import { NETWORK_LABELS } from "@/lib/matching-education/labels";
import type { Network } from "@/generated/prisma/client";

export default async function KesfetPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const asParam = extractAsParam(sp);
  const query = typeof sp.q === "string" ? sp.q : "";
  const networkFilter: Network | undefined =
    sp.network === "TURKIYE" || sp.network === "GLOBAL" ? sp.network : undefined;

  const user = await requireCurrentUser(asParam);
  const [catalog, newInTown] = await Promise.all([
    searchCatalog(query),
    getNewInTownUsers(networkFilter, user.id),
  ]);

  const networkHref = (network?: Network) => {
    const params = new URLSearchParams();
    if (asParam) params.set("as", asParam);
    if (query) params.set("q", query);
    if (network) params.set("network", network);
    const s = params.toString();
    return s ? `?${s}` : "/kesfet";
  };

  const hasResults =
    catalog.skills.length > 0 ||
    catalog.topics.length > 0 ||
    catalog.schools.length > 0 ||
    catalog.departments.length > 0;

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-6 py-12">
      <DevUserSwitcher activeUserId={user.id} />

      <PageHeader
        briefSection="Bölüm 17 · MVP"
        title="Keşfet"
        description="Skill, ders konusu, okul veya bölüm ara; Türkiye/Global ağında bu şehirde yeni olanları keşfet."
      />

      <form method="get" className="flex gap-2">
        {asParam ? <input type="hidden" name="as" value={asParam} /> : null}
        {networkFilter ? <input type="hidden" name="network" value={networkFilter} /> : null}
        <input
          type="text"
          name="q"
          defaultValue={query}
          placeholder="Skill, ders konusu, okul veya bölüm ara..."
          className={inputClass}
        />
        <button type="submit" className={buttonSecondaryClass}>
          Ara
        </button>
      </form>

      {query ? (
        <Section title={`"${query}" için sonuçlar`}>
          {!hasResults ? (
            <EmptyState>Sonuç bulunamadı.</EmptyState>
          ) : (
            <div className="space-y-4">
              {catalog.skills.length > 0 ? (
                <div>
                  <h3 className="mb-2 text-sm font-semibold text-neutral-500">Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {catalog.skills.map((skill) => (
                      <Link
                        key={skill.id}
                        href={`/skills?skillId=${skill.id}${asParam ? `&as=${asParam}` : ""}`}
                        className={buttonSecondaryClass}
                      >
                        {skill.name}
                      </Link>
                    ))}
                  </div>
                </div>
              ) : null}

              {catalog.topics.length > 0 ? (
                <div>
                  <h3 className="mb-2 text-sm font-semibold text-neutral-500">Ders konuları</h3>
                  <div className="flex flex-wrap gap-2">
                    {catalog.topics.map((topic) => (
                      <Link
                        key={topic.id}
                        href={`/dersler?topicId=${topic.id}${asParam ? `&as=${asParam}` : ""}`}
                        className={buttonSecondaryClass}
                      >
                        {topic.course.name} — {topic.name}
                      </Link>
                    ))}
                  </div>
                </div>
              ) : null}

              {catalog.schools.length > 0 ? (
                <div>
                  <h3 className="mb-2 text-sm font-semibold text-neutral-500">Okullar</h3>
                  <div className="flex flex-wrap gap-2">
                    {catalog.schools.map((school) => (
                      <Link key={school.id} href={`/schools/${school.id}`} className={buttonSecondaryClass}>
                        {school.name}
                      </Link>
                    ))}
                  </div>
                </div>
              ) : null}

              {catalog.departments.length > 0 ? (
                <div>
                  <h3 className="mb-2 text-sm font-semibold text-neutral-500">Bölümler</h3>
                  <div className="flex flex-wrap gap-2">
                    {catalog.departments.map((department) => (
                      <Link
                        key={department.id}
                        href={`/departments/${department.id}`}
                        className={buttonSecondaryClass}
                      >
                        {department.name} — {department.school.name}
                      </Link>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </Section>
      ) : null}

      <Section title="Ağ">
        <div className="flex gap-2 text-sm">
          <Link href={networkHref()} className={!networkFilter ? "font-semibold text-violet-600" : "text-neutral-500"}>
            Tümü
          </Link>
          <span className="text-neutral-300">·</span>
          <Link
            href={networkHref("TURKIYE")}
            className={networkFilter === "TURKIYE" ? "font-semibold text-violet-600" : "text-neutral-500"}
          >
            {NETWORK_LABELS.TURKIYE}
          </Link>
          <span className="text-neutral-300">·</span>
          <Link
            href={networkHref("GLOBAL")}
            className={networkFilter === "GLOBAL" ? "font-semibold text-violet-600" : "text-neutral-500"}
          >
            {NETWORK_LABELS.GLOBAL}
          </Link>
        </div>
      </Section>

      <Section title="Bu şehirde yeni">
        {newInTown.length === 0 ? (
          <EmptyState>Şu an bu ağda yeni şehre taşınmış görünen kimse yok.</EmptyState>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {newInTown.map((person) => (
              <Card key={person.id} className="space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">{person.name}</span>
                  <Badge>{NETWORK_LABELS[person.network]}</Badge>
                </div>
                <p className="text-xs text-neutral-500">
                  {person.city ?? "Şehir belirtilmemiş"}
                  {person.educations[0] ? ` · ${person.educations[0].school.name}` : ""}
                </p>
              </Card>
            ))}
          </div>
        )}
      </Section>

      <Section title="Communities">
        <EmptyState>Community keşfi yakında geliyor.</EmptyState>
      </Section>
    </main>
  );
}

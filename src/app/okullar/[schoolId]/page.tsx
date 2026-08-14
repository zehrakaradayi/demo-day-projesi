import Link from "next/link";
import { notFound } from "next/navigation";
import { requireCurrentUser, extractAsParam } from "@/lib/matching-education/current-user";
import { DevUserSwitcher } from "@/lib/matching-education/dev-user-switcher";
import { getSchoolById } from "@/lib/matching-education/queries/schools";
import { PageHeader, Section, Card, Badge, EmptyState, buttonClass } from "@/lib/matching-education/ui";
import { GUIDE_TYPE_LABELS } from "@/lib/matching-education/labels";
import { setMyEducationAction } from "../actions";

export default async function OkulProfiliPage({
  params,
  searchParams,
}: {
  params: Promise<{ schoolId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { schoolId } = await params;
  const sp = await searchParams;
  const asParam = extractAsParam(sp);

  const user = await requireCurrentUser(asParam);
  const school = await getSchoolById(schoolId);
  if (!school) notFound();

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-6 py-12">
      <DevUserSwitcher activeUserId={user.id} />

      <PageHeader
        briefSection="Bölüm 5 · MVP"
        title={school.name}
        description={`${school.city ? `${school.city}, ` : ""}${school.country} · ${school.studentCount} öğrenci · ${school.departments.length} bölüm`}
      />

      <Section title="Bu okulda okuyorum">
        <Card>
          <form action={setMyEducationAction} className="flex flex-wrap items-center gap-2">
            {asParam ? <input type="hidden" name="asUserId" value={asParam} /> : null}
            <input type="hidden" name="schoolId" value={school.id} />
            <p className="text-sm text-neutral-600">
              Bölüm sayfasından belirli bir bölümü seçebilirsin. Şimdilik sadece okulunu ekle:
            </p>
            <button type="submit" className={buttonClass}>
              Bu okulda okuyorum
            </button>
          </form>
        </Card>
      </Section>

      <Section title="Bölümler">
        {school.departments.length === 0 ? (
          <EmptyState>Bu okul için henüz bölüm eklenmemiş.</EmptyState>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {school.departments.map((department) => (
              <Link
                key={department.id}
                href={`/okullar/${school.id}/bolumler/${department.id}${asParam ? `?as=${asParam}` : ""}`}
              >
                <Card className="h-full transition-colors hover:border-violet-400">
                  <p className="font-medium">{department.name}</p>
                  {department.faculty ? <p className="text-xs text-neutral-500">{department.faculty}</p> : null}
                  <p className="mt-1 text-xs text-neutral-400">{department.studentCount} öğrenci</p>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </Section>

      <Section title="Popüler Skiller">
        {school.popularSkills.length === 0 ? (
          <EmptyState>Henüz yeterli veri yok.</EmptyState>
        ) : (
          <div className="flex flex-wrap gap-2">
            {school.popularSkills.map(({ skill, count }) => (
              <Badge key={skill.id} tone="violet">
                {skill.name} ({count})
              </Badge>
            ))}
          </div>
        )}
      </Section>

      <Section title="Rehberler">
        {school.guides.length === 0 ? (
          <EmptyState>Bu okuldan henüz aktif bir rehber yok.</EmptyState>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {school.guides.map((guide) => (
              <Card key={guide.id} className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{guide.user.name}</p>
                  <p className="text-xs text-neutral-500">{guide.user.city ?? "—"}</p>
                </div>
                <Badge tone="amber">{GUIDE_TYPE_LABELS[guide.guideType]}</Badge>
              </Card>
            ))}
          </div>
        )}
      </Section>
    </main>
  );
}

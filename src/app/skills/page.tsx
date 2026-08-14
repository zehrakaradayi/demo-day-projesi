import Link from "next/link";
import { requireCurrentUser, extractAsParam } from "@/lib/matching-education/current-user";
import { DevUserSwitcher } from "@/lib/matching-education/dev-user-switcher";
import { getSkillCatalog, getUserSkills, getPeopleForSkill } from "@/lib/matching-education/queries/skills";
import { SKILL_LEVEL_LABELS, SKILL_MODE_LABELS, TEACHING_STYLE_LABELS, LEARNING_PURPOSE_LABELS } from "@/lib/matching-education/labels";
import { PageHeader, Section, Card, Badge, EmptyState, buttonSecondaryClass } from "@/lib/matching-education/ui";
import { SkillForm } from "./skill-form";
import { deleteUserSkillAction } from "./actions";
import { SkillMode } from "@/generated/prisma/client";

export default async function SkillsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const asParam = extractAsParam(sp);
  const browseSkillId = typeof sp.skillId === "string" ? sp.skillId : undefined;
  const browseMode = sp.browseMode === "LEARN" ? SkillMode.LEARN : SkillMode.TEACH;

  const user = await requireCurrentUser(asParam);
  const [catalog, mySkills] = await Promise.all([getSkillCatalog(), getUserSkills(user.id)]);

  const browsePeople = browseSkillId ? await getPeopleForSkill(browseSkillId, browseMode, user.id) : [];
  const browseSkill = browseSkillId ? catalog.find((s) => s.id === browseSkillId) : undefined;

  const categories = [...new Set(catalog.map((s) => s.category))].sort();

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-6 py-12">
      <DevUserSwitcher activeUserId={user.id} />

      <PageHeader
        briefSection="Bölüm 4 · MVP"
        title="Skill Exchange"
        description="Ben öğretebilirim / öğrenmek istiyorum: skill adı, kategori, seviye, öğretme biçimi, öğrenme amacı."
      />

      <Section title="Benim Skillerim">
        {mySkills.length === 0 ? (
          <EmptyState>Henüz skill eklemedin. Aşağıdaki formdan ilk skillini ekleyebilirsin.</EmptyState>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {mySkills.map((us) => (
              <Card key={us.id} className="flex items-start justify-between gap-2">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="font-medium">{us.skill.name}</span>
                    <Badge tone={us.mode === "TEACH" ? "green" : "violet"}>{SKILL_MODE_LABELS[us.mode]}</Badge>
                    <Badge>{SKILL_LEVEL_LABELS[us.level]}</Badge>
                  </div>
                  <p className="text-xs text-neutral-500">
                    {us.teachingStyle ? TEACHING_STYLE_LABELS[us.teachingStyle] : null}
                    {us.teachingStyle && us.learningPurpose ? " · " : null}
                    {us.learningPurpose ? LEARNING_PURPOSE_LABELS[us.learningPurpose] : null}
                    {us.experienceYears ? ` · ${us.experienceYears} yıl deneyim` : null}
                  </p>
                </div>
                <form action={deleteUserSkillAction}>
                  {asParam ? <input type="hidden" name="asUserId" value={asParam} /> : null}
                  <input type="hidden" name="id" value={us.id} />
                  <button type="submit" className="text-xs text-neutral-400 hover:text-red-600">
                    Sil
                  </button>
                </form>
              </Card>
            ))}
          </div>
        )}
      </Section>

      <Section title="Skill Ekle">
        <Card>
          <SkillForm
            catalog={catalog.map((s) => ({ id: s.id, name: s.name, category: s.category }))}
            asUserId={asParam}
          />
        </Card>
      </Section>

      <Section title="Katalog">
        <div className="space-y-4">
          {categories.map((category) => (
            <div key={category}>
              <h3 className="mb-2 text-sm font-semibold text-neutral-500">{category}</h3>
              <div className="flex flex-wrap gap-2">
                {catalog
                  .filter((s) => s.category === category)
                  .map((skill) => (
                    <Link
                      key={skill.id}
                      href={`/skills?skillId=${skill.id}&browseMode=TEACH${asParam ? `&as=${asParam}` : ""}`}
                      className={`${buttonSecondaryClass} gap-1.5`}
                    >
                      {skill.name}
                      <span className="text-neutral-400">
                        {skill.teachCount} öğreten · {skill.learnCount} öğrenmek isteyen
                      </span>
                    </Link>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </Section>

      {browseSkillId && browseSkill ? (
        <Section title={`"${browseSkill.name}" — ${browseMode === "TEACH" ? "Öğretenler" : "Öğrenmek isteyenler"}`}>
          <div className="mb-2 flex gap-2 text-sm">
            <Link
              href={`/skills?skillId=${browseSkillId}&browseMode=TEACH${asParam ? `&as=${asParam}` : ""}`}
              className={browseMode === "TEACH" ? "font-semibold text-violet-600" : "text-neutral-500"}
            >
              Öğretenler
            </Link>
            <span className="text-neutral-300">·</span>
            <Link
              href={`/skills?skillId=${browseSkillId}&browseMode=LEARN${asParam ? `&as=${asParam}` : ""}`}
              className={browseMode === "LEARN" ? "font-semibold text-violet-600" : "text-neutral-500"}
            >
              Öğrenmek isteyenler
            </Link>
          </div>
          {browsePeople.length === 0 ? (
            <EmptyState>Bu skill için henüz kimse yok.</EmptyState>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {browsePeople.map((entry) => (
                <Card key={entry.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{entry.user.name}</p>
                    <p className="text-xs text-neutral-500">{entry.user.city ?? "Konum belirtilmemiş"}</p>
                  </div>
                  <Badge>{SKILL_LEVEL_LABELS[entry.level]}</Badge>
                </Card>
              ))}
            </div>
          )}
        </Section>
      ) : null}
    </main>
  );
}

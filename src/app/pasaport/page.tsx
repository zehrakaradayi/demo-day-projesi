import { requireCurrentUser, extractAsParam } from "@/lib/matching-education/current-user";
import { DevUserSwitcher } from "@/lib/matching-education/dev-user-switcher";
import { getSkillDNA, getSkillEvolution, getPassport } from "@/lib/matching-education/queries/passport";
import { getMissionCatalog, getUserMissions } from "@/lib/matching-education/queries/missions";
import { getSkillCreditLedger } from "@/lib/matching-education/queries/skill-credits";
import { PageHeader, Section, Card, Badge, EmptyState, inputClass, buttonClass, buttonSecondaryClass } from "@/lib/matching-education/ui";
import { SKILL_LEVEL_LABELS, GAMIFICATION_LEVEL_LABELS, MISSION_STATUS_LABELS } from "@/lib/matching-education/labels";
import { assignMissionAction, completeMissionAction } from "./actions";

export default async function PasaportPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const asParam = extractAsParam(sp);
  const user = await requireCurrentUser(asParam);

  const [dna, evolution, passport, missionCatalog, userMissions, creditLedger] = await Promise.all([
    getSkillDNA(user.id),
    getSkillEvolution(user.id),
    getPassport(user.id),
    getMissionCatalog(),
    getUserMissions(user.id),
    getSkillCreditLedger(user.id),
  ]);

  const assignedMissionIds = new Set(userMissions.map((m) => m.missionId));
  const availableMissions = missionCatalog.filter((m) => !assignedMissionIds.has(m.id));

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-6 py-12">
      <DevUserSwitcher activeUserId={user.id} />

      <PageHeader
        briefSection="Bölüm 11-13 · V1/V2"
        title="Skill Pasaport"
        description="Skill DNA + Evolution + Passport + Missions + Achievements + Skill Credits — student2/matching-education branch'inin gamification katmanı."
      />

      <Section title="Seviye ve Katkı">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Card>
            <p className="text-xs text-neutral-500">Gamification Level</p>
            <p className="text-lg font-semibold text-violet-600">{GAMIFICATION_LEVEL_LABELS[passport.gamification.level]}</p>
          </Card>
          <Card>
            <p className="text-xs text-neutral-500">Contribution Points</p>
            <p className="text-lg font-semibold">{passport.contributionPoints}</p>
          </Card>
          <Card>
            <p className="text-xs text-neutral-500">Skill Credits</p>
            <p className="text-lg font-semibold">{passport.skillCredits}</p>
          </Card>
          <Card>
            <p className="text-xs text-neutral-500">Tamamlanan Guide Session</p>
            <p className="text-lg font-semibold">{passport.completedGuideSessions}</p>
          </Card>
        </div>
      </Section>

      <Section title="Skill DNA">
        {dna.length === 0 ? (
          <EmptyState>Henüz skill eklemedin, DNA burada görünecek.</EmptyState>
        ) : (
          <div className="space-y-2">
            {dna.map((entry) => (
              <div key={entry.category} className="flex items-center gap-3">
                <span className="w-32 shrink-0 text-sm text-neutral-600">{entry.category}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-neutral-100">
                  <div className="h-full rounded-full bg-violet-500" style={{ width: `${entry.percent}%` }} />
                </div>
                <span className="w-16 shrink-0 text-right text-xs text-neutral-500">
                  {entry.count} skill (%{entry.percent})
                </span>
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section title="Skill Evolution">
        {evolution.length === 0 ? (
          <EmptyState>Henüz bir seviye geçmişi yok — skill ekledikçe/güncelledikçe burada birikir.</EmptyState>
        ) : (
          <div className="space-y-1 text-sm">
            {evolution.map((event) => (
              <div key={event.id} className="flex items-center justify-between rounded-md border border-neutral-100 px-3 py-1.5">
                <span>
                  {event.skill.name} — {SKILL_LEVEL_LABELS[event.level]}
                </span>
                <span className="text-xs text-neutral-400">{new Date(event.recordedAt).toLocaleDateString("tr-TR")}</span>
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section title="Passport">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Card>
            <p className="text-xs text-neutral-500">Öğretilen (tamamlanan)</p>
            <p className="text-lg font-semibold">{passport.completedSkillSessionsTaught} session</p>
          </Card>
          <Card>
            <p className="text-xs text-neutral-500">Öğrenilen (tamamlanan)</p>
            <p className="text-lg font-semibold">{passport.completedSkillSessionsLearned} session</p>
          </Card>
          <Card>
            <p className="text-xs text-neutral-500">Öğretme/Öğrenme saati</p>
            <p className="text-lg font-semibold">
              {Math.round((passport.hoursTaughtMinutes + passport.hoursLearnedMinutes) / 60)} sa
            </p>
          </Card>
          <Card>
            <p className="text-xs text-neutral-500">Teach skiller</p>
            <p className="text-lg font-semibold">{passport.teachSkillCount}</p>
          </Card>
          <Card>
            <p className="text-xs text-neutral-500">Learn skiller</p>
            <p className="text-lg font-semibold">{passport.learnSkillCount}</p>
          </Card>
          <Card>
            <p className="text-xs text-neutral-500">Rehberlik dakikası</p>
            <p className="text-lg font-semibold">{passport.guideMinutes} dk</p>
          </Card>
        </div>
      </Section>

      <Section title="Achievements">
        {passport.achievements.length === 0 ? (
          <EmptyState>Henüz rozet kazanmadın — skill ekleyip session tamamladıkça burada birikir.</EmptyState>
        ) : (
          <div className="flex flex-wrap gap-2">
            {passport.achievements.map((ua) => (
              <Badge key={ua.id} tone="amber">
                🏅 {ua.achievement.title}
              </Badge>
            ))}
          </div>
        )}
      </Section>

      <Section title="Missions">
        {userMissions.length > 0 ? (
          <div className="mb-3 space-y-2">
            {userMissions.map((um) => (
              <Card key={um.id}>
                <div className="mb-1 flex items-center justify-between">
                  <p className="font-medium">{um.mission.title}</p>
                  <Badge tone={um.status === "COMPLETED" ? "green" : "neutral"}>{MISSION_STATUS_LABELS[um.status]}</Badge>
                </div>
                <p className="mb-2 text-sm text-neutral-600">{um.mission.instructions}</p>
                {um.status !== "COMPLETED" ? (
                  <form action={completeMissionAction} className="flex items-center gap-2">
                    {asParam ? <input type="hidden" name="asUserId" value={asParam} /> : null}
                    <input type="hidden" name="userMissionId" value={um.id} />
                    <input type="text" name="evidence" placeholder="Kanıt / kısa özet (opsiyonel)" className={inputClass} />
                    <button type="submit" className={buttonClass}>
                      Tamamlandı
                    </button>
                  </form>
                ) : null}
              </Card>
            ))}
          </div>
        ) : null}

        <h3 className="mb-2 text-sm font-semibold text-neutral-500">Mevcut Mission&apos;lar</h3>
        {availableMissions.length === 0 ? (
          <EmptyState>Yeni mission yok.</EmptyState>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {availableMissions.map((mission) => (
              <Card key={mission.id}>
                <p className="font-medium">{mission.title}</p>
                <p className="mb-2 text-sm text-neutral-600">{mission.description}</p>
                <p className="mb-2 text-xs text-neutral-400">+{mission.rewardPoints} puan</p>
                <form action={assignMissionAction}>
                  {asParam ? <input type="hidden" name="asUserId" value={asParam} /> : null}
                  <input type="hidden" name="missionId" value={mission.id} />
                  <button type="submit" className={buttonSecondaryClass}>
                    Görevi al
                  </button>
                </form>
              </Card>
            ))}
          </div>
        )}
      </Section>

      <Section title="Skill Credits Defteri">
        {creditLedger.length === 0 ? (
          <EmptyState>Henüz Skill Credits hareketi yok.</EmptyState>
        ) : (
          <div className="space-y-1 text-sm">
            {creditLedger.map((entry) => (
              <div key={entry.id} className="flex items-center justify-between rounded-md border border-neutral-100 px-3 py-1.5">
                <span>
                  +{entry.amount} — {entry.source} {entry.counterparty ? `(${entry.counterparty.name})` : ""}
                </span>
                <span className="text-xs text-neutral-400">{new Date(entry.createdAt).toLocaleDateString("tr-TR")}</span>
              </div>
            ))}
          </div>
        )}
      </Section>
    </main>
  );
}

import Link from "next/link";
import { requireCurrentUser, extractAsParam, listDemoUsers } from "@/lib/matching-education/current-user";
import { DevUserSwitcher } from "@/lib/matching-education/dev-user-switcher";
import { getUserMeetups } from "@/lib/matching-education/queries/meetup";
import { PageHeader, Section, Card, Badge, EmptyState, inputClass, buttonClass } from "@/lib/matching-education/ui";
import { BUDGET_LEVEL_LABELS } from "@/lib/labels";
import { MEETUP_STATUS_LABELS } from "@/lib/matching-education/labels";
import { createMeetupAction } from "./actions";

export default async function MeetupPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const asParam = extractAsParam(sp);

  const user = await requireCurrentUser(asParam);
  const [{ created, invited }, demoUsers] = await Promise.all([
    getUserMeetups(user.id),
    listDemoUsers(),
  ]);
  const invitableUsers = demoUsers.filter((d) => d.id !== user.id);

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-6 py-12">
      <DevUserSwitcher activeUserId={user.id} />

      <PageHeader
        briefSection="Bölüm 9, 17 · V2"
        title="Meetup Planla"
        description="Kişi sayısı + bütçe + şehir + rota + alternatifler. AI, Ekonomik/Dengeli/Premium olmak üzere 3 alternatif üretir."
      />

      <Section title="Yeni Meetup Planla">
        <Card>
          <form action={createMeetupAction} className="space-y-4">
            {asParam ? <input type="hidden" name="asUserId" value={asParam} /> : null}

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-neutral-700">Şehir</label>
                <input type="text" name="city" placeholder="İstanbul" className={inputClass} required />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-neutral-700">Kişi sayısı</label>
                <input type="number" name="peopleCount" min={1} max={20} defaultValue={4} className={inputClass} required />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-neutral-700">Bütçe</label>
                <select name="budgetLevel" className={inputClass} defaultValue="">
                  <option value="">Fark etmez</option>
                  {Object.entries(BUDGET_LEVEL_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-neutral-700">Tarih</label>
                <input type="date" name="date" className={inputClass} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-neutral-700">Başlangıç saati</label>
                <input type="time" name="timeRangeStart" defaultValue="19:00" className={inputClass} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-neutral-700">Bitiş saati</label>
                <input type="time" name="timeRangeEnd" defaultValue="23:00" className={inputClass} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-neutral-700">Hava/tarz</label>
                <input type="text" name="vibe" placeholder="sakin, sohbet ağırlıklı" className={inputClass} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-neutral-700">Ulaşım tercihi</label>
                <input type="text" name="transportPreference" placeholder="yürüyerek / toplu taşıma" className={inputClass} />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-medium text-neutral-700">Yemek/aktivite tercihi</label>
                <input
                  type="text"
                  name="foodOrActivityPreference"
                  placeholder="ör. deniz manzaralı, vegan seçenek olsun"
                  className={inputClass}
                />
              </div>
            </div>

            {invitableUsers.length > 0 ? (
              <div>
                <label className="mb-1 block text-sm font-medium text-neutral-700">Davet et</label>
                <div className="flex flex-wrap gap-3">
                  {invitableUsers.map((demoUser) => (
                    <label key={demoUser.id} className="flex items-center gap-1.5 text-sm text-neutral-700">
                      <input type="checkbox" name="participantUserIds" value={demoUser.id} />
                      {demoUser.name}
                    </label>
                  ))}
                </div>
              </div>
            ) : null}

            <button type="submit" className={buttonClass}>
              Planı Oluştur
            </button>
          </form>
        </Card>
      </Section>

      <Section title="Oluşturduğun Meetup'lar">
        {created.length === 0 ? (
          <EmptyState>Henüz bir meetup planlamadın.</EmptyState>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {created.map((meetup) => (
              <Link key={meetup.id} href={`/meetup/${meetup.id}${asParam ? `?as=${asParam}` : ""}`}>
                <Card className="space-y-1 transition-colors hover:border-violet-400">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">{meetup.city}</span>
                    <Badge tone={meetup.status === "CONFIRMED" ? "green" : "neutral"}>
                      {MEETUP_STATUS_LABELS[meetup.status]}
                    </Badge>
                  </div>
                  <p className="text-xs text-neutral-500">
                    {meetup.peopleCount} kişi
                    {meetup.date ? ` · ${new Date(meetup.date).toLocaleDateString("tr-TR")}` : ""}
                  </p>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </Section>

      <Section title="Davet edildiğin Meetup'lar">
        {invited.length === 0 ? (
          <EmptyState>Henüz bir meetup&apos;a davet edilmedin.</EmptyState>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {invited.map((meetup) => (
              <Link key={meetup.id} href={`/meetup/${meetup.id}${asParam ? `?as=${asParam}` : ""}`}>
                <Card className="space-y-1 transition-colors hover:border-violet-400">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">{meetup.city}</span>
                    <Badge tone={meetup.status === "CONFIRMED" ? "green" : "neutral"}>
                      {MEETUP_STATUS_LABELS[meetup.status]}
                    </Badge>
                  </div>
                  <p className="text-xs text-neutral-500">{meetup.createdBy.name} davet etti</p>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </Section>
    </main>
  );
}

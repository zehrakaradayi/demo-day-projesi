import Link from "next/link";
import { notFound } from "next/navigation";
import { requireCurrentUser, extractAsParam } from "@/lib/matching-education/current-user";
import { DevUserSwitcher } from "@/lib/matching-education/dev-user-switcher";
import { getDepartmentById, getUserEducations } from "@/lib/matching-education/queries/schools";
import { getGuideProfile, getSessionsForUser } from "@/lib/matching-education/queries/guides";
import {
  PageHeader,
  Section,
  Card,
  Badge,
  EmptyState,
  inputClass,
  buttonClass,
  buttonSecondaryClass,
} from "@/lib/matching-education/ui";
import {
  YEAR_STATUS_LABELS,
  GUIDE_TYPE_LABELS,
  GUIDE_TOPIC_SUGGESTIONS,
  SESSION_STATUS_LABELS,
} from "@/lib/matching-education/labels";
import { setMyEducationAction } from "../../../actions";
import {
  upsertGuideProfileAction,
  requestGuideSessionAction,
  completeGuideSessionAction,
  rateGuideSessionAction,
} from "./actions";
import { YearStatus } from "@/generated/prisma/client";

export default async function BolumSayfasiPage({
  params,
  searchParams,
}: {
  params: Promise<{ schoolId: string; departmentId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { schoolId, departmentId } = await params;
  const sp = await searchParams;
  const asParam = extractAsParam(sp);
  const yearFilter = typeof sp.year === "string" && sp.year in YearStatus ? (sp.year as YearStatus) : undefined;

  const user = await requireCurrentUser(asParam);
  const result = await getDepartmentById(schoolId, departmentId, yearFilter);
  if (!result) notFound();
  const { department, educations, guides } = result;

  const [myEducations, myGuideProfile, mySessions] = await Promise.all([
    getUserEducations(user.id),
    getGuideProfile(user.id),
    getSessionsForUser(user.id),
  ]);

  const isEnrolledHere = myEducations.some((e) => e.departmentId === departmentId);
  const rosterIds = new Set(educations.map((e) => e.userId));
  const relevantSessions = mySessions.filter((s) => rosterIds.has(s.guideId) || rosterIds.has(s.participantId));
  const otherGuides = guides.filter((g) => g.userId !== user.id);

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-6 py-12">
      <DevUserSwitcher activeUserId={user.id} />

      <PageHeader
        briefSection="Bölüm 5 · MVP"
        title={`${department.school.name} — ${department.name}`}
        description={department.faculty ?? "Bölüm hakkında bilgi al, ders konularını ve rehberleri keşfet."}
      />

      <Section title="Yıl / Sınıf filtresi">
        <form method="get" className="flex flex-wrap items-center gap-2">
          {asParam ? <input type="hidden" name="as" value={asParam} /> : null}
          <select name="year" defaultValue={yearFilter ?? ""} className={inputClass}>
            <option value="">Tümü</option>
            {Object.entries(YEAR_STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <button type="submit" className={buttonSecondaryClass}>
            Filtrele
          </button>
        </form>
      </Section>

      {!isEnrolledHere ? (
        <Section title="Bu bölümde okuyorum">
          <Card>
            <form action={setMyEducationAction} className="flex flex-wrap items-center gap-2">
              {asParam ? <input type="hidden" name="asUserId" value={asParam} /> : null}
              <input type="hidden" name="schoolId" value={schoolId} />
              <input type="hidden" name="departmentId" value={departmentId} />
              <select name="yearStatus" className={inputClass} defaultValue="">
                <option value="">Sınıf seç (opsiyonel)</option>
                {Object.entries(YEAR_STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              <button type="submit" className={buttonClass}>
                Bu bölümde okuyorum
              </button>
            </form>
          </Card>
        </Section>
      ) : null}

      <Section title="Bölümdeki Öğrenciler">
        {educations.length === 0 ? (
          <EmptyState>Bu filtreyle eşleşen öğrenci yok.</EmptyState>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {educations.map((edu) => (
              <Card key={edu.id}>
                <p className="font-medium">{edu.user.name}</p>
                <p className="text-xs text-neutral-500">
                  {edu.yearStatus ? YEAR_STATUS_LABELS[edu.yearStatus] : "Sınıf belirtilmemiş"}
                  {edu.user.city ? ` · ${edu.user.city}` : ""}
                </p>
                {edu.user.userSkills.length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {edu.user.userSkills.map((us) => (
                      <Badge key={us.id}>{us.skill.name}</Badge>
                    ))}
                  </div>
                ) : null}
              </Card>
            ))}
          </div>
        )}
      </Section>

      <Section title="Bölüm Rehberliği — 'Bölümü Tanıma' Session'ları">
        {isEnrolledHere ? (
          <Card className="mb-3">
            <p className="mb-2 text-sm font-medium">
              {myGuideProfile ? "Rehber profilini güncelle" : "Bölümümü tanıtabilirim"}
            </p>
            <form action={upsertGuideProfileAction} className="space-y-3">
              {asParam ? <input type="hidden" name="asUserId" value={asParam} /> : null}
              <input type="hidden" name="schoolId" value={schoolId} />
              <input type="hidden" name="departmentId" value={departmentId} />

              <div className="flex flex-wrap gap-2">
                {GUIDE_TOPIC_SUGGESTIONS.map((topic) => (
                  <label key={topic} className="flex items-center gap-1.5 text-sm">
                    <input
                      type="checkbox"
                      name="topics"
                      value={topic}
                      defaultChecked={myGuideProfile?.topics.includes(topic)}
                    />
                    {topic}
                  </label>
                ))}
              </div>

              <div className="flex gap-4 text-sm">
                <label className="flex items-center gap-1.5">
                  <input
                    type="checkbox"
                    name="sessionDurations"
                    value="30"
                    defaultChecked={myGuideProfile?.sessionDurations.includes(30) ?? true}
                  />
                  30 dakika
                </label>
                <label className="flex items-center gap-1.5">
                  <input
                    type="checkbox"
                    name="sessionDurations"
                    value="60"
                    defaultChecked={myGuideProfile?.sessionDurations.includes(60) ?? true}
                  />
                  60 dakika
                </label>
              </div>

              <select name="guideType" defaultValue={myGuideProfile?.guideType ?? "STUDENT"} className={inputClass}>
                <option value="STUDENT">Öğrenci Rehber</option>
                <option value="ALUMNI">Alumni Rehber</option>
              </select>

              <button type="submit" className={buttonClass}>
                {myGuideProfile ? "Güncelle" : "Rehber ol"}
              </button>
            </form>
          </Card>
        ) : null}

        <h3 className="text-sm font-semibold text-neutral-500">Rehberler</h3>
        {otherGuides.length === 0 ? (
          <EmptyState>Bu bölümde henüz aktif bir rehber yok.</EmptyState>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {otherGuides.map((guide) => (
              <Card key={guide.id}>
                <div className="mb-2 flex items-center justify-between">
                  <p className="font-medium">{guide.user.name}</p>
                  <Badge tone="amber">{GUIDE_TYPE_LABELS[guide.guideType]}</Badge>
                </div>
                <div className="mb-3 flex flex-wrap gap-1">
                  {guide.topics.map((topic) => (
                    <Badge key={topic}>{topic}</Badge>
                  ))}
                </div>
                <form action={requestGuideSessionAction} className="space-y-2">
                  {asParam ? <input type="hidden" name="asUserId" value={asParam} /> : null}
                  <input type="hidden" name="schoolId" value={schoolId} />
                  <input type="hidden" name="departmentId" value={departmentId} />
                  <input type="hidden" name="guideId" value={guide.userId} />
                  <select name="topic" className={inputClass} defaultValue={guide.topics[0]}>
                    {guide.topics.map((topic) => (
                      <option key={topic} value={topic}>
                        {topic}
                      </option>
                    ))}
                  </select>
                  <select name="durationMinutes" className={inputClass} defaultValue={guide.sessionDurations[0] ?? 30}>
                    {guide.sessionDurations.map((duration) => (
                      <option key={duration} value={duration}>
                        {duration} dakika
                      </option>
                    ))}
                  </select>
                  <button type="submit" className={`${buttonClass} w-full`}>
                    Session iste
                  </button>
                </form>
              </Card>
            ))}
          </div>
        )}
      </Section>

      <Section title="Session'larım">
        {relevantSessions.length === 0 ? (
          <EmptyState>Bu bölümle ilgili henüz bir rehberlik session&apos;ın yok.</EmptyState>
        ) : (
          <div className="space-y-2">
            {relevantSessions.map((session) => {
              const isGuide = session.guideId === user.id;
              return (
                <Card key={session.id} className="flex flex-col gap-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-medium">{session.topic}</p>
                      <p className="text-xs text-neutral-500">
                        {isGuide ? `Katılımcı: ${session.participant.name}` : `Rehber: ${session.guide.name}`} ·{" "}
                        {session.durationMinutes} dk
                      </p>
                    </div>
                    <Badge tone={session.status === "COMPLETED" ? "green" : "neutral"}>
                      {SESSION_STATUS_LABELS[session.status]}
                    </Badge>
                  </div>

                  {isGuide && session.status !== "COMPLETED" && session.status !== "CANCELLED" ? (
                    <form action={completeGuideSessionAction}>
                      {asParam ? <input type="hidden" name="asUserId" value={asParam} /> : null}
                      <input type="hidden" name="schoolId" value={schoolId} />
                      <input type="hidden" name="departmentId" value={departmentId} />
                      <input type="hidden" name="sessionId" value={session.id} />
                      <button type="submit" className={buttonSecondaryClass}>
                        Tamamlandı olarak işaretle
                      </button>
                    </form>
                  ) : null}

                  {!isGuide && session.status === "COMPLETED" && !session.rating ? (
                    <form action={rateGuideSessionAction} className="flex items-center gap-2">
                      {asParam ? <input type="hidden" name="asUserId" value={asParam} /> : null}
                      <input type="hidden" name="schoolId" value={schoolId} />
                      <input type="hidden" name="departmentId" value={departmentId} />
                      <input type="hidden" name="sessionId" value={session.id} />
                      <select name="rating" className={inputClass} defaultValue="5">
                        {[5, 4, 3, 2, 1].map((r) => (
                          <option key={r} value={r}>
                            {r} yıldız
                          </option>
                        ))}
                      </select>
                      <button type="submit" className={buttonSecondaryClass}>
                        Değerlendir
                      </button>
                    </form>
                  ) : null}

                  {session.rating ? (
                    <p className="text-xs text-neutral-500">Değerlendirme: {session.rating}/5</p>
                  ) : null}
                </Card>
              );
            })}
          </div>
        )}
      </Section>

      <Link href={`/okullar/${schoolId}${asParam ? `?as=${asParam}` : ""}`} className="text-sm text-violet-600 hover:underline">
        ← {department.school.name} okul profiline dön
      </Link>
    </main>
  );
}

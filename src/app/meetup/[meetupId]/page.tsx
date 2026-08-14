import Link from "next/link";
import { notFound } from "next/navigation";
import { requireCurrentUser, extractAsParam } from "@/lib/matching-education/current-user";
import { DevUserSwitcher } from "@/lib/matching-education/dev-user-switcher";
import { getMeetupById } from "@/lib/matching-education/queries/meetup";
import { PageHeader, Section, Card, Badge, EmptyState, buttonClass, buttonSecondaryClass } from "@/lib/matching-education/ui";
import { BUDGET_LEVEL_LABELS } from "@/lib/labels";
import {
  MEETUP_STATUS_LABELS,
  MEETUP_TIER_LABELS,
  MEETUP_PARTICIPANT_STATUS_LABELS,
} from "@/lib/matching-education/labels";
import {
  chooseAlternativeAction,
  cancelMeetupAction,
  regeneratePlanAction,
  respondInviteAction,
} from "../actions";

function StopsTimeline({
  stops,
}: {
  stops: { id: string; order: number; startTime: string; locationName: string; activityType: string; transportMinutesFromPrevious: number | null; notes: string | null }[];
}) {
  return (
    <ol className="space-y-2">
      {stops.map((stop) => (
        <li key={stop.id} className="flex gap-3 text-sm">
          <span className="w-12 shrink-0 font-medium text-violet-600">{stop.startTime}</span>
          <div>
            <p className="font-medium">
              {stop.locationName} <span className="font-normal text-neutral-500">— {stop.activityType}</span>
            </p>
            {stop.transportMinutesFromPrevious ? (
              <p className="text-xs text-neutral-500">
                Bir önceki duraktan ~{stop.transportMinutesFromPrevious} dk
              </p>
            ) : null}
            {stop.notes ? <p className="text-xs text-neutral-500">{stop.notes}</p> : null}
          </div>
        </li>
      ))}
    </ol>
  );
}

export default async function MeetupDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ meetupId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { meetupId } = await params;
  const sp = await searchParams;
  const asParam = extractAsParam(sp);

  const user = await requireCurrentUser(asParam);
  const meetup = await getMeetupById(meetupId);
  if (!meetup) notFound();

  const isCreator = meetup.createdById === user.id;
  const myParticipation = meetup.participants.find((p) => p.userId === user.id);
  if (!isCreator && !myParticipation) notFound();

  const hasAlternatives = meetup.alternatives.length > 0;
  const isDecided = meetup.status === "CONFIRMED" && meetup.chosenAlternative;
  const asQuery = asParam ? `?as=${asParam}` : "";

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-6 py-12">
      <DevUserSwitcher activeUserId={user.id} />

      <div>
        <Link href={`/meetup${asQuery}`} className="text-sm text-violet-600 hover:underline">
          ← Meetup&apos;lar
        </Link>
      </div>

      <PageHeader
        briefSection="Bölüm 9, 17 · V2"
        title={meetup.city}
        description={[
          `${meetup.peopleCount} kişi`,
          meetup.date ? new Date(meetup.date).toLocaleDateString("tr-TR") : null,
          meetup.timeRangeStart ? `${meetup.timeRangeStart}-${meetup.timeRangeEnd ?? ""}` : null,
          meetup.budgetLevel ? `Bütçe: ${BUDGET_LEVEL_LABELS[meetup.budgetLevel]}` : null,
        ]
          .filter(Boolean)
          .join(" · ")}
      />

      <div className="flex items-center gap-2">
        <Badge tone={meetup.status === "CONFIRMED" ? "green" : meetup.status === "CANCELLED" ? "neutral" : "violet"}>
          {MEETUP_STATUS_LABELS[meetup.status]}
        </Badge>
        {meetup.vibe ? <span className="text-sm text-neutral-500">{meetup.vibe}</span> : null}
      </div>

      <Section title="Katılımcılar">
        <div className="flex flex-wrap gap-2">
          <Card className="flex items-center gap-2">
            <span className="font-medium">{meetup.createdBy.name}</span>
            <Badge tone="violet">Organizatör</Badge>
          </Card>
          {meetup.participants.map((participant) => (
            <Card key={participant.id} className="flex items-center gap-2">
              <span className="font-medium">{participant.user.name}</span>
              <Badge tone={participant.status === "ACCEPTED" ? "green" : participant.status === "DECLINED" ? "neutral" : "amber"}>
                {MEETUP_PARTICIPANT_STATUS_LABELS[participant.status]}
              </Badge>
            </Card>
          ))}
        </div>

        {myParticipation && myParticipation.status === "INVITED" ? (
          <div className="flex gap-2">
            <form action={respondInviteAction}>
              {asParam ? <input type="hidden" name="asUserId" value={asParam} /> : null}
              <input type="hidden" name="meetupId" value={meetup.id} />
              <input type="hidden" name="status" value="ACCEPTED" />
              <button type="submit" className={buttonClass}>
                Katılıyorum
              </button>
            </form>
            <form action={respondInviteAction}>
              {asParam ? <input type="hidden" name="asUserId" value={asParam} /> : null}
              <input type="hidden" name="meetupId" value={meetup.id} />
              <input type="hidden" name="status" value="DECLINED" />
              <button type="submit" className={buttonSecondaryClass}>
                Katılamıyorum
              </button>
            </form>
          </div>
        ) : null}
      </Section>

      {meetup.status === "CANCELLED" ? (
        <EmptyState>Bu meetup iptal edildi.</EmptyState>
      ) : isDecided && meetup.chosenAlternative ? (
        <Section title="Seçilen plan">
          <Card className="space-y-3">
            <div className="flex items-center justify-between">
              <Badge tone="green">{MEETUP_TIER_LABELS[meetup.chosenAlternative.tier]}</Badge>
              {meetup.chosenAlternative.perPersonBudgetEstimate ? (
                <span className="text-sm text-neutral-500">
                  ~{meetup.chosenAlternative.perPersonBudgetEstimate} TL / kişi
                </span>
              ) : null}
            </div>
            <StopsTimeline stops={meetup.chosenAlternative.stops} />
          </Card>
        </Section>
      ) : hasAlternatives ? (
        <Section title="AI Alternatifleri">
          <p className="text-xs text-neutral-500">
            Mekan isimleri AI tarafından üretildi, gerçekliğini teyit etmeyi unutma.
          </p>
          <div className="grid gap-4 sm:grid-cols-3">
            {meetup.alternatives.map((alternative) => (
              <Card key={alternative.id} className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <Badge tone="violet">{MEETUP_TIER_LABELS[alternative.tier]}</Badge>
                  {alternative.perPersonBudgetEstimate ? (
                    <span className="text-xs text-neutral-500">
                      ~{alternative.perPersonBudgetEstimate} TL/kişi
                    </span>
                  ) : null}
                </div>
                <StopsTimeline stops={alternative.stops} />
                {isCreator ? (
                  <form action={chooseAlternativeAction}>
                    {asParam ? <input type="hidden" name="asUserId" value={asParam} /> : null}
                    <input type="hidden" name="meetupId" value={meetup.id} />
                    <input type="hidden" name="alternativeId" value={alternative.id} />
                    <button type="submit" className={`${buttonClass} w-full`}>
                      Bu planı seç
                    </button>
                  </form>
                ) : null}
              </Card>
            ))}
          </div>
        </Section>
      ) : (
        <EmptyState>
          AI planı üretilemedi — model şu an yoğun olabilir veya ücretsiz katmanın günlük
          kotası dolmuş olabilir. Birkaç dakika sonra &quot;Tekrar dene&quot;yi bir daha dene.
        </EmptyState>
      )}

      {isCreator && meetup.status !== "CANCELLED" ? (
        <div className="flex gap-2">
          <form action={regeneratePlanAction}>
            {asParam ? <input type="hidden" name="asUserId" value={asParam} /> : null}
            <input type="hidden" name="meetupId" value={meetup.id} />
            <button type="submit" className={buttonSecondaryClass}>
              {hasAlternatives ? "Farklı alternatifler üret" : "Tekrar dene"}
            </button>
          </form>
          <form action={cancelMeetupAction}>
            {asParam ? <input type="hidden" name="asUserId" value={asParam} /> : null}
            <input type="hidden" name="meetupId" value={meetup.id} />
            <button type="submit" className="text-sm text-red-600 hover:underline">
              Meetup&apos;ı iptal et
            </button>
          </form>
        </div>
      ) : null}
    </main>
  );
}

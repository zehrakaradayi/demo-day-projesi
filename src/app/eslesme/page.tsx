import { requireCurrentUser, extractAsParam } from "@/lib/matching-education/current-user";
import { DevUserSwitcher } from "@/lib/matching-education/dev-user-switcher";
import { computeMatches } from "@/lib/matching-education/match-engine";
import { PageHeader, Card, Badge, EmptyState, buttonClass, buttonSecondaryClass } from "@/lib/matching-education/ui";
import { MATCH_STATUS_LABELS, NETWORK_LABELS } from "@/lib/matching-education/labels";
import { refreshMatchesAction, likeMatchAction, passMatchAction } from "./actions";

export default async function EslesmePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const asParam = extractAsParam(sp);
  const networkFilter = sp.network === "TURKIYE" || sp.network === "GLOBAL" ? sp.network : undefined;

  const user = await requireCurrentUser(asParam);
  const allMatches = await computeMatches(user.id);
  const matches = networkFilter ? allMatches.filter((m) => m.network === networkFilter) : allMatches;

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-6 py-12">
      <DevUserSwitcher activeUserId={user.id} />

      <PageHeader
        briefSection="Bölüm 6, 17 · MVP"
        title="Eşleşme"
        description="% uyum + Why matched + skill + lifestyle + school/department + availability kırılımı."
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2 text-sm">
          <a
            href={`/eslesme${asParam ? `?as=${asParam}` : ""}`}
            className={!networkFilter ? "font-semibold text-violet-600" : "text-neutral-500"}
          >
            Tümü
          </a>
          <span className="text-neutral-300">·</span>
          <a
            href={`/eslesme?network=TURKIYE${asParam ? `&as=${asParam}` : ""}`}
            className={networkFilter === "TURKIYE" ? "font-semibold text-violet-600" : "text-neutral-500"}
          >
            {NETWORK_LABELS.TURKIYE}
          </a>
          <span className="text-neutral-300">·</span>
          <a
            href={`/eslesme?network=GLOBAL${asParam ? `&as=${asParam}` : ""}`}
            className={networkFilter === "GLOBAL" ? "font-semibold text-violet-600" : "text-neutral-500"}
          >
            {NETWORK_LABELS.GLOBAL}
          </a>
        </div>
        <form action={refreshMatchesAction}>
          {asParam ? <input type="hidden" name="asUserId" value={asParam} /> : null}
          <button type="submit" className={buttonSecondaryClass}>
            Yenile
          </button>
        </form>
      </div>

      {matches.length === 0 ? (
        <EmptyState>
          Henüz eşleşme yok. Skillerini, ders konularını ve okul bilgini ekledikçe daha iyi eşleşmeler bulunur.
        </EmptyState>
      ) : (
        <div className="space-y-4">
          {matches.map((match) => (
            <Card key={match.userId} className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{match.name}</p>
                  <p className="text-xs text-neutral-500">
                    {match.city ?? "—"} · {NETWORK_LABELS[match.network]}
                    {match.school ? ` · ${match.school}` : ""}
                    {match.department ? ` (${match.department})` : ""}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-semibold text-violet-600">%{Math.round(match.score)}</p>
                  <Badge tone={match.status === "MUTUAL" ? "green" : "neutral"}>
                    {MATCH_STATUS_LABELS[match.status]}
                  </Badge>
                </div>
              </div>

              {match.topTeachSkills.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {match.topTeachSkills.map((skillName) => (
                    <Badge key={skillName} tone="violet">
                      {skillName}
                    </Badge>
                  ))}
                </div>
              ) : null}

              {match.reasons.length > 0 ? (
                <details className="text-sm">
                  <summary className="cursor-pointer font-medium text-neutral-600">Neden eşleştik?</summary>
                  <ul className="mt-2 space-y-1 text-neutral-600">
                    {match.reasons.map((reason) => (
                      <li key={reason.factor} className="flex justify-between gap-2">
                        <span>
                          <span className="font-medium">{reason.label}</span> — {reason.detail}
                        </span>
                        <span className="shrink-0 text-neutral-400">+{reason.points}</span>
                      </li>
                    ))}
                  </ul>
                </details>
              ) : null}

              {match.status !== "MUTUAL" && match.status !== "PASSED" ? (
                <div className="flex gap-2">
                  <form action={likeMatchAction}>
                    {asParam ? <input type="hidden" name="asUserId" value={asParam} /> : null}
                    <input type="hidden" name="otherUserId" value={match.userId} />
                    <button type="submit" className={buttonClass}>
                      Beğen
                    </button>
                  </form>
                  <form action={passMatchAction}>
                    {asParam ? <input type="hidden" name="asUserId" value={asParam} /> : null}
                    <input type="hidden" name="otherUserId" value={match.userId} />
                    <button type="submit" className={buttonSecondaryClass}>
                      Geç
                    </button>
                  </form>
                </div>
              ) : null}
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}

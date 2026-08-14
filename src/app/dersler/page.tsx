import Link from "next/link";
import { requireCurrentUser, extractAsParam } from "@/lib/matching-education/current-user";
import { DevUserSwitcher } from "@/lib/matching-education/dev-user-switcher";
import { getCourseCatalog, getUserCourseTopics, getPeopleForTopic } from "@/lib/matching-education/queries/courses";
import { SKILL_LEVEL_LABELS, SKILL_MODE_LABELS } from "@/lib/matching-education/labels";
import { PageHeader, Section, Card, Badge, EmptyState, buttonSecondaryClass } from "@/lib/matching-education/ui";
import { TopicForm } from "./topic-form";
import { deleteUserCourseTopicAction } from "./actions";
import { SkillMode } from "@/generated/prisma/client";

export default async function DerslerPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const asParam = extractAsParam(sp);
  const browseTopicId = typeof sp.topicId === "string" ? sp.topicId : undefined;
  const browseMode = sp.browseMode === "LEARN" ? SkillMode.LEARN : SkillMode.TEACH;

  const user = await requireCurrentUser(asParam);
  const [courses, myTopics] = await Promise.all([getCourseCatalog(), getUserCourseTopics(user.id)]);

  const browsePeople = browseTopicId ? await getPeopleForTopic(browseTopicId, browseMode, user.id) : [];
  const browseTopic = browseTopicId
    ? courses.flatMap((c) => c.topics).find((t) => t.id === browseTopicId)
    : undefined;

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-6 py-12">
      <DevUserSwitcher activeUserId={user.id} />

      <PageHeader
        briefSection="Bölüm 4 · MVP"
        title="Dersler"
        description="Ders → konu → seviye → öğret/öğren. Soru çözme, konu anlatımı, sınava hazırlık; peer-learning session'ları."
      />

      <Section title="Benim Konularım">
        {myTopics.length === 0 ? (
          <EmptyState>Henüz bir ders konusu eklemedin.</EmptyState>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {myTopics.map((ut) => (
              <Card key={ut.id} className="flex items-start justify-between gap-2">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="font-medium">
                      {ut.topic.course.name} — {ut.topic.name}
                    </span>
                    <Badge tone={ut.mode === "TEACH" ? "green" : "violet"}>{SKILL_MODE_LABELS[ut.mode]}</Badge>
                    <Badge>{SKILL_LEVEL_LABELS[ut.level]}</Badge>
                  </div>
                  {ut.topic.level ? <p className="text-xs text-neutral-500">{ut.topic.level}</p> : null}
                </div>
                <form action={deleteUserCourseTopicAction}>
                  {asParam ? <input type="hidden" name="asUserId" value={asParam} /> : null}
                  <input type="hidden" name="id" value={ut.id} />
                  <button type="submit" className="text-xs text-neutral-400 hover:text-red-600">
                    Sil
                  </button>
                </form>
              </Card>
            ))}
          </div>
        )}
      </Section>

      <Section title="Konu Ekle">
        <Card>
          <TopicForm
            courses={courses.map((c) => ({ id: c.id, name: c.name, topics: c.topics }))}
            asUserId={asParam}
          />
        </Card>
      </Section>

      <Section title="Ders Kataloğu">
        <div className="space-y-4">
          {courses.map((course) => (
            <div key={course.id}>
              <h3 className="mb-2 text-sm font-semibold text-neutral-500">{course.name}</h3>
              <div className="flex flex-wrap gap-2">
                {course.topics.map((topic) => (
                  <Link
                    key={topic.id}
                    href={`/dersler?topicId=${topic.id}&browseMode=TEACH${asParam ? `&as=${asParam}` : ""}`}
                    className={`${buttonSecondaryClass} gap-1.5`}
                  >
                    {topic.name} {topic.level ? `(${topic.level})` : ""}
                    <span className="text-neutral-400">
                      {topic.teachCount} öğreten · {topic.learnCount} öğrenmek isteyen
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Section>

      {browseTopicId && browseTopic ? (
        <Section title={`"${browseTopic.name}" — ${browseMode === "TEACH" ? "Öğretenler" : "Öğrenmek isteyenler"}`}>
          <div className="mb-2 flex gap-2 text-sm">
            <Link
              href={`/dersler?topicId=${browseTopicId}&browseMode=TEACH${asParam ? `&as=${asParam}` : ""}`}
              className={browseMode === "TEACH" ? "font-semibold text-violet-600" : "text-neutral-500"}
            >
              Öğretenler
            </Link>
            <span className="text-neutral-300">·</span>
            <Link
              href={`/dersler?topicId=${browseTopicId}&browseMode=LEARN${asParam ? `&as=${asParam}` : ""}`}
              className={browseMode === "LEARN" ? "font-semibold text-violet-600" : "text-neutral-500"}
            >
              Öğrenmek isteyenler
            </Link>
          </div>
          {browsePeople.length === 0 ? (
            <EmptyState>Bu konu için henüz kimse yok.</EmptyState>
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

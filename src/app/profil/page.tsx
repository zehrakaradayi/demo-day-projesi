import Link from "next/link";
import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { logout } from "@/lib/auth-actions";
import { SkillMode, YearStatus } from "@/generated/prisma/client";
import { Avatar } from "@/components/avatar";
import { AddSkillForm } from "./add-skill-form";
import { addLearnSkill, addTeachSkill, removeUserSkill } from "./actions";
import {
  BUDGET_LEVEL_LABELS,
  MATCH_MODE_PREFERENCE_LABELS,
  MEETING_PREFERENCE_LABELS,
  PACE_LABELS,
  PLANNING_STYLE_LABELS,
  SKILL_LEVEL_LABELS,
  SOCIAL_ENERGY_LABELS,
  YEAR_STATUS_LABELS,
} from "@/lib/labels";

function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-lg border border-neutral-200 p-5">
      <h2 className="text-sm font-medium text-neutral-500">{title}</h2>
      <div className="mt-2">{children}</div>
    </section>
  );
}

function Empty({ text = "Henüz eklenmedi." }: { text?: string }) {
  return <p className="text-sm text-neutral-500">{text}</p>;
}

function Chip({ children }: { children: ReactNode }) {
  return (
    <li className="rounded-full border border-neutral-300 px-3 py-1 text-sm">
      {children}
    </li>
  );
}

export default async function ProfilPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/giris");
  }

  const [dbUser, allSkills] = await Promise.all([
    prisma.user.findUnique({
      where: { id: user.id },
      include: {
        userSkills: { include: { skill: true }, orderBy: { createdAt: "asc" } },
        lifestyleProfile: true,
        educations: { include: { school: true, department: true } },
      },
    }),
    prisma.skill.findMany({ orderBy: { name: "asc" } }),
  ]);

  if (!dbUser) {
    // Supabase auth kullanıcısı var ama DB'de satırı yok — normalde olmaz,
    // ama kırık bir kayıt akışından kalmışsa onboarding'e yönlendir.
    redirect("/onboarding");
  }

  const teachSkills = dbUser.userSkills.filter((s) => s.mode === SkillMode.TEACH);
  const learnSkills = dbUser.userSkills.filter((s) => s.mode === SkillMode.LEARN);
  const teachSkillIds = new Set(teachSkills.map((s) => s.skillId));
  const learnSkillIds = new Set(learnSkills.map((s) => s.skillId));
  const education = dbUser.educations[0];
  const lifestyle = dbUser.lifestyleProfile;
  const availabilitySlots =
    lifestyle?.availability &&
    typeof lifestyle.availability === "object" &&
    "slots" in lifestyle.availability
      ? ((lifestyle.availability as { slots: string[] }).slots ?? [])
      : [];

  const isOnboarded = dbUser.educations.length > 0;

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-16">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar name={dbUser.name} avatarUrl={dbUser.avatarUrl} />
          <div className="space-y-1">
            <span className="text-sm font-medium text-violet-600">
              Bölüm 17 · MVP
            </span>
            <h1 className="text-3xl font-semibold tracking-tight">
              {dbUser.name}
            </h1>
          </div>
        </div>
        <form action={logout}>
          <button
            type="submit"
            className="whitespace-nowrap text-sm font-medium text-violet-600 hover:underline"
          >
            Çıkış yap
          </button>
        </form>
      </div>

      {!isOnboarded && (
        <section className="rounded-lg border border-dashed border-violet-300 bg-violet-50 p-5">
          <h2 className="text-base font-semibold text-violet-900">
            Profilini tamamla
          </h2>
          <p className="mt-1 text-sm text-violet-800">
            Skill&apos;lerini, okulunu ve tercihlerini ekleyerek eşleşme
            kalitesini artır. Sadece birkaç dakika sürer.
          </p>
          <Link
            href="/onboarding"
            className="mt-3 inline-block rounded-md bg-violet-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-violet-700"
          >
            Profilini tamamla
          </Link>
        </section>
      )}

      <Section title="Temel bilgiler">
        <p className="text-lg font-medium">{dbUser.name}</p>
        <p className="text-neutral-600">
          {dbUser.ageRange ? `${dbUser.ageRange} yaş` : "Yaş aralığı belirtilmemiş"}
          {" · "}
          {dbUser.city ?? "Şehir belirtilmemiş"}
          {dbUser.country ? `, ${dbUser.country}` : ""}
        </p>
        {dbUser.languages.length > 0 ? (
          <ul className="mt-2 flex flex-wrap gap-2">
            {dbUser.languages.map((lang) => (
              <Chip key={lang}>{lang}</Chip>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-neutral-500">Dil belirtilmemiş.</p>
        )}
      </Section>

      <Section title="Öğretebildiklerim">
        <div className="flex flex-col gap-3">
          {teachSkills.length > 0 ? (
            <ul className="flex flex-wrap gap-2">
              {teachSkills.map((userSkill) => (
                <li
                  key={userSkill.id}
                  className="flex items-center gap-1.5 rounded-full border border-neutral-300 px-3 py-1 text-sm"
                >
                  <span>
                    {userSkill.skill.name} · {SKILL_LEVEL_LABELS[userSkill.level]}
                  </span>
                  <form action={removeUserSkill}>
                    <input type="hidden" name="userSkillId" value={userSkill.id} />
                    <button
                      type="submit"
                      aria-label="Kaldır"
                      className="text-neutral-400 hover:text-red-600"
                    >
                      ×
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          ) : (
            <Empty />
          )}
          <AddSkillForm
            action={addTeachSkill}
            skills={allSkills.filter((s) => !teachSkillIds.has(s.id))}
          />
        </div>
      </Section>

      <Section title="Öğrenmek istediklerim">
        <div className="flex flex-col gap-3">
          {learnSkills.length > 0 ? (
            <ul className="flex flex-wrap gap-2">
              {learnSkills.map((userSkill) => (
                <li
                  key={userSkill.id}
                  className="flex items-center gap-1.5 rounded-full border border-neutral-300 px-3 py-1 text-sm"
                >
                  <span>
                    {userSkill.skill.name} · {SKILL_LEVEL_LABELS[userSkill.level]}
                  </span>
                  <form action={removeUserSkill}>
                    <input type="hidden" name="userSkillId" value={userSkill.id} />
                    <button
                      type="submit"
                      aria-label="Kaldır"
                      className="text-neutral-400 hover:text-red-600"
                    >
                      ×
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          ) : (
            <Empty />
          )}
          <AddSkillForm
            action={addLearnSkill}
            skills={allSkills.filter((s) => !learnSkillIds.has(s.id))}
          />
        </div>
      </Section>

      <Section title="İlgi alanları & lifestyle">
        {lifestyle?.interests.length || lifestyle?.hobbies.length ? (
          <div className="flex flex-col gap-2">
            {lifestyle.interests.length > 0 && (
              <div>
                <p className="text-xs text-neutral-500">İlgi alanları</p>
                <ul className="mt-1 flex flex-wrap gap-2">
                  {lifestyle.interests.map((interest) => (
                    <Chip key={interest}>{interest}</Chip>
                  ))}
                </ul>
              </div>
            )}
            {lifestyle.hobbies.length > 0 && (
              <div>
                <p className="text-xs text-neutral-500">Hobiler</p>
                <ul className="mt-1 flex flex-wrap gap-2">
                  {lifestyle.hobbies.map((hobby) => (
                    <Chip key={hobby}>{hobby}</Chip>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <Empty />
        )}
        {lifestyle &&
          (lifestyle.socialEnergy ||
            lifestyle.planningStyle ||
            lifestyle.pace ||
            lifestyle.matchModePreference) && (
            <p className="mt-3 text-sm text-neutral-600">
              {[
                lifestyle.socialEnergy &&
                  `Sosyal enerji: ${SOCIAL_ENERGY_LABELS[lifestyle.socialEnergy]}`,
                lifestyle.planningStyle &&
                  `Planlama: ${PLANNING_STYLE_LABELS[lifestyle.planningStyle]}`,
                lifestyle.pace && `Tempo: ${PACE_LABELS[lifestyle.pace]}`,
                lifestyle.matchModePreference &&
                  MATCH_MODE_PREFERENCE_LABELS[lifestyle.matchModePreference],
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
          )}
        {lifestyle?.careerGoals && (
          <p className="mt-2 text-sm text-neutral-600">
            Kariyer/okul hedefi: {lifestyle.careerGoals}
          </p>
        )}
      </Section>

      <Section title="Okul & Bölüm">
        {education ? (
          <div className="flex flex-col gap-2">
            <p>
              {education.school.name} —{" "}
              {education.department?.name ?? "Bölüm belirtilmemiş"}
            </p>
            <div className="flex flex-wrap gap-2">
              {education.yearStatus && (
                <Chip>{YEAR_STATUS_LABELS[education.yearStatus]}</Chip>
              )}
              <Chip>
                {education.yearStatus === YearStatus.GRADUATE
                  ? "Alumni"
                  : "Öğrenci"}
              </Chip>
            </div>
          </div>
        ) : (
          <Empty />
        )}
      </Section>

      <Section title="Müsaitlik & eşleşme tercihleri">
        {availabilitySlots.length > 0 ? (
          <ul className="flex flex-wrap gap-2">
            {availabilitySlots.map((slot) => (
              <Chip key={slot}>{slot}</Chip>
            ))}
          </ul>
        ) : (
          <Empty text="Müsaitlik belirtilmemiş." />
        )}
        {lifestyle && (lifestyle.meetingPreference || lifestyle.budgetLevel) && (
          <p className="mt-3 text-sm text-neutral-600">
            {[
              lifestyle.meetingPreference &&
                `Buluşma: ${MEETING_PREFERENCE_LABELS[lifestyle.meetingPreference]}`,
              lifestyle.budgetLevel &&
                `Bütçe: ${BUDGET_LEVEL_LABELS[lifestyle.budgetLevel]}`,
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
        )}
      </Section>
    </main>
  );
}

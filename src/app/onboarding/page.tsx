import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { logout } from "@/lib/auth-actions";
import { OnboardingForm } from "./onboarding-form";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/giris");
  }

  const [dbUser, schools] = await Promise.all([
    prisma.user.findUnique({
      where: { id: user.id },
      include: {
        lifestyleProfile: true,
        educations: true,
      },
    }),
    prisma.school.findMany({
      orderBy: { name: "asc" },
      include: { departments: { orderBy: { name: "asc" } } },
    }),
  ]);

  const existingEducation = dbUser?.educations[0];
  const lifestyle = dbUser?.lifestyleProfile;
  const availability = lifestyle?.availability;
  const defaultAvailabilitySlots =
    availability && typeof availability === "object" && "slots" in availability
      ? ((availability as { slots: string[] }).slots ?? [])
      : [];

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-16">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <span className="text-sm font-medium text-violet-600">
            Bölüm 3 · MVP
          </span>
          <h1 className="text-3xl font-semibold tracking-tight">
            Profilini Tamamla
          </h1>
          <p className="text-neutral-600">
            Temel bilgilerin, lifestyle tercihlerin ve okul/bölümün — birkaç
            adımlık kısa bir form.
          </p>
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

      <OnboardingForm
        schools={schools}
        defaultCity={dbUser?.city ?? ""}
        defaultCountry={dbUser?.country ?? ""}
        defaultAgeRange={dbUser?.ageRange ?? ""}
        defaultGender={dbUser?.gender ?? ""}
        defaultLanguages={dbUser?.languages.join(", ") ?? ""}
        defaultInterests={lifestyle?.interests.join(", ") ?? ""}
        defaultSocialEnergy={lifestyle?.socialEnergy ?? ""}
        defaultMeetingPreference={lifestyle?.meetingPreference ?? ""}
        defaultAvailabilitySlots={defaultAvailabilitySlots}
        defaultMatchModePreference={lifestyle?.matchModePreference ?? ""}
        defaultCareerGoals={lifestyle?.careerGoals ?? ""}
        defaultDepartmentId={existingEducation?.departmentId ?? ""}
        defaultYearStatus={existingEducation?.yearStatus ?? ""}
      />
    </main>
  );
}

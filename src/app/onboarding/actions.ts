"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import {
  Gender,
  MatchModePreference,
  MeetingPreference,
  SocialEnergy,
  YearStatus,
} from "@/generated/prisma/client";

export type OnboardingState = {
  error: string | null;
};

function parseCommaList(value: FormDataEntryValue | null) {
  return (value?.toString().trim() ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseEnum<T extends string>(
  value: FormDataEntryValue | null,
  allowed: readonly T[],
): T | null {
  const raw = value?.toString();
  return raw && (allowed as readonly string[]).includes(raw) ? (raw as T) : null;
}

export async function submitOnboarding(
  _prevState: OnboardingState,
  formData: FormData,
): Promise<OnboardingState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/giris");
  }

  const city = formData.get("city")?.toString().trim();
  const country = formData.get("country")?.toString().trim() || null;
  const ageRange = formData.get("ageRange")?.toString().trim() || null;
  const languages = parseCommaList(formData.get("languages"));
  const interests = parseCommaList(formData.get("interests"));
  const careerGoals = formData.get("careerGoals")?.toString().trim() || null;

  const gender = parseEnum(formData.get("gender"), Object.values(Gender));
  const socialEnergy = parseEnum(
    formData.get("socialEnergy"),
    Object.values(SocialEnergy),
  );
  const meetingPreference = parseEnum(
    formData.get("meetingPreference"),
    Object.values(MeetingPreference),
  );
  const matchModePreference = parseEnum(
    formData.get("matchModePreference"),
    Object.values(MatchModePreference),
  );

  const availabilitySlots = formData
    .getAll("availabilitySlots")
    .map((v) => v.toString());

  const departmentId = formData.get("departmentId")?.toString();
  const yearStatus = parseEnum(formData.get("yearStatus"), Object.values(YearStatus));

  if (!city) {
    return { error: "Şehir gerekli." };
  }

  if (!departmentId) {
    return { error: "Bölüm seçmelisin." };
  }

  const department = await prisma.department.findUnique({
    where: { id: departmentId },
  });

  if (!department) {
    return { error: "Geçersiz bölüm." };
  }

  try {
    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { city, country, ageRange, gender, languages },
      }),
      prisma.lifestyleProfile.upsert({
        where: { userId: user.id },
        update: {
          interests,
          socialEnergy,
          meetingPreference,
          matchModePreference,
          careerGoals,
          availability:
            availabilitySlots.length > 0
              ? { slots: availabilitySlots }
              : undefined,
        },
        create: {
          userId: user.id,
          interests,
          socialEnergy,
          meetingPreference,
          matchModePreference,
          careerGoals,
          availability:
            availabilitySlots.length > 0
              ? { slots: availabilitySlots }
              : undefined,
        },
      }),
      prisma.userEducation.upsert({
        where: {
          userId_schoolId_departmentId: {
            userId: user.id,
            schoolId: department.schoolId,
            departmentId: department.id,
          },
        },
        update: { yearStatus },
        create: {
          userId: user.id,
          schoolId: department.schoolId,
          departmentId: department.id,
          yearStatus,
        },
      }),
    ]);
  } catch (error) {
    console.error(error);
    return { error: "Kaydedilirken bir hata oluştu." };
  }

  redirect("/profil");
}

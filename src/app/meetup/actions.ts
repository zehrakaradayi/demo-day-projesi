"use server";

import { redirect } from "next/navigation";
import { requireCurrentUser } from "@/lib/matching-education/current-user";
import { generateMeetupPlan } from "@/lib/ai/meetupPlanner";
import {
  createMeetup,
  saveMeetupAlternatives,
  clearMeetupAlternatives,
  chooseMeetupAlternative,
  cancelMeetup,
  respondToMeetupInvite,
  getMeetupById,
  meetupToPlanInput,
} from "@/lib/matching-education/queries/meetup";

function getAsUserId(formData: FormData) {
  const raw = formData.get("asUserId");
  return typeof raw === "string" && raw ? raw : undefined;
}

function backTo(path: string, asUserId?: string) {
  redirect(asUserId ? `${path}?as=${asUserId}` : path);
}

export async function createMeetupAction(formData: FormData) {
  const asUserId = getAsUserId(formData);
  const user = await requireCurrentUser(asUserId);

  const city = String(formData.get("city") ?? "").trim();
  const peopleCount = Number(formData.get("peopleCount") ?? 0);
  if (!city) throw new Error("Şehir gerekli.");
  if (!Number.isFinite(peopleCount) || peopleCount < 1) throw new Error("Kişi sayısı geçersiz.");

  const budgetLevelRaw = formData.get("budgetLevel");
  const budgetLevel = budgetLevelRaw ? Number(budgetLevelRaw) : null;
  const dateRaw = formData.get("date")?.toString();
  const date = dateRaw ? new Date(dateRaw) : null;
  const timeRangeStart = formData.get("timeRangeStart")?.toString() || null;
  const timeRangeEnd = formData.get("timeRangeEnd")?.toString() || null;
  const vibe = formData.get("vibe")?.toString().trim() || null;
  const transportPreference = formData.get("transportPreference")?.toString().trim() || null;
  const foodOrActivityPreference = formData.get("foodOrActivityPreference")?.toString().trim() || null;
  const participantUserIds = formData.getAll("participantUserIds").map(String);

  const meetup = await createMeetup({
    createdById: user.id,
    city,
    peopleCount,
    budgetLevel,
    date,
    timeRangeStart,
    timeRangeEnd,
    vibe,
    transportPreference,
    foodOrActivityPreference,
    participantUserIds,
  });

  try {
    const plan = await generateMeetupPlan(
      meetupToPlanInput({
        city,
        peopleCount,
        budgetLevel,
        date,
        timeRangeStart,
        timeRangeEnd,
        vibe,
        transportPreference,
        foodOrActivityPreference,
      }),
    );
    await saveMeetupAlternatives(meetup.id, plan);
  } catch (error) {
    console.error("Meetup planı üretilemedi:", error);
  }

  backTo(`/meetup/${meetup.id}`, asUserId);
}

export async function regeneratePlanAction(formData: FormData) {
  const asUserId = getAsUserId(formData);
  await requireCurrentUser(asUserId);
  const meetupId = String(formData.get("meetupId"));

  const meetup = await getMeetupById(meetupId);
  if (!meetup) throw new Error("Meetup bulunamadı.");

  await clearMeetupAlternatives(meetupId);

  try {
    const plan = await generateMeetupPlan(meetupToPlanInput(meetup));
    await saveMeetupAlternatives(meetupId, plan);
  } catch (error) {
    console.error("Meetup planı üretilemedi:", error);
  }

  backTo(`/meetup/${meetupId}`, asUserId);
}

export async function chooseAlternativeAction(formData: FormData) {
  const asUserId = getAsUserId(formData);
  const user = await requireCurrentUser(asUserId);
  const meetupId = String(formData.get("meetupId"));
  const alternativeId = String(formData.get("alternativeId"));

  await chooseMeetupAlternative(meetupId, alternativeId, user.id);
  backTo(`/meetup/${meetupId}`, asUserId);
}

export async function cancelMeetupAction(formData: FormData) {
  const asUserId = getAsUserId(formData);
  const user = await requireCurrentUser(asUserId);
  const meetupId = String(formData.get("meetupId"));

  await cancelMeetup(meetupId, user.id);
  backTo(`/meetup/${meetupId}`, asUserId);
}

export async function respondInviteAction(formData: FormData) {
  const asUserId = getAsUserId(formData);
  const user = await requireCurrentUser(asUserId);
  const meetupId = String(formData.get("meetupId"));
  const status = String(formData.get("status")) as "ACCEPTED" | "DECLINED";

  await respondToMeetupInvite(meetupId, user.id, status);
  backTo(`/meetup/${meetupId}`, asUserId);
}

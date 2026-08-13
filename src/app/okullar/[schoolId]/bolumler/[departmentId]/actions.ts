"use server";

import { revalidatePath } from "next/cache";
import { requireCurrentUser } from "@/lib/matching-education/current-user";
import { upsertGuideProfile, requestGuideSession, completeGuideSession, rateGuideSession } from "@/lib/matching-education/queries/guides";
import { awardGuideSessionPoints } from "@/lib/matching-education/contribution";
import { parseEnum, requireString } from "@/lib/matching-education/form-utils";
import { GuideType } from "@/generated/prisma/client";

export async function upsertGuideProfileAction(formData: FormData) {
  const asUserId = formData.get("asUserId")?.toString();
  const user = await requireCurrentUser(asUserId);
  const schoolId = requireString(formData, "schoolId");
  const departmentId = requireString(formData, "departmentId");

  const topics = formData.getAll("topics").map((t) => t.toString()).filter(Boolean);
  const sessionDurations = formData
    .getAll("sessionDurations")
    .map((d) => Number(d.toString()))
    .filter((d) => Number.isFinite(d) && d > 0);
  const guideType = parseEnum(GuideType, formData.get("guideType")) ?? GuideType.STUDENT;

  if (topics.length === 0) throw new Error("En az bir rehberlik konusu seçmelisin.");
  if (sessionDurations.length === 0) throw new Error("En az bir session süresi seçmelisin.");

  await upsertGuideProfile({
    userId: user.id,
    topics,
    sessionDurations,
    guideType,
    isActive: true,
  });

  revalidatePath(`/okullar/${schoolId}/bolumler/${departmentId}`);
}

export async function requestGuideSessionAction(formData: FormData) {
  const asUserId = formData.get("asUserId")?.toString();
  const user = await requireCurrentUser(asUserId);
  const schoolId = requireString(formData, "schoolId");
  const departmentId = requireString(formData, "departmentId");
  const guideId = requireString(formData, "guideId");
  const topic = requireString(formData, "topic");
  const durationMinutes = Number(requireString(formData, "durationMinutes"));

  await requestGuideSession({ guideId, participantId: user.id, topic, durationMinutes });

  revalidatePath(`/okullar/${schoolId}/bolumler/${departmentId}`);
}

export async function completeGuideSessionAction(formData: FormData) {
  const asUserId = formData.get("asUserId")?.toString();
  const user = await requireCurrentUser(asUserId);
  const schoolId = requireString(formData, "schoolId");
  const departmentId = requireString(formData, "departmentId");
  const sessionId = requireString(formData, "sessionId");

  await completeGuideSession(sessionId, user.id);
  await awardGuideSessionPoints(sessionId);

  revalidatePath(`/okullar/${schoolId}/bolumler/${departmentId}`);
}

export async function rateGuideSessionAction(formData: FormData) {
  const asUserId = formData.get("asUserId")?.toString();
  const user = await requireCurrentUser(asUserId);
  const schoolId = requireString(formData, "schoolId");
  const departmentId = requireString(formData, "departmentId");
  const sessionId = requireString(formData, "sessionId");
  const rating = Number(requireString(formData, "rating"));
  const feedback = formData.get("feedback")?.toString();

  await rateGuideSession(sessionId, user.id, rating, feedback);

  revalidatePath(`/okullar/${schoolId}/bolumler/${departmentId}`);
}

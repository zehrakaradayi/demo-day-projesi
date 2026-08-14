"use server";

import { revalidatePath } from "next/cache";
import { requireCurrentUser } from "@/lib/matching-education/current-user";
import { assignMission, completeMission } from "@/lib/matching-education/queries/missions";
import { requireString } from "@/lib/matching-education/form-utils";

export async function assignMissionAction(formData: FormData) {
  const asUserId = formData.get("asUserId")?.toString();
  const user = await requireCurrentUser(asUserId);
  const missionId = requireString(formData, "missionId");
  await assignMission(user.id, missionId);
  revalidatePath("/pasaport");
}

export async function completeMissionAction(formData: FormData) {
  const asUserId = formData.get("asUserId")?.toString();
  const user = await requireCurrentUser(asUserId);
  const userMissionId = requireString(formData, "userMissionId");
  const evidence = formData.get("evidence")?.toString();
  await completeMission(userMissionId, user.id, evidence);
  revalidatePath("/pasaport");
}

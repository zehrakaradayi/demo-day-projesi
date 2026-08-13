"use server";

import { revalidatePath } from "next/cache";
import { requireCurrentUser } from "@/lib/matching-education/current-user";
import { setMatchStatus } from "@/lib/matching-education/match-engine";
import { requireString } from "@/lib/matching-education/form-utils";

export async function refreshMatchesAction(formData: FormData) {
  const asUserId = formData.get("asUserId")?.toString();
  await requireCurrentUser(asUserId);
  revalidatePath("/eslesme");
}

export async function likeMatchAction(formData: FormData) {
  const asUserId = formData.get("asUserId")?.toString();
  const user = await requireCurrentUser(asUserId);
  const otherUserId = requireString(formData, "otherUserId");
  await setMatchStatus(user.id, otherUserId, "LIKED");
  revalidatePath("/eslesme");
}

export async function passMatchAction(formData: FormData) {
  const asUserId = formData.get("asUserId")?.toString();
  const user = await requireCurrentUser(asUserId);
  const otherUserId = requireString(formData, "otherUserId");
  await setMatchStatus(user.id, otherUserId, "PASSED");
  revalidatePath("/eslesme");
}

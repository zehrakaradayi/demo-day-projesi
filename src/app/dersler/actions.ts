"use server";

import { revalidatePath } from "next/cache";
import { requireCurrentUser } from "@/lib/matching-education/current-user";
import {
  deleteUserCourseTopic,
  findOrCreateTopic,
  upsertUserCourseTopic,
} from "@/lib/matching-education/queries/courses";
import { parseEnum, requireString } from "@/lib/matching-education/form-utils";
import { SkillMode, SkillLevel } from "@/generated/prisma/client";

export async function upsertUserCourseTopicAction(formData: FormData) {
  const asUserId = formData.get("asUserId")?.toString();
  const user = await requireCurrentUser(asUserId);

  const existingTopicId = formData.get("topicId")?.toString().trim();
  const newTopicCourseId = formData.get("newTopicCourseId")?.toString().trim();
  const newTopicName = formData.get("newTopicName")?.toString().trim();
  const newTopicLevel = formData.get("newTopicLevel")?.toString().trim();

  let topicId = existingTopicId || undefined;
  if (!topicId && newTopicCourseId && newTopicName && newTopicLevel) {
    const topic = await findOrCreateTopic(newTopicCourseId, newTopicName, newTopicLevel);
    topicId = topic.id;
  }
  if (!topicId) {
    throw new Error("Bir konu seçmelisin ya da ders + yeni konu adı + seviye girmelisin.");
  }

  const mode = parseEnum(SkillMode, formData.get("mode"));
  const level = parseEnum(SkillLevel, formData.get("level"));
  if (!mode || !level) throw new Error("Yön ve seviye zorunlu.");

  await upsertUserCourseTopic({ userId: user.id, topicId, mode, level });

  revalidatePath("/dersler");
}

export async function deleteUserCourseTopicAction(formData: FormData) {
  const asUserId = formData.get("asUserId")?.toString();
  const user = await requireCurrentUser(asUserId);
  const id = requireString(formData, "id");
  await deleteUserCourseTopic(id, user.id);
  revalidatePath("/dersler");
}

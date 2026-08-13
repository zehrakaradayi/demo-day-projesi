"use server";

import { revalidatePath } from "next/cache";
import { requireCurrentUser } from "@/lib/matching-education/current-user";
import {
  deleteUserSkill,
  findOrCreateSkillByName,
  upsertUserSkill,
} from "@/lib/matching-education/queries/skills";
import { parseEnum, requireString } from "@/lib/matching-education/form-utils";
import {
  SkillMode,
  SkillLevel,
  TeachingStyle,
  LearningPurpose,
} from "@/generated/prisma/client";

export async function upsertUserSkillAction(formData: FormData) {
  const asUserId = formData.get("asUserId")?.toString();
  const user = await requireCurrentUser(asUserId);

  const existingSkillId = formData.get("skillId")?.toString().trim();
  const newSkillName = formData.get("newSkillName")?.toString().trim();
  const newSkillCategory = formData.get("newSkillCategory")?.toString().trim() || "Diğer";

  let skillId = existingSkillId || undefined;
  if (!skillId && newSkillName) {
    const skill = await findOrCreateSkillByName(newSkillName, newSkillCategory);
    skillId = skill.id;
  }
  if (!skillId) {
    throw new Error("Bir skill seçmelisin ya da yeni bir skill adı girmelisin.");
  }

  const mode = parseEnum(SkillMode, formData.get("mode"));
  const level = parseEnum(SkillLevel, formData.get("level"));
  if (!mode || !level) throw new Error("Mode ve seviye zorunlu.");

  const teachingStyle = parseEnum(TeachingStyle, formData.get("teachingStyle"));
  const learningPurpose = parseEnum(LearningPurpose, formData.get("learningPurpose"));
  const experienceYearsRaw = formData.get("experienceYears")?.toString();
  const experienceYears = experienceYearsRaw ? Number(experienceYearsRaw) : undefined;

  await upsertUserSkill({
    userId: user.id,
    skillId,
    mode,
    level,
    teachingStyle: teachingStyle ?? null,
    learningPurpose: learningPurpose ?? null,
    experienceYears: Number.isFinite(experienceYears) ? experienceYears! : null,
  });

  revalidatePath("/skills");
}

export async function deleteUserSkillAction(formData: FormData) {
  const asUserId = formData.get("asUserId")?.toString();
  const user = await requireCurrentUser(asUserId);
  const id = requireString(formData, "id");
  await deleteUserSkill(id, user.id);
  revalidatePath("/skills");
}

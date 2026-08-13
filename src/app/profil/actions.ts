"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { SkillLevel, SkillMode } from "@/generated/prisma/client";

export type AddSkillState = {
  error: string | null;
};

export async function addUserSkill(
  mode: SkillMode,
  _prevState: AddSkillState,
  formData: FormData,
): Promise<AddSkillState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Giriş yapmalısın." };
  }

  const skillId = formData.get("skillId")?.toString();
  const levelRaw = formData.get("level")?.toString();

  if (!skillId || !Object.values(SkillLevel).includes(levelRaw as SkillLevel)) {
    return { error: "Geçerli bir skill ve seviye seç." };
  }

  try {
    await prisma.userSkill.upsert({
      where: { userId_skillId_mode: { userId: user.id, skillId, mode } },
      update: { level: levelRaw as SkillLevel },
      create: {
        userId: user.id,
        skillId,
        mode,
        level: levelRaw as SkillLevel,
      },
    });
  } catch (error) {
    console.error(error);
    return { error: "Eklenirken bir hata oluştu." };
  }

  revalidatePath("/profil");
  return { error: null };
}

export async function addTeachSkill(prevState: AddSkillState, formData: FormData) {
  return addUserSkill(SkillMode.TEACH, prevState, formData);
}

export async function addLearnSkill(prevState: AddSkillState, formData: FormData) {
  return addUserSkill(SkillMode.LEARN, prevState, formData);
}

export async function removeUserSkill(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  const userSkillId = formData.get("userSkillId")?.toString();
  if (!userSkillId) return;

  await prisma.userSkill.deleteMany({
    where: { id: userSkillId, userId: user.id },
  });

  revalidatePath("/profil");
}

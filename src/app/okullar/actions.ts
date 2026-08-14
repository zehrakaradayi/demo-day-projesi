"use server";

import { revalidatePath } from "next/cache";
import { requireCurrentUser } from "@/lib/matching-education/current-user";
import { upsertUserEducation } from "@/lib/matching-education/queries/schools";
import { parseEnum, requireString } from "@/lib/matching-education/form-utils";
import { YearStatus } from "@/generated/prisma/client";

export async function setMyEducationAction(formData: FormData) {
  const asUserId = formData.get("asUserId")?.toString();
  const user = await requireCurrentUser(asUserId);

  const schoolId = requireString(formData, "schoolId");
  const departmentId = formData.get("departmentId")?.toString().trim() || undefined;
  const yearStatus = parseEnum(YearStatus, formData.get("yearStatus"));

  await upsertUserEducation({ userId: user.id, schoolId, departmentId, yearStatus });

  revalidatePath("/okullar");
  revalidatePath(`/okullar/${schoolId}`);
  if (departmentId) revalidatePath(`/okullar/${schoolId}/bolumler/${departmentId}`);
}

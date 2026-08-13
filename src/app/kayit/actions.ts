"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { prisma } from "@/lib/prisma";

export type SignupState = {
  error: string | null;
};

// DEMO MODU: Supabase e-posta kotası dolduğu için kayıt akışı, doğrulama
// e-postası göndermek yerine admin API ile kullanıcıyı doğrudan
// email_confirm: true olarak oluşturuyor. Kota sorunu çözülünce (veya özel
// SMTP eklenince) bu fonksiyon supabase.auth.signUp() çağrısına geri
// döndürülmeli.
export async function signup(
  _prevState: SignupState,
  formData: FormData,
): Promise<SignupState> {
  const name = formData.get("name")?.toString().trim();
  const email = formData.get("email")?.toString().trim();
  const password = formData.get("password")?.toString();

  if (!name || !email || !password) {
    return { error: "Ad, e-posta ve şifre gerekli." };
  }

  const admin = createAdminClient();
  const { data: created, error: createError } =
    await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

  if (createError) {
    return { error: createError.message };
  }

  const userId = created.user?.id;
  if (!userId) {
    return { error: "Kayıt oluşturulamadı." };
  }

  try {
    await prisma.user.create({
      data: { id: userId, email, name },
    });
  } catch {
    await admin.auth.admin.deleteUser(userId);
    return { error: "Kullanıcı profili oluşturulamadı." };
  }

  const supabase = await createClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError) {
    return { error: signInError.message };
  }

  redirect("/onboarding");
}

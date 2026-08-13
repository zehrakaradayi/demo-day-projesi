"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export type SignupState = {
  error: string | null;
};

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

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error) {
    return { error: error.message };
  }

  const userId = data.user?.id;
  if (!userId) {
    return { error: "Kayıt oluşturulamadı." };
  }

  try {
    await prisma.user.create({
      data: { id: userId, email, name },
    });
  } catch {
    return { error: "Kullanıcı profili oluşturulamadı." };
  }

  if (!data.session) {
    return {
      error:
        "Hesap oluşturuldu ama oturum açılamadı — e-posta doğrulaması gerekiyor olabilir. Giriş yapmayı dene.",
    };
  }

  redirect("/onboarding");
}

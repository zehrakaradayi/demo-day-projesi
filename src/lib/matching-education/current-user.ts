import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import type { User } from "@/generated/prisma/client";

const isDev = process.env.NODE_ENV !== "production";

/**
 * GEÇİCİ (student2/feature/matching-education kapsamı):
 * Auth branch (giriş/kayıt/onboarding) henüz gerçek bir Supabase session üretmiyor.
 * Bu dosya, matching/education sayfalarını auth'u yeniden yazmadan test edilebilir kılmak
 * için izole bir "kimlik çözümleme" katmanı sağlar:
 *  - Gerçek bir Supabase session varsa her zaman onu kullanır.
 *  - Session yoksa, YALNIZCA development'ta, seed'lenmiş demo kullanıcılardan birine düşer
 *    (`?as=<userId>` ile seçilebilir). Production'da bu fallback devre dışıdır.
 * Auth branch tamamlandığında bu dosyadaki dev-fallback bloğu kaldırılıp yalnızca gerçek
 * session'a bağlı hale getirilmeli — Supabase/auth kodunun kendisine dokunulmuyor.
 */
export async function getCurrentUser(demoUserId?: string): Promise<User | null> {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (authUser) {
    return prisma.user.findUnique({ where: { id: authUser.id } });
  }

  if (!isDev) return null;

  if (demoUserId) {
    const requested = await prisma.user.findUnique({ where: { id: demoUserId } });
    if (requested) return requested;
  }

  return prisma.user.findFirst({
    where: { email: { startsWith: "demo." } },
    orderBy: { createdAt: "asc" },
  });
}

export async function requireCurrentUser(demoUserId?: string): Promise<User> {
  const user = await getCurrentUser(demoUserId);
  if (!user) {
    redirect("/giris");
  }
  return user;
}

export async function listDemoUsers() {
  if (!isDev) return [];
  return prisma.user.findMany({
    where: { email: { startsWith: "demo." } },
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, city: true, network: true },
  });
}

export function extractAsParam(searchParams: Record<string, string | string[] | undefined>): string | undefined {
  const raw = searchParams.as;
  return typeof raw === "string" ? raw : undefined;
}

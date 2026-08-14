import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

// Auth/kayıt akışı (Branch 1) henüz Prisma User satırını oluşturmuyor —
// bu yüzden burada upsert ile geçici bir köprü kuruyoruz: giriş yapmış her
// kullanıcı için minimal bir User satırı garanti edilir. Branch 1 gerçek
// kayıt/onboarding akışını (Lifestyle Interview dahil) kurduğunda bu upsert
// kendiliğinden no-op'a döner (satır zaten var).
export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) return null;

  const metadataName =
    typeof authUser.user_metadata?.name === "string"
      ? authUser.user_metadata.name
      : undefined;

  return prisma.user.upsert({
    where: { id: authUser.id },
    update: {},
    create: {
      id: authUser.id,
      email: authUser.email ?? `${authUser.id}@skillswap.local`,
      name: metadataName ?? authUser.email?.split("@")[0] ?? "Kullanıcı",
    },
  });
}

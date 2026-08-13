import { createClient } from "@/lib/supabase/server";
import { logout } from "@/lib/auth-actions";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center gap-3 px-6 py-16">
      <span className="text-sm font-medium text-violet-600">
        Bölüm 3 · MVP
      </span>
      <h1 className="text-3xl font-semibold tracking-tight">
        Lifestyle Interview
      </h1>
      <p className="text-neutral-600">
        Kart tabanlı onboarding: yaş, şehir, teach/learn skills, hobiler,
        sosyal enerji, planlı/spontan, bütçe, güvenlik sınırları, kariyer
        hedefleri.
      </p>
      <p className="mt-4 rounded-lg border border-dashed border-neutral-300 px-4 py-3 text-sm text-neutral-500">
        TODO — bu ekran henüz kurulmadı.
      </p>

      {user && (
        <div className="mt-6 flex items-center gap-3 border-t border-neutral-200 pt-4 text-sm">
          <span className="text-neutral-500">Giriş yapan: {user.email}</span>
          <form action={logout}>
            <button
              type="submit"
              className="font-medium text-violet-600 hover:underline"
            >
              Çıkış yap
            </button>
          </form>
        </div>
      )}
    </main>
  );
}

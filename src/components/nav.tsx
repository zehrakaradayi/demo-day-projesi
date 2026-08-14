import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

const AREAS = [
  { href: "/kesfet", label: "Keşfet" },
  { href: "/skills", label: "Skill Exchange" },
  { href: "/dersler", label: "Dersler" },
  { href: "/schools", label: "Okul & Bölüm" },
  { href: "/eslesme", label: "Eşleşme" },
  { href: "/pasaport", label: "Skill Pasaport" },
  { href: "/sohbet", label: "Sohbet" },
  { href: "/meetup", label: "Meetup" },
];

export async function Nav() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="border-b border-neutral-200">
      <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-6 py-3">
        <Link href="/" className="text-sm font-semibold tracking-tight text-violet-600">
          SkillSwap
        </Link>
        <nav className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-neutral-500">
          {AREAS.map((area) => (
            <Link key={area.href} href={area.href} className="hover:text-violet-600">
              {area.label}
            </Link>
          ))}
        </nav>
        <div className="text-sm">
          {user ? (
            <Link href="/profil" className="font-medium text-violet-600 hover:underline">
              Profil
            </Link>
          ) : (
            <div className="flex gap-3">
              <Link href="/giris" className="font-medium text-violet-600 hover:underline">
                Giriş yap
              </Link>
              <Link href="/kayit" className="font-medium text-violet-600 hover:underline">
                Kayıt ol
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

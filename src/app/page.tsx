import Link from "next/link";

const AREAS = [
  { href: "/kesfet", label: "Keşfet" },
  { href: "/skills", label: "Skill Exchange" },
  { href: "/dersler", label: "Dersler" },
  { href: "/schools", label: "Okul & Bölüm" },
  { href: "/eslesme", label: "Eşleşme" },
  { href: "/sohbet", label: "Sohbet" },
  { href: "/meetup", label: "Meetup" },
  { href: "/profil", label: "Profil" },
];

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center gap-8 px-6 py-16">
      <div className="space-y-3">
        <h1 className="text-4xl font-semibold tracking-tight">SkillSwap</h1>
        <p className="text-lg text-neutral-600">
          Bildiğini paylaş. Yeni bir şey öğren. Doğru insanlarla tanış.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {AREAS.map((area) => (
          <Link
            key={area.href}
            href={area.href}
            className="rounded-full border border-neutral-300 px-4 py-2 text-sm font-medium transition-colors hover:border-violet-500 hover:text-violet-600"
          >
            {area.label}
          </Link>
        ))}
      </div>
      <div className="flex gap-3 text-sm">
        <Link href="/giris" className="font-medium text-violet-600">
          Giriş yap
        </Link>
        <span className="text-neutral-300">·</span>
        <Link href="/kayit" className="font-medium text-violet-600">
          Kayıt ol
        </Link>
      </div>
    </main>
  );
}

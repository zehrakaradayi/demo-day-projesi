import Link from "next/link";
import { listDemoUsers } from "@/lib/matching-education/current-user";

/**
 * GEÇİCİ (bkz. current-user.ts): gerçek auth gelene kadar development'ta hangi demo
 * kullanıcı olarak görüntülediğini değiştirmeye yarayan basit bir şerit.
 */
export async function DevUserSwitcher({ activeUserId }: { activeUserId: string }) {
  if (process.env.NODE_ENV === "production") return null;

  const demoUsers = await listDemoUsers();
  if (demoUsers.length === 0) return null;

  return (
    <div className="mb-6 flex flex-wrap items-center gap-2 rounded-lg border border-dashed border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800">
      <span className="font-medium">Dev: kullanıcı olarak görüntüle</span>
      {demoUsers.map((demoUser) => (
        <Link
          key={demoUser.id}
          href={`?as=${demoUser.id}`}
          className={`rounded-full border px-2.5 py-1 transition-colors ${
            demoUser.id === activeUserId
              ? "border-amber-500 bg-amber-200 font-medium"
              : "border-amber-300 bg-white hover:border-amber-500"
          }`}
        >
          {demoUser.name}
        </Link>
      ))}
    </div>
  );
}

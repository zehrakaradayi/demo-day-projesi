import { redirect } from "next/navigation";
import { ConversationList } from "@/features/chat/components/ConversationList";
import { NewConversationList } from "@/features/chat/components/NewConversationList";
import { getConversations, getOtherUsers } from "@/features/chat/queries";
import { getCurrentUser } from "@/lib/auth/get-current-user";

export default async function SohbetPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/giris");

  const [conversations, otherUsers] = await Promise.all([
    getConversations(user.id),
    getOtherUsers(user.id),
  ]);

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-6 py-10">
      <h1 className="text-2xl font-semibold">Sohbetler</h1>

      <div className="mt-6 overflow-hidden rounded-2xl border border-neutral-200">
        <ConversationList conversations={conversations} />
      </div>

      {otherUsers.length > 0 && (
        <div className="mt-8">
          <h2 className="text-sm font-medium text-neutral-500">
            Yeni sohbet başlat
          </h2>
          <p className="mt-1 text-xs text-neutral-400">
            Match Engine henüz hazır olmadığı için, şimdilik doğrudan bir kullanıcı seçebilirsin.
          </p>
          <NewConversationList users={otherUsers} />
        </div>
      )}
    </main>
  );
}

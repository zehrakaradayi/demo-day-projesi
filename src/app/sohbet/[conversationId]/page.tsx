import { redirect } from "next/navigation";
import { MessageThread } from "@/features/chat/components/MessageThread";
import { getConversationWithMessages } from "@/features/chat/queries";
import { ChatSafetyMenu } from "@/features/safety/components/ChatSafetyMenu";
import { getCurrentUser } from "@/lib/auth/get-current-user";

export default async function SohbetThreadPage({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  const { conversationId } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/giris");

  const conversation = await getConversationWithMessages(conversationId, user.id);
  const other = conversation.participants.find((p) => p.id !== user.id);

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3">
        <h1 className="font-semibold">{other?.name ?? "Sohbet"}</h1>
        {other && <ChatSafetyMenu targetUserId={other.id} targetUserName={other.name} />}
      </div>
      <MessageThread
        conversationId={conversation.id}
        currentUserId={user.id}
        initialMessages={conversation.messages}
        otherParticipantName={other?.name ?? "Kullanıcı"}
      />
    </main>
  );
}

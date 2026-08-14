import type { ConversationListItemDTO } from "../queries";

export function ConversationListItem({
  conversation,
}: {
  conversation: ConversationListItemDTO;
}) {
  const name = conversation.otherParticipant?.name ?? "Bilinmeyen kullanıcı";

  return (
    <div className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-neutral-50">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-100 text-sm font-medium text-violet-700">
        {name.slice(0, 1).toUpperCase()}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate font-medium">{name}</span>
          {conversation.hasUnread && (
            <span className="h-2 w-2 shrink-0 rounded-full bg-violet-600" />
          )}
        </div>
        <p className="truncate text-sm text-neutral-500">
          {conversation.lastMessage?.content ?? "Henüz mesaj yok"}
        </p>
      </div>
    </div>
  );
}

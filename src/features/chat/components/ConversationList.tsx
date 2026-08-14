import Link from "next/link";
import type { ConversationListItemDTO } from "../queries";
import { ConversationListItem } from "./ConversationListItem";

export function ConversationList({
  conversations,
}: {
  conversations: ConversationListItemDTO[];
}) {
  if (conversations.length === 0) {
    return (
      <p className="px-4 py-6 text-sm text-neutral-500">
        Henüz bir sohbetin yok. Yeni bir sohbet başlatarak dene.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-neutral-200">
      {conversations.map((conversation) => (
        <li key={conversation.id}>
          <Link href={`/sohbet/${conversation.id}`}>
            <ConversationListItem conversation={conversation} />
          </Link>
        </li>
      ))}
    </ul>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { startConversationWith } from "../actions";

type Props = {
  users: { id: string; name: string }[];
};

export function NewConversationList({ users }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleStart(userId: string) {
    startTransition(async () => {
      const { conversationId } = await startConversationWith(userId);
      router.push(`/sohbet/${conversationId}`);
    });
  }

  return (
    <ul className="mt-2 flex flex-wrap gap-2">
      {users.map((user) => (
        <li key={user.id}>
          <button
            onClick={() => handleStart(user.id)}
            disabled={isPending}
            className="rounded-full border border-neutral-300 px-3 py-1.5 text-sm transition-colors hover:border-violet-500 disabled:opacity-50"
          >
            {user.name}
          </button>
        </li>
      ))}
    </ul>
  );
}

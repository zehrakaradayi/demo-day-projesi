"use client";

import type { RealtimeChannel } from "@supabase/supabase-js";
import { useEffect, useRef, useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  conversationChannel,
  type MessageBroadcastPayload,
  type MessageDTO,
  type TypingBroadcastPayload,
} from "@/lib/supabase/realtime";
import { approveAndSendStarter, markConversationRead, sendMessage } from "../actions";
import { ConversationStarterCard } from "./ConversationStarterCard";
import { MessageComposer } from "./MessageComposer";
import { TypingIndicator } from "./TypingIndicator";

type Props = {
  conversationId: string;
  currentUserId: string;
  initialMessages: MessageDTO[];
  otherParticipantName: string;
};

export function MessageThread({
  conversationId,
  currentUserId,
  initialMessages,
  otherParticipantName,
}: Props) {
  const [messages, setMessages] = useState<MessageDTO[]>(initialMessages);
  const [typingUserName, setTypingUserName] = useState<string | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const typingClearRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const supabase = createClient();
    const channel = conversationChannel(supabase, conversationId);

    channel
      .on("broadcast", { event: "message" }, ({ payload }) => {
        const { message } = payload as MessageBroadcastPayload;
        appendMessage(message);
      })
      .on("broadcast", { event: "typing" }, ({ payload }) => {
        const typing = payload as TypingBroadcastPayload;
        if (typing.userId === currentUserId) return;
        if (typingClearRef.current) clearTimeout(typingClearRef.current);
        if (typing.isTyping) {
          setTypingUserName(otherParticipantName);
          typingClearRef.current = setTimeout(() => setTypingUserName(null), 3000);
        } else {
          setTypingUserName(null);
        }
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
      if (typingClearRef.current) clearTimeout(typingClearRef.current);
    };
  }, [conversationId, currentUserId, otherParticipantName]);

  useEffect(() => {
    markConversationRead(conversationId).catch(() => {});
  }, [conversationId, messages.length]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  function appendMessage(message: MessageDTO) {
    setMessages((prev) => (prev.some((m) => m.id === message.id) ? prev : [...prev, message]));
  }

  function handleTypingChange(isTyping: boolean) {
    channelRef.current?.send({
      type: "broadcast",
      event: "typing",
      payload: { userId: currentUserId, isTyping } satisfies TypingBroadcastPayload,
    });
  }

  function handleSend(content: string) {
    startTransition(async () => {
      const message = await sendMessage(conversationId, content);
      appendMessage(message);
    });
  }

  function handleApproveStarter(content: string) {
    startTransition(async () => {
      const message = await approveAndSendStarter(conversationId, content);
      appendMessage(message);
    });
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.length === 0 && (
          <ConversationStarterCard conversationId={conversationId} onSend={handleApproveStarter} />
        )}
        {messages.map((message) => (
          <div
            key={message.id}
            className={message.senderId === currentUserId ? "flex justify-end" : "flex justify-start"}
          >
            <div
              className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
                message.senderId === currentUserId
                  ? "bg-violet-600 text-white"
                  : "bg-neutral-100 text-neutral-900"
              }`}
            >
              {message.content}
            </div>
          </div>
        ))}
        <TypingIndicator typingUserName={typingUserName} />
        <div ref={bottomRef} />
      </div>
      <MessageComposer onSend={handleSend} onTypingChange={handleTypingChange} disabled={isPending} />
    </div>
  );
}

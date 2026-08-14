import type { SupabaseClient } from "@supabase/supabase-js";

export type MessageDTO = {
  id: string;
  conversationId: string;
  senderId: string;
  type: "TEXT" | "VOICE";
  content: string;
  createdAt: string;
};

export type MessageBroadcastPayload = {
  message: MessageDTO;
};

export type TypingBroadcastPayload = {
  userId: string;
  isTyping: boolean;
};

// Postgres Changes yerine Broadcast: RLS/publication kurulumu gerektirmez.
// Kanal adı (conversation:{uuid}) tek erişim kontrolü — post-demo hardening
// için Realtime Authorization + RLS eklenmesi önerilir.
export function conversationChannel(supabase: SupabaseClient, conversationId: string) {
  return supabase.channel(`conversation:${conversationId}`);
}

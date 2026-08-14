"use server";

import { getCurrentUser } from "@/lib/auth/get-current-user";
import { generateConversationStarter } from "@/lib/ai/conversationStarter";
import type { ConversationStarter } from "@/lib/ai/schemas";
import { prisma } from "@/lib/prisma";
import { conversationChannel, type MessageDTO } from "@/lib/supabase/realtime";
import { createClient } from "@/lib/supabase/server";
import { assertParticipant } from "./queries";

async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Giriş yapmalısınız.");
  return user;
}

export async function startConversationWith(
  otherUserId: string,
): Promise<{ conversationId: string }> {
  const user = await requireUser();
  if (user.id === otherUserId) {
    throw new Error("Kendinizle sohbet başlatamazsınız.");
  }

  const candidates = await prisma.conversation.findMany({
    where: {
      communityId: null,
      AND: [
        { participants: { some: { userId: user.id } } },
        { participants: { some: { userId: otherUserId } } },
      ],
    },
    include: { participants: true },
  });
  const existing = candidates.find((c) => c.participants.length === 2);
  if (existing) {
    return { conversationId: existing.id };
  }

  const conversation = await prisma.conversation.create({
    data: {
      participants: {
        create: [{ userId: user.id }, { userId: otherUserId }],
      },
    },
  });

  return { conversationId: conversation.id };
}

export async function sendMessage(
  conversationId: string,
  content: string,
): Promise<MessageDTO> {
  const user = await requireUser();
  await assertParticipant(conversationId, user.id);

  const trimmed = content.trim();
  if (!trimmed) {
    throw new Error("Boş mesaj gönderilemez.");
  }

  const message = await prisma.message.create({
    data: { conversationId, senderId: user.id, content: trimmed },
  });

  const dto: MessageDTO = {
    id: message.id,
    conversationId: message.conversationId,
    senderId: message.senderId,
    type: message.type,
    content: message.content,
    createdAt: message.createdAt.toISOString(),
  };

  const supabase = await createClient();
  await conversationChannel(supabase, conversationId).send({
    type: "broadcast",
    event: "message",
    payload: { message: dto },
  });

  return dto;
}

export async function markConversationRead(conversationId: string): Promise<void> {
  const user = await requireUser();
  await prisma.conversationParticipant.update({
    where: { conversationId_userId: { conversationId, userId: user.id } },
    data: { lastReadAt: new Date() },
  });
}

export async function getConversationStarterSuggestion(
  conversationId: string,
): Promise<ConversationStarter> {
  const user = await requireUser();
  const conversation = await prisma.conversation.findUniqueOrThrow({
    where: { id: conversationId },
    include: { participants: true },
  });
  const other = conversation.participants.find((p) => p.userId !== user.id);
  if (!other) {
    throw new Error("Karşı taraf bulunamadı.");
  }
  return generateConversationStarter(user.id, other.userId);
}

// AI önerisi kullanıcı onayı olmadan asla gönderilmez — bu action sadece
// kullanıcı "Gönder" dediğinde çağrılır.
export async function approveAndSendStarter(
  conversationId: string,
  message: string,
): Promise<MessageDTO> {
  return sendMessage(conversationId, message);
}

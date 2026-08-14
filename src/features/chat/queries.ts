import { prisma } from "@/lib/prisma";
import type { MessageDTO } from "@/lib/supabase/realtime";

export type ConversationListItemDTO = {
  id: string;
  otherParticipant: { id: string; name: string; avatarUrl: string | null } | null;
  lastMessage: { content: string; createdAt: string; senderId: string } | null;
  hasUnread: boolean;
};

export type ConversationThreadDTO = {
  id: string;
  participants: { id: string; name: string; avatarUrl: string | null }[];
  messages: MessageDTO[];
};

export async function assertParticipant(conversationId: string, userId: string) {
  const participant = await prisma.conversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId, userId } },
  });
  if (!participant) {
    throw new Error("Bu sohbete erişim yetkiniz yok.");
  }
  return participant;
}

export async function getConversations(userId: string): Promise<ConversationListItemDTO[]> {
  const participations = await prisma.conversationParticipant.findMany({
    where: { userId },
    include: {
      conversation: {
        include: {
          participants: { include: { user: true } },
          messages: { orderBy: { createdAt: "desc" }, take: 1 },
        },
      },
    },
    // Not: en son mesaj zamanına göre değil, sohbetin oluşturulma zamanına göre
    // sıralanıyor — MVP için yeterli basitleştirme.
    orderBy: { conversation: { createdAt: "desc" } },
  });

  return participations.map((participation) => {
    const otherParticipant =
      participation.conversation.participants.find((p) => p.userId !== userId)?.user ?? null;
    const lastMessage = participation.conversation.messages[0] ?? null;
    const hasUnread = Boolean(
      lastMessage &&
        lastMessage.senderId !== userId &&
        (!participation.lastReadAt || lastMessage.createdAt > participation.lastReadAt),
    );

    return {
      id: participation.conversation.id,
      otherParticipant: otherParticipant
        ? {
            id: otherParticipant.id,
            name: otherParticipant.name,
            avatarUrl: otherParticipant.avatarUrl,
          }
        : null,
      lastMessage: lastMessage
        ? {
            content: lastMessage.content,
            createdAt: lastMessage.createdAt.toISOString(),
            senderId: lastMessage.senderId,
          }
        : null,
      hasUnread,
    };
  });
}

// Match Engine (Branch 2) henüz yok — sohbet başlatmak için geçici bir kullanıcı
// listesi. Match Engine geldiğinde bu, eşleşme tabanlı bir öneri listesiyle
// değiştirilecek (bkz. src/lib/matching ileride).
export async function getOtherUsers(
  currentUserId: string,
): Promise<{ id: string; name: string }[]> {
  return prisma.user.findMany({
    where: { id: { not: currentUserId } },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}

export async function getConversationWithMessages(
  conversationId: string,
  userId: string,
): Promise<ConversationThreadDTO> {
  await assertParticipant(conversationId, userId);

  const conversation = await prisma.conversation.findUniqueOrThrow({
    where: { id: conversationId },
    include: {
      participants: { include: { user: true } },
      messages: { orderBy: { createdAt: "asc" } },
    },
  });

  return {
    id: conversation.id,
    participants: conversation.participants.map((p) => ({
      id: p.user.id,
      name: p.user.name,
      avatarUrl: p.user.avatarUrl,
    })),
    messages: conversation.messages.map((m) => ({
      id: m.id,
      conversationId: m.conversationId,
      senderId: m.senderId,
      type: m.type,
      content: m.content,
      createdAt: m.createdAt.toISOString(),
    })),
  };
}

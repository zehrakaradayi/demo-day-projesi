"use server";

import { getCurrentUser } from "@/lib/auth/get-current-user";
import { prisma } from "@/lib/prisma";

async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Giriş yapmalısınız.");
  return user;
}

export async function blockUser(blockedId: string): Promise<void> {
  const user = await requireUser();
  if (user.id === blockedId) {
    throw new Error("Kendinizi engelleyemezsiniz.");
  }
  await prisma.block.upsert({
    where: { blockerId_blockedId: { blockerId: user.id, blockedId } },
    update: {},
    create: { blockerId: user.id, blockedId },
  });
}

export async function unblockUser(blockedId: string): Promise<void> {
  const user = await requireUser();
  await prisma.block.deleteMany({
    where: { blockerId: user.id, blockedId },
  });
}

export async function reportUser(
  reportedId: string,
  reason: string,
  details?: string,
): Promise<void> {
  const user = await requireUser();
  await prisma.report.create({
    data: {
      reporterId: user.id,
      reportedId,
      contentType: "USER",
      reason,
      details,
    },
  });
}

export async function reportMessage(
  messageId: string,
  reason: string,
  details?: string,
): Promise<void> {
  const user = await requireUser();
  const message = await prisma.message.findUniqueOrThrow({ where: { id: messageId } });
  await prisma.report.create({
    data: {
      reporterId: user.id,
      reportedId: message.senderId,
      reportedMessageId: messageId,
      contentType: "MESSAGE",
      reason,
      details,
    },
  });
}

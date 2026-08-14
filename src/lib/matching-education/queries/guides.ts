import { prisma } from "@/lib/prisma";
import type { GuideType } from "@/generated/prisma/client";

export async function getGuideProfile(userId: string) {
  return prisma.guideProfile.findUnique({ where: { userId } });
}

export type UpsertGuideProfileInput = {
  userId: string;
  topics: string[];
  sessionDurations: number[];
  guideType: GuideType;
  isActive: boolean;
};

export async function upsertGuideProfile(input: UpsertGuideProfileInput) {
  return prisma.guideProfile.upsert({
    where: { userId: input.userId },
    update: {
      topics: input.topics,
      sessionDurations: input.sessionDurations,
      guideType: input.guideType,
      isActive: input.isActive,
    },
    create: input,
  });
}

export async function requestGuideSession(input: {
  guideId: string;
  participantId: string;
  topic: string;
  durationMinutes: number;
}) {
  if (input.guideId === input.participantId) {
    throw new Error("Kendine rehberlik session'ı isteyemezsin.");
  }
  return prisma.guideSession.create({
    data: {
      guideId: input.guideId,
      participantId: input.participantId,
      topic: input.topic,
      durationMinutes: input.durationMinutes,
    },
  });
}

export async function getSessionsForUser(userId: string) {
  return prisma.guideSession.findMany({
    where: { OR: [{ guideId: userId }, { participantId: userId }] },
    include: {
      guide: { select: { id: true, name: true } },
      participant: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function completeGuideSession(sessionId: string, actingUserId: string) {
  const session = await prisma.guideSession.findUnique({ where: { id: sessionId } });
  if (!session || session.guideId !== actingUserId) {
    throw new Error("Bu session'ı sadece rehber tamamlanmış olarak işaretleyebilir.");
  }
  return prisma.guideSession.update({
    where: { id: sessionId },
    data: { status: "COMPLETED" },
  });
}

export async function rateGuideSession(sessionId: string, participantId: string, rating: number, feedback?: string) {
  const session = await prisma.guideSession.findUnique({ where: { id: sessionId } });
  if (!session || session.participantId !== participantId) {
    throw new Error("Bu session'ı sadece katılımcı değerlendirebilir.");
  }
  return prisma.guideSession.update({
    where: { id: sessionId },
    data: { rating, feedback: feedback || null },
  });
}

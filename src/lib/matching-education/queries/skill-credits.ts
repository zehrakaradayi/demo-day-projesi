import { prisma } from "@/lib/prisma";
import type { SkillCreditSource } from "@/generated/prisma/enums";

export async function awardSkillCredits(input: {
  userId: string;
  amount: number;
  source: SkillCreditSource;
  counterpartyId?: string;
  relatedSessionId?: string;
}) {
  return prisma.skillCreditLedger.create({
    data: {
      userId: input.userId,
      amount: input.amount,
      source: input.source,
      counterpartyId: input.counterpartyId ?? null,
      relatedSessionId: input.relatedSessionId ?? null,
    },
  });
}

export async function getSkillCreditBalance(userId: string) {
  const result = await prisma.skillCreditLedger.aggregate({ where: { userId }, _sum: { amount: true } });
  return result._sum.amount ?? 0;
}

export async function getSkillCreditLedger(userId: string) {
  return prisma.skillCreditLedger.findMany({
    where: { userId },
    include: { counterparty: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
}

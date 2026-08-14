import { prisma } from "@/lib/prisma";

export type SkillChainStep = { userId: string; name: string; teachesSkillName: string };
export type SkillChain = { forSkillName: string; steps: SkillChainStep[] };

/**
 * Brif bölüm 12: doğrudan eşleşme yoksa A→B→C zinciri oluştur.
 * Basit 2 sıçramalı BFS: kullanıcının öğrenmek istediği bir skill'i öğreten ama
 * kullanıcıdan doğrudan bir şey öğrenemeyen kişi (A) için, A'nın öğrenmek istediği
 * skill'i öğreten ikinci bir kişi (B) bulunur → Sen → A → B zinciri.
 */
export async function findSkillChains(userId: string, limit = 3): Promise<SkillChain[]> {
  const [myWants, myTeachRows] = await Promise.all([
    prisma.userSkill.findMany({ where: { userId, mode: "LEARN" }, include: { skill: true } }),
    prisma.userSkill.findMany({ where: { userId, mode: "TEACH" } }),
  ]);
  const myTeachIds = new Set(myTeachRows.map((s) => s.skillId));

  const chains: SkillChain[] = [];

  for (const wanted of myWants) {
    const teachers = await prisma.userSkill.findMany({
      where: { skillId: wanted.skillId, mode: "TEACH", userId: { not: userId } },
      include: { user: { select: { id: true, name: true } } },
      take: 5,
    });

    for (const teacher of teachers) {
      const teacherWants = await prisma.userSkill.findMany({
        where: { userId: teacher.userId, mode: "LEARN" },
        include: { skill: true },
      });
      const directGive = teacherWants.find((t) => myTeachIds.has(t.skillId));
      if (directGive) continue; // doğrudan takas mümkün, chain'e gerek yok

      for (const need of teacherWants) {
        const secondHop = await prisma.userSkill.findFirst({
          where: { skillId: need.skillId, mode: "TEACH", userId: { notIn: [userId, teacher.userId] } },
          include: { user: { select: { id: true, name: true } } },
        });
        if (secondHop) {
          chains.push({
            forSkillName: wanted.skill.name,
            steps: [
              { userId: teacher.userId, name: teacher.user.name, teachesSkillName: wanted.skill.name },
              { userId: secondHop.userId, name: secondHop.user.name, teachesSkillName: need.skill.name },
            ],
          });
        }
        if (chains.length >= limit) return chains;
      }
    }
  }

  return chains;
}

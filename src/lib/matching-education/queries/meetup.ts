import { prisma } from "@/lib/prisma";
import { Prisma, type MeetupParticipantStatus } from "@/generated/prisma/client";
import type { MeetupPlan } from "@/lib/ai/schemas";
import type { MeetupPlanInput } from "@/lib/ai/meetupPlanner";

export async function getUserMeetups(userId: string) {
  const [created, invited] = await Promise.all([
    prisma.meetup.findMany({
      where: { createdById: userId },
      include: {
        participants: { include: { user: { select: { id: true, name: true } } } },
        chosenAlternative: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.meetup.findMany({
      where: { createdById: { not: userId }, participants: { some: { userId } } },
      include: {
        createdBy: { select: { id: true, name: true } },
        participants: { include: { user: { select: { id: true, name: true } } } },
        chosenAlternative: true,
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return { created, invited };
}

export async function getMeetupById(meetupId: string) {
  return prisma.meetup.findUnique({
    where: { id: meetupId },
    include: {
      createdBy: { select: { id: true, name: true } },
      participants: {
        include: { user: { select: { id: true, name: true, city: true } } },
        orderBy: { id: "asc" },
      },
      alternatives: {
        include: { stops: { orderBy: { order: "asc" } } },
        orderBy: { createdAt: "asc" },
      },
      chosenAlternative: { include: { stops: { orderBy: { order: "asc" } } } },
    },
  });
}

export type CreateMeetupInput = {
  createdById: string;
  city: string;
  peopleCount: number;
  budgetLevel: number | null;
  date: Date | null;
  timeRangeStart: string | null;
  timeRangeEnd: string | null;
  vibe: string | null;
  transportPreference: string | null;
  foodOrActivityPreference: string | null;
  participantUserIds: string[];
};

export async function createMeetup(input: CreateMeetupInput) {
  return prisma.meetup.create({
    data: {
      createdById: input.createdById,
      city: input.city,
      peopleCount: input.peopleCount,
      budgetLevel: input.budgetLevel,
      date: input.date,
      timeRangeStart: input.timeRangeStart,
      timeRangeEnd: input.timeRangeEnd,
      vibe: input.vibe,
      transportPreference: input.transportPreference,
      foodOrActivityPreference: input.foodOrActivityPreference,
      participants: {
        create: [...new Set(input.participantUserIds)]
          .filter((id) => id !== input.createdById)
          .map((userId) => ({ userId })),
      },
    },
  });
}

export function meetupToPlanInput(meetup: {
  city: string;
  peopleCount: number;
  budgetLevel: number | null;
  date: Date | null;
  timeRangeStart: string | null;
  timeRangeEnd: string | null;
  vibe: string | null;
  transportPreference: string | null;
  foodOrActivityPreference: string | null;
}): MeetupPlanInput {
  return {
    city: meetup.city,
    peopleCount: meetup.peopleCount,
    budgetLevel: meetup.budgetLevel,
    date: meetup.date ? meetup.date.toISOString().slice(0, 10) : null,
    timeRangeStart: meetup.timeRangeStart,
    timeRangeEnd: meetup.timeRangeEnd,
    vibe: meetup.vibe,
    transportPreference: meetup.transportPreference,
    foodOrActivityPreference: meetup.foodOrActivityPreference,
  };
}

export async function saveMeetupAlternatives(meetupId: string, plan: MeetupPlan) {
  for (const alt of plan.alternatives) {
    await prisma.meetupAlternative.create({
      data: {
        meetupId,
        tier: alt.tier,
        totalBudgetEstimate: alt.totalBudgetEstimate,
        perPersonBudgetEstimate: alt.perPersonBudgetEstimate,
        aiRawResponse: alt as unknown as Prisma.InputJsonValue,
        stops: {
          create: alt.stops.map((stop) => ({
            order: stop.order,
            startTime: stop.startTime,
            locationName: stop.locationName,
            activityType: stop.activityType,
            transportMinutesFromPrevious: stop.transportMinutesFromPrevious,
            notes: stop.notes,
          })),
        },
      },
    });
  }
}

export async function clearMeetupAlternatives(meetupId: string) {
  await prisma.meetupAlternative.deleteMany({ where: { meetupId } });
  await prisma.meetup.update({
    where: { id: meetupId },
    data: { chosenAlternativeId: null, status: "DRAFT" },
  });
}

export async function chooseMeetupAlternative(
  meetupId: string,
  alternativeId: string,
  userId: string,
) {
  return prisma.meetup.updateMany({
    where: { id: meetupId, createdById: userId },
    data: { chosenAlternativeId: alternativeId, status: "CONFIRMED" },
  });
}

export async function cancelMeetup(meetupId: string, userId: string) {
  return prisma.meetup.updateMany({
    where: { id: meetupId, createdById: userId },
    data: { status: "CANCELLED" },
  });
}

export async function respondToMeetupInvite(
  meetupId: string,
  userId: string,
  status: MeetupParticipantStatus,
) {
  return prisma.meetupParticipant.update({
    where: { meetupId_userId: { meetupId, userId } },
    data: { status },
  });
}

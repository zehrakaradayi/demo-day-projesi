import { z } from "zod";

export const ConversationStarterSchema = z.object({
  message: z.string(),
  basedOn: z.array(z.string()),
});

export type ConversationStarter = z.infer<typeof ConversationStarterSchema>;

export const MeetupStopSchema = z.object({
  order: z.number().int(),
  startTime: z.string(),
  locationName: z.string(),
  activityType: z.string(),
  transportMinutesFromPrevious: z.number().int().nullable(),
  notes: z.string().nullable(),
});

export const MeetupAlternativeSchema = z.object({
  tier: z.enum(["BUDGET", "BALANCED", "PREMIUM"]),
  summary: z.string(),
  totalBudgetEstimate: z.number().nullable(),
  perPersonBudgetEstimate: z.number().nullable(),
  stops: z.array(MeetupStopSchema),
});

export const MeetupPlanSchema = z.object({
  alternatives: z.array(MeetupAlternativeSchema).length(3),
});

export type MeetupAlternativePlan = z.infer<typeof MeetupAlternativeSchema>;
export type MeetupPlan = z.infer<typeof MeetupPlanSchema>;

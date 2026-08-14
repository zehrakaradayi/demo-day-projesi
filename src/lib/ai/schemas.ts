import { z } from "zod";

export const ConversationStarterSchema = z.object({
  message: z.string(),
  basedOn: z.array(z.string()),
});

export type ConversationStarter = z.infer<typeof ConversationStarterSchema>;

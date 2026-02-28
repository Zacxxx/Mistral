import { z } from "zod";

export const analyzeQuoteInputSchema = z.object({
  totalAmount: z.number().positive(),
  durationDays: z.number().int().positive(),
  materialRatio: z.number().min(0).max(1)
});

export type AnalyzeQuoteInput = z.infer<typeof analyzeQuoteInputSchema>;

import { z } from "zod";

export const cloudflareRecordSchema = z.object({
  type: z.string(),
  content: z.string(),
  id: z.string(),
  name: z.string(),
});

export type CloudflareRecord = z.infer<typeof cloudflareRecordSchema>;

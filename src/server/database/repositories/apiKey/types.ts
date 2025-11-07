import type { InferSelectModel } from 'drizzle-orm';
import { z } from 'zod';

import type { apiKey } from './schema';

export type ApiKeyType = InferSelectModel<typeof apiKey>;

export const ApiKeyCreateSchema = z.object({
  name: z.string().min(1).max(255),
  expiresAt: z.string().datetime().optional(),
});

export type ApiKeyCreateType = z.infer<typeof ApiKeyCreateSchema>;

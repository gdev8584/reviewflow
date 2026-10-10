import { z } from "zod";

const paginationIntegerSchema = z.string()
  .regex(/^\d+$/)
  .transform(Number)
  .pipe(z.number().int().safe());

export const customerListQuerySchema = z.object({
  limit: paginationIntegerSchema.pipe(z.number().min(1).max(100)).optional().default("10"),
  offset: paginationIntegerSchema.pipe(z.number().min(0)).optional().default("0")
});

export const createCustomerSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(254)
});

export const updateCustomerSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  email: z.string().trim().email().max(254).optional()
}).refine((value) => value.name !== undefined || value.email !== undefined, {
  message: "At least one field must be provided"
});

import { z } from "zod";

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

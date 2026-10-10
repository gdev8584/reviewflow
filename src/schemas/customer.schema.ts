
import { z } from "zod";

const customerNameSchema = z
  .string({
    required_error: "Name is required",
    invalid_type_error: "Name must be a string",
  })
  .trim()
  .min(1, "Name cannot be empty")
  .max(100, "Name must not exceed 100 characters");

const customerEmailSchema = z
  .string({
    required_error: "Email is required",
    invalid_type_error: "Email must be a string",
  })
  .trim()
  .email("Please provide a valid email address")
  .max(254, "Email must not exceed 254 characters");

export const createCustomerSchema = z
  .object({
    name: customerNameSchema,
    email: customerEmailSchema,
  })
  .strict("Unexpected fields are not allowed");

export const updateCustomerSchema = z
  .object({
    name: customerNameSchema.optional(),
    email: customerEmailSchema.optional(),
  })
  .strict("Unexpected fields are not allowed")
  .refine(
    (value) => value.name !== undefined || value.email !== undefined,
    {
      message: "At least one field must be provided",
    },
  );

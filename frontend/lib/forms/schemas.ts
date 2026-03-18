import { z } from "zod";

export const mongoObjectIdSchema = z
  .string()
  .trim()
  .regex(/^[a-fA-F0-9]{24}$/);

export const requiredStringSchema = (label: string) =>
  z.string().trim().min(1, `${label} is required`);

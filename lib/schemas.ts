import { z } from 'zod';

export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export const customerCreateSchema = z.object({
  name: z.string().min(2, "Name too short"),
  mobile_number: z.string().regex(/^\d{10}$/, "Mobile must be 10 digits"),
  birthdate: z.string().datetime().or(z.string().date()), // ISO string
  initial_balance: z.number().nonnegative("Balance cannot be negative").optional(),
});

export const rechargeSchema = z.object({
  customer_id: z.number().int().positive(),
  amount: z.number().positive("Recharge amount must be positive"), // Prevents negative numbers
  transaction_type: z.string(),
  payment_mode: z.string().optional(),
});

export const sessionStartSchema = z.object({
  qr_code_uuid: z.string().uuid(),
  children: z.number().int().nonnegative(),
  adults: z.number().int().nonnegative(),
  duration_hr: z.number().positive(),
  actual_cost: z.number().nonnegative(),
  discounted_cost: z.number().nonnegative(),
  discount_percentage: z.number().min(0).max(100),
  discount_reason: z.string().optional(),
});
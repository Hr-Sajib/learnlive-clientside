import { z } from 'zod';

/**
 * Client-side mirrors of the server's zod schemas.
 *
 * These exist for instant feedback while typing, not for safety — the server
 * validates everything again and is the only thing that decides what is
 * accepted. When the two disagree, change this file to match the server, never
 * the other way round.
 *
 * Server source: the `*.validation.ts` files under learnlive-serverside/src/modules.
 */

const phone = z
  .string()
  .trim()
  .regex(/^01[3-9]\d{8}$/, 'Enter a valid 11-digit mobile number, e.g. 01712345678');

const password = z.string().min(8, 'Password must be at least 8 characters').max(72);

export const loginSchema = z.object({
  identifier: z.string().trim().min(3, 'Enter your email or mobile number'),
  password: z.string().min(1, 'Enter your password'),
});

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Please enter your full name').max(80),
  email: z.string().trim().toLowerCase().email('Enter a valid email address'),
  phone,
  password,
  batchCode: z
    .string()
    .trim()
    .toUpperCase()
    .min(3, 'Enter the batch code your coach gave you')
    .max(24),
});

export const createBatchSchema = z.object({
  code: z
    .string()
    .trim()
    .toUpperCase()
    .min(3)
    .max(24)
    .regex(/^[A-Z0-9-]+$/, 'Letters, numbers and hyphens only, e.g. B12-FRONTEND'),
  title: z.string().trim().min(3, 'Give the batch a title').max(120),
  description: z.string().trim().max(2000).optional(),
});

export const createClassSchema = z.object({
  batchId: z.string().min(1, 'Choose a batch'),
  title: z.string().trim().min(3, 'Give the class a title').max(160),
  description: z.string().trim().max(4000).optional(),
  /** A `datetime-local` value. Convert with `new Date(v).toISOString()` before sending. */
  scheduledStartAt: z.string().min(1, 'Choose a start time'),
  scheduledDurationMin: z.coerce.number().int().min(5).max(600),
  attendanceThresholdPct: z.coerce.number().int().min(1).max(100).optional(),
});

/** Fields an admin may edit while a class is still scheduled. */
export const updateClassSchema = z.object({
  title: z.string().trim().min(3, 'Give the class a title').max(160),
  description: z.string().trim().max(4000).optional(),
  scheduledStartAt: z.string().min(1, 'Choose a start time'),
  scheduledDurationMin: z.coerce.number().int().min(5).max(600),
});

export const rejectUserSchema = z.object({
  reason: z.string().trim().min(5, 'Tell the student why — they will see this').max(500),
});

export const overrideAttendanceSchema = z.object({
  status: z.enum(['present', 'partial', 'absent']),
  reason: z.string().trim().min(5, 'Record why you are overriding this').max(500),
});

export type LoginValues = z.infer<typeof loginSchema>;
export type RegisterValues = z.infer<typeof registerSchema>;
export type CreateBatchValues = z.infer<typeof createBatchSchema>;
export type CreateClassValues = z.infer<typeof createClassSchema>;
export type UpdateClassValues = z.infer<typeof updateClassSchema>;

import { z } from 'zod';

export const emailSchema = z.string().email();
export const userIdSchema = z.string().min(1);

export function validateEmail(email: string): boolean {
  return emailSchema.safeParse(email).success;
}

export function validateUserId(id: string): boolean {
  return userIdSchema.safeParse(id).success;
}

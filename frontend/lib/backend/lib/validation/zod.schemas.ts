import { z } from 'zod';

export const PhoneAuthSchema = z.object({
  phone: z
    .string()
    .min(10, 'Phone number must be at least 10 digits')
    .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid international phone number format'),
});

export const OtpVerifySchema = z.object({
  phone: z.string().min(10),
  otp: z.string().length(6, 'OTP must be exactly 6 digits'),
});

export const EmailAuthSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const EventCreateSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(120),
  slug: z.string().min(3).max(140).regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'),
  short_description: z.string().min(10).max(250),
  description: z.string().min(20, 'Full description required'),
  category_id: z.string().uuid().optional(),
  host_id: z.string().uuid('Host ID is required'),
  venue_id: z.string().uuid().optional(),
  start_at: z.string().datetime('Start date must be ISO timestamp'),
  end_at: z.string().datetime('End date must be ISO timestamp'),
  capacity: z.number().int().min(1, 'Capacity must be at least 1'),
  price: z.number().min(0, 'Price cannot be negative'),
  currency: z.string().length(3).default('INR'),
  cover_image: z.string().url().optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'CANCELLED', 'COMPLETED', 'ARCHIVED']).default('DRAFT'),
  featured: z.boolean().default(false),
  registration_open: z.boolean().default(true),
});

export const RegistrationRequestSchema = z.object({
  event_id: z.string().uuid(),
  ticket_type: z.string().default('General'),
  quantity: z.number().int().min(1).max(5).default(1),
  user_phone: z.string().optional(),
  user_email: z.string().email().optional(),
  user_name: z.string().optional(),
});

export const CheckinScanSchema = z.object({
  ticket_code: z.string().min(8, 'Invalid ticket code format'),
  event_id: z.string().uuid('Event ID is required'),
  device_info: z.string().optional(),
});

export type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'PENDING';
export type EventStatus = 'DRAFT' | 'PUBLISHED' | 'CANCELLED' | 'COMPLETED' | 'ARCHIVED';
export type TicketStatus = 'ACTIVE' | 'USED' | 'CANCELLED' | 'REFUNDED';
export type RegistrationStatus = 'CONFIRMED' | 'PENDING' | 'CANCELLED';
export type OrderStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
export type PaymentStatus = 'AUTHORIZED' | 'CAPTURED' | 'FAILED' | 'REFUNDED';
export type DiscountType = 'PERCENTAGE' | 'FIXED';

export interface Profile {
  id: string;
  auth_user_id?: string;
  full_name: string;
  phone?: string;
  email?: string;
  avatar_url?: string;
  bio?: string;
  status: UserStatus;
  created_at: string;
  updated_at: string;
}

export interface Role {
  id: string;
  name: string;
  description?: string;
  is_system: boolean;
  created_at: string;
}

export interface Permission {
  id: string;
  key: string;
  description?: string;
  category: string;
  created_at: string;
}

export interface EventCategory {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  description?: string;
  display_order: number;
  created_at: string;
}

export interface Venue {
  id: string;
  name: string;
  slug: string;
  address: string;
  city: string;
  google_maps_url?: string;
  latitude?: number;
  longitude?: number;
  capacity: number;
  created_at: string;
  updated_at: string;
}

export interface EventItem {
  id: string;
  title: string;
  slug: string;
  short_description: string;
  description: string;
  category_id?: string;
  host_id: string;
  venue_id?: string;
  start_at: string;
  end_at: string;
  capacity: number;
  registered_count: number;
  registration_deadline?: string;
  price: number;
  currency: string;
  cover_image?: string;
  status: EventStatus;
  featured: boolean;
  registration_open: boolean;
  created_by?: string;
  updated_by?: string;
  published_at?: string;
  created_at: string;
  updated_at: string;
  category?: EventCategory;
  venue?: Venue;
  host?: Profile;
}

export interface Registration {
  id: string;
  registration_number: string;
  event_id: string;
  user_id: string;
  status: RegistrationStatus;
  total_amount: number;
  currency: string;
  created_at: string;
  updated_at: string;
  event?: EventItem;
  user?: Profile;
  tickets?: Ticket[];
}

export interface Ticket {
  id: string;
  ticket_code: string;
  registration_id: string;
  event_id: string;
  user_id: string;
  qr_payload: string;
  status: TicketStatus;
  created_at: string;
  updated_at: string;
  event?: EventItem;
  user?: Profile;
}

export interface Checkin {
  id: string;
  ticket_id: string;
  event_id: string;
  user_id: string;
  checked_in_by?: string;
  checked_in_at: string;
  device_info?: string;
  ticket?: Ticket;
  user?: Profile;
}

export interface AuditLog {
  id: string;
  actor_user_id?: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  metadata?: Record<string, any>;
  ip_address?: string;
  created_at: string;
  actor?: Profile;
}

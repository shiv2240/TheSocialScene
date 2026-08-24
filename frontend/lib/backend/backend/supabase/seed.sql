-- Seed Data for The Social Scene Platform

-- 1. Insert Core Roles
INSERT INTO roles (name, description, is_system) VALUES
('SUPER_ADMIN', 'Full system control and administrative permissions', TRUE),
('ADMIN', 'Platform management, event approvals, and user support', TRUE),
('HOST', 'Event creator and venue manager', TRUE),
('EVENT_MANAGER', 'Manages specific events and attendees', TRUE),
('CHECKIN_STAFF', 'Event entry scanner and attendance operator', TRUE),
('EDITOR', 'Content editor for events and blog listings', TRUE),
('FINANCE', 'Payment reporting and refund manager', TRUE),
('SUPPORT', 'Customer ticket support and attendee queries', TRUE)
ON CONFLICT (name) DO NOTHING;

-- 2. Insert Granular Permissions
INSERT INTO permissions (key, description, category) VALUES
('EVENT_CREATE', 'Can create new events', 'EVENTS'),
('EVENT_VIEW', 'Can view events in dashboard', 'EVENTS'),
('EVENT_EDIT', 'Can edit existing events', 'EVENTS'),
('EVENT_DELETE', 'Can delete events', 'EVENTS'),
('EVENT_PUBLISH', 'Can publish or unpublish events', 'EVENTS'),
('REGISTRATION_VIEW', 'Can view event registrations', 'REGISTRATIONS'),
('REGISTRATION_EXPORT', 'Can export attendee lists', 'REGISTRATIONS'),
('REGISTRATION_MANAGE', 'Can update or cancel registrations', 'REGISTRATIONS'),
('CHECKIN_VIEW', 'Can view check-in dashboard', 'CHECKIN'),
('CHECKIN_CREATE', 'Can scan QR codes and check in attendees', 'CHECKIN'),
('HOST_VIEW', 'Can view platform hosts', 'HOSTS'),
('HOST_CREATE', 'Can create new host profiles', 'HOSTS'),
('HOST_EDIT', 'Can edit host profiles', 'HOSTS'),
('HOST_DELETE', 'Can delete host profiles', 'HOSTS'),
('USER_VIEW', 'Can view user list', 'USERS'),
('USER_MANAGE', 'Can assign roles and suspend users', 'USERS'),
('PAYMENT_VIEW', 'Can view transactions and revenue', 'PAYMENTS'),
('REFUND_MANAGE', 'Can initiate refunds', 'PAYMENTS'),
('ANALYTICS_VIEW', 'Can view platform analytics and growth KPIs', 'ANALYTICS'),
('SETTINGS_MANAGE', 'Can modify platform settings', 'SETTINGS'),
('AUDIT_LOG_VIEW', 'Can view audit trail logs', 'AUDIT')
ON CONFLICT (key) DO NOTHING;

-- 3. Insert Event Categories
INSERT INTO event_categories (name, slug, icon, description, display_order) VALUES
('Music & Concerts', 'music-concerts', 'Music', 'Live gigs, acoustic sessions, and music festivals', 1),
('Tech & Networking', 'tech-networking', 'Laptop', 'Startup meetups, dev conferences, and tech panels', 2),
('Social & Nightlife', 'social-nightlife', 'PartyPopper', 'Cocktail mixers, rooftop parties, and weekend socials', 3),
('Fitness & Wellness', 'fitness-wellness', 'Dumbbell', 'Morning run clubs, yoga retreats, and sound baths', 4),
('Art & Workshops', 'art-workshops', 'Palette', 'Pottery workshops, paint & sip, and creative labs', 5),
('Food & Culinary', 'food-culinary', 'Utensils', 'Chef pop-ups, wine tasting, and food crawls', 6)
ON CONFLICT (slug) DO NOTHING;

-- Venues are intentionally not seeded with demo data.
-- Real venues should be created from the admin dashboard.

-- Migration 00002: PostgreSQL Functions, Triggers, and RLS Security Policies

-- Trigger to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_venues_updated_at BEFORE UPDATE ON venues FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_registrations_updated_at BEFORE UPDATE ON registrations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tickets_updated_at BEFORE UPDATE ON tickets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Atomic Capacity Lock Function for Event Registration
CREATE OR REPLACE FUNCTION reserve_event_ticket(
    p_event_id UUID,
    p_user_id UUID,
    p_ticket_type TEXT DEFAULT 'General',
    p_price NUMERIC DEFAULT 0.00
) RETURNS JSONB AS $$
DECLARE
    v_capacity INT;
    v_registered INT;
    v_status event_status;
    v_registration_id UUID;
    v_ticket_id UUID;
    v_ticket_code TEXT;
    v_reg_number TEXT;
    v_result JSONB;
BEGIN
    -- Select with ROW LOCK to prevent race conditions
    SELECT capacity, registered_count, status INTO v_capacity, v_registered, v_status
    FROM events WHERE id = p_event_id FOR UPDATE;

    IF v_status != 'PUBLISHED' THEN
        RAISE EXCEPTION 'EVENT_NOT_PUBLISHED';
    END IF;

    IF v_registered >= v_capacity THEN
        RAISE EXCEPTION 'EVENT_SOLD_OUT';
    END IF;

    -- Check if user already registered
    IF EXISTS (
        SELECT 1 FROM registrations 
        WHERE event_id = p_event_id AND user_id = p_user_id AND status = 'CONFIRMED'
    ) THEN
        RAISE EXCEPTION 'DUPLICATE_REGISTRATION';
    END IF;

    -- Format Registration Number (REG-2026-XXXX)
    v_reg_number := 'REG-2026-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 8));

    -- Insert Registration Record
    INSERT INTO registrations (registration_number, event_id, user_id, status, total_amount)
    VALUES (v_reg_number, p_event_id, p_user_id, 'CONFIRMED', p_price)
    RETURNING id INTO v_registration_id;

    -- Insert Registration Item Breakdown
    INSERT INTO registration_items (registration_id, ticket_type, unit_price, quantity)
    VALUES (v_registration_id, p_ticket_type, p_price, 1);

    -- Format Ticket Code (TSS-2026-XXXXXXXX)
    v_ticket_code := 'TSS-2026-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 8));

    -- Generate Ticket & QR Payload
    INSERT INTO tickets (ticket_code, registration_id, event_id, user_id, status, qr_payload)
    VALUES (v_ticket_code, v_registration_id, p_event_id, p_user_id, 'ACTIVE', v_ticket_code)
    RETURNING id INTO v_ticket_id;

    -- Increment registered_count atomically
    UPDATE events SET registered_count = registered_count + 1 WHERE id = p_event_id;

    -- Return output payload
    v_result := jsonb_build_object(
        'registration_id', v_registration_id,
        'registration_number', v_reg_number,
        'ticket_id', v_ticket_id,
        'ticket_code', v_ticket_code,
        'status', 'CONFIRMED'
    );

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable Row Level Security (RLS) on Core Tables
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policy 1: Public Read Access for Published Events
CREATE POLICY public_read_published_events ON events
    FOR SELECT
    USING (status = 'PUBLISHED');

-- RLS Policy 2: Users can view their own profile
CREATE POLICY users_view_own_profile ON profiles
    FOR SELECT
    USING (auth.uid() = auth_user_id);

-- RLS Policy 3: Users can view their own registrations
CREATE POLICY users_view_own_registrations ON registrations
    FOR SELECT
    USING (user_id IN (SELECT id FROM profiles WHERE auth_user_id = auth.uid()));

-- RLS Policy 4: Users can view their own tickets
CREATE POLICY users_view_own_tickets ON tickets
    FOR SELECT
    USING (user_id IN (SELECT id FROM profiles WHERE auth_user_id = auth.uid()));

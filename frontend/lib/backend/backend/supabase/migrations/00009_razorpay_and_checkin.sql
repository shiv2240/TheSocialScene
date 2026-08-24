-- Migration 00009: Razorpay payment metadata + atomic paid registration confirmation + secure check-in

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS razorpay_order_id TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS receipt TEXT,
  ADD COLUMN IF NOT EXISTS razorpay_signature TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS razorpay_order_id TEXT,
  ADD COLUMN IF NOT EXISTS razorpay_signature TEXT;

CREATE INDEX IF NOT EXISTS idx_orders_razorpay_order_id ON public.orders(razorpay_order_id);
CREATE INDEX IF NOT EXISTS idx_payments_razorpay_order_id ON public.payments(razorpay_order_id);

CREATE OR REPLACE FUNCTION create_pending_registration(
    p_event_id UUID,
    p_user_id UUID,
    p_price NUMERIC DEFAULT 0.00,
    p_currency TEXT DEFAULT 'INR'
) RETURNS JSONB AS $$
DECLARE
    v_registration_id UUID;
    v_registration_number TEXT;
    v_existing UUID;
BEGIN
    SELECT id INTO v_existing
    FROM registrations
    WHERE event_id = p_event_id
      AND user_id = p_user_id
      AND status IN ('PENDING', 'CONFIRMED')
    ORDER BY created_at DESC
    LIMIT 1;

    IF v_existing IS NOT NULL THEN
        RETURN jsonb_build_object('registration_id', v_existing, 'existing', true);
    END IF;

    v_registration_number := 'REG-2026-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 8));

    INSERT INTO registrations (registration_number, event_id, user_id, status, total_amount, currency)
    VALUES (v_registration_number, p_event_id, p_user_id, 'PENDING', p_price, p_currency)
    RETURNING id INTO v_registration_id;

    INSERT INTO registration_items (registration_id, ticket_type, unit_price, quantity)
    VALUES (v_registration_id, 'General', p_price, 1);

    RETURN jsonb_build_object(
        'registration_id', v_registration_id,
        'registration_number', v_registration_number,
        'existing', false
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION confirm_paid_registration(
    p_registration_id UUID,
    p_razorpay_payment_id TEXT DEFAULT NULL,
    p_razorpay_order_id TEXT DEFAULT NULL,
    p_razorpay_signature TEXT DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
    v_registration registrations%ROWTYPE;
    v_event events%ROWTYPE;
    v_ticket_id UUID;
    v_ticket_code TEXT;
BEGIN
    SELECT * INTO v_registration
    FROM registrations
    WHERE id = p_registration_id
    FOR UPDATE;

    IF v_registration.id IS NULL THEN
        RAISE EXCEPTION 'REGISTRATION_NOT_FOUND';
    END IF;

    IF v_registration.status = 'CONFIRMED' THEN
        SELECT id, ticket_code INTO v_ticket_id, v_ticket_code
        FROM tickets
        WHERE registration_id = p_registration_id
        LIMIT 1;
        RETURN jsonb_build_object(
            'registration_id', p_registration_id,
            'ticket_id', v_ticket_id,
            'ticket_code', v_ticket_code,
            'already_confirmed', true
        );
    END IF;

    SELECT * INTO v_event FROM events WHERE id = v_registration.event_id FOR UPDATE;

    IF v_event.status <> 'PUBLISHED' OR NOT v_event.registration_open THEN
        RAISE EXCEPTION 'EVENT_REGISTRATION_CLOSED';
    END IF;

    IF v_event.registered_count >= v_event.capacity THEN
        RAISE EXCEPTION 'EVENT_SOLD_OUT';
    END IF;

    IF EXISTS (
        SELECT 1 FROM registrations
        WHERE event_id = v_registration.event_id
          AND user_id = v_registration.user_id
          AND status = 'CONFIRMED'
          AND id <> v_registration.id
    ) THEN
        RAISE EXCEPTION 'DUPLICATE_REGISTRATION';
    END IF;

    v_ticket_code := 'TSS-2026-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 8));

    UPDATE registrations
    SET status = 'CONFIRMED', updated_at = NOW()
    WHERE id = p_registration_id;

    INSERT INTO tickets (ticket_code, registration_id, event_id, user_id, qr_payload, status)
    VALUES (v_ticket_code, p_registration_id, v_registration.event_id, v_registration.user_id, v_ticket_code, 'ACTIVE')
    RETURNING id INTO v_ticket_id;

    UPDATE events
    SET registered_count = registered_count + 1, updated_at = NOW()
    WHERE id = v_registration.event_id;

    RETURN jsonb_build_object(
        'registration_id', p_registration_id,
        'ticket_id', v_ticket_id,
        'ticket_code', v_ticket_code,
        'already_confirmed', false
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION checkin_ticket(
    p_ticket_code TEXT,
    p_event_id UUID,
    p_staff_profile_id UUID,
    p_device_info TEXT DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
    v_ticket tickets%ROWTYPE;
    v_profile profiles%ROWTYPE;
    v_checkin checkins%ROWTYPE;
BEGIN
    SELECT * INTO v_ticket
    FROM tickets
    WHERE ticket_code = UPPER(TRIM(p_ticket_code))
    FOR UPDATE;

    IF v_ticket.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'code', 'INVALID_TICKET', 'message', 'Ticket not found.');
    END IF;

    IF v_ticket.event_id <> p_event_id THEN
        RETURN jsonb_build_object('success', false, 'code', 'WRONG_EVENT', 'message', 'This ticket belongs to another event.');
    END IF;

    IF v_ticket.status <> 'ACTIVE' THEN
        RETURN jsonb_build_object('success', false, 'code', 'TICKET_NOT_ACTIVE', 'message', 'Ticket is not active.');
    END IF;

    SELECT * INTO v_profile FROM profiles WHERE id = v_ticket.user_id;

    IF EXISTS (SELECT 1 FROM checkins WHERE ticket_id = v_ticket.id) THEN
        SELECT * INTO v_checkin FROM checkins WHERE ticket_id = v_ticket.id LIMIT 1;
        RETURN jsonb_build_object(
            'success', false,
            'code', 'ALREADY_CHECKED_IN',
            'message', 'Ticket has already been checked in.',
            'attendee_name', v_profile.full_name,
            'checked_in_at', v_checkin.checked_in_at
        );
    END IF;

    INSERT INTO checkins (ticket_id, event_id, user_id, checked_in_by, device_info)
    VALUES (v_ticket.id, v_ticket.event_id, v_ticket.user_id, p_staff_profile_id, p_device_info)
    RETURNING * INTO v_checkin;

    UPDATE tickets SET status = 'USED', updated_at = NOW() WHERE id = v_ticket.id;

    RETURN jsonb_build_object(
        'success', true,
        'code', 'CHECKED_IN',
        'message', 'Entry verified successfully.',
        'attendee_name', v_profile.full_name,
        'ticket_code', v_ticket.ticket_code,
        'checked_in_at', v_checkin.checked_in_at
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION create_pending_registration(UUID, UUID, NUMERIC, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION confirm_paid_registration(UUID, TEXT, TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION checkin_ticket(TEXT, UUID, UUID, TEXT) TO service_role;

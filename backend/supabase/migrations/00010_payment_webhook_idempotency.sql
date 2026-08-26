-- Migration 00010: Razorpay webhook idempotency and replay protection

CREATE TABLE IF NOT EXISTS public.payment_webhook_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    razorpay_event_id TEXT UNIQUE NOT NULL,
    event_type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'PROCESSING' CHECK (status IN ('PROCESSING', 'PROCESSED', 'FAILED')),
    payload JSONB NOT NULL,
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_webhook_events_status
    ON public.payment_webhook_events(status);

CREATE INDEX IF NOT EXISTS idx_payment_webhook_events_created_at
    ON public.payment_webhook_events(created_at);

ALTER TABLE public.payment_webhook_events ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.payment_webhook_events FROM anon, authenticated;
GRANT ALL ON public.payment_webhook_events TO service_role;

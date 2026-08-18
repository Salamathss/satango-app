
-- 1. Email subscriptions
CREATE TABLE public.email_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  source TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT INSERT ON public.email_subscriptions TO anon, authenticated;
GRANT ALL ON public.email_subscriptions TO service_role;

ALTER TABLE public.email_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can subscribe"
  ON public.email_subscriptions
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
    AND length(email) <= 254
  );

-- 2. CTA click events
CREATE TABLE public.cta_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event TEXT NOT NULL,
  path TEXT,
  referrer TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT INSERT ON public.cta_events TO anon, authenticated;
GRANT ALL ON public.cta_events TO service_role;

ALTER TABLE public.cta_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can log CTA events"
  ON public.cta_events
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (length(event) BETWEEN 1 AND 80);

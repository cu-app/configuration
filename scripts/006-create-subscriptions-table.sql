-- Create subscriptions table for Stripe integration
CREATE TABLE IF NOT EXISTS public.cu_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  product_id TEXT NOT NULL,
  status TEXT NOT NULL, -- active, canceled, past_due, trialing
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX idx_cu_subscriptions_user_id ON public.cu_subscriptions(user_id);
CREATE INDEX idx_cu_subscriptions_stripe_customer_id ON public.cu_subscriptions(stripe_customer_id);
CREATE INDEX idx_cu_subscriptions_status ON public.cu_subscriptions(status);

-- RLS policies
ALTER TABLE public.cu_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own subscriptions"
  ON public.cu_subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Admin policy (for service role)
CREATE POLICY "Service role has full access to subscriptions"
  ON public.cu_subscriptions
  USING (auth.jwt()->>'role' = 'service_role');

COMMENT ON TABLE public.cu_subscriptions IS 'Tracks Stripe subscriptions for GitHub clone access';

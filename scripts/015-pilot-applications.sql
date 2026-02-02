-- Pilot program enrollments (sign-in required, then enroll for platform + download access)
-- Links to auth.users so we can require sign-in and check enrollment status

CREATE TABLE IF NOT EXISTS public.pilot_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  cu_name TEXT NOT NULL,
  charter_number TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  contact_title TEXT,
  developer_count INTEGER,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_pilot_applications_user_id ON public.pilot_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_pilot_applications_status ON public.pilot_applications(status);
CREATE INDEX IF NOT EXISTS idx_pilot_applications_email ON public.pilot_applications(email);

-- RLS: users can read/insert their own row
ALTER TABLE public.pilot_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own pilot application"
  ON public.pilot_applications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own pilot application"
  ON public.pilot_applications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admins (from admin_users) can update status for approval; users cannot update after submit
CREATE POLICY "Admins can update pilot applications"
  ON public.pilot_applications FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.admin_users WHERE email = auth.jwt()->>'email' AND is_super_admin = true)
  )
  WITH CHECK (true);

COMMENT ON TABLE public.pilot_applications IS 'Pilot program enrollments; user must sign in then enroll to access platform and download options.';

-- Create user activity log table
CREATE TABLE IF NOT EXISTS public.user_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  action VARCHAR(255) NOT NULL,
  object_type VARCHAR(255),
  object_id UUID,
  metadata JSONB DEFAULT '{}'::jsonb,
  ip_address VARCHAR(50),
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create index for querying by user and timestamp
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_user_id ON public.user_activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_created_at ON public.user_activity_logs(created_at);

-- Add RLS policies
ALTER TABLE public.user_activity_logs ENABLE ROW LEVEL SECURITY;

-- Allow users to see their own logs
CREATE POLICY "Users can view their own activity logs" 
  ON public.user_activity_logs
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Allow users to insert their own logs (frontend logging)
CREATE POLICY "Users can log their own activities" 
  ON public.user_activity_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Allow service role and auth admin to access all logs
CREATE POLICY "Service role can access all logs" 
  ON public.user_activity_logs
  FOR ALL
  TO service_role
  USING (true);

GRANT SELECT, INSERT ON public.user_activity_logs TO authenticated;
GRANT ALL ON public.user_activity_logs TO service_role;
GRANT ALL ON public.user_activity_logs TO supabase_auth_admin;

-- Grant usage of sequence to roles
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO supabase_auth_admin; 
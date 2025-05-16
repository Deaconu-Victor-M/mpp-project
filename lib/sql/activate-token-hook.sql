-- Enable the custom access token hook with the JWT extension
SELECT
  CASE
    WHEN EXISTS (
      SELECT 1 FROM pg_extension WHERE extname = 'pgjwt'
    ) THEN (
      SELECT set_config('pgrst.jwt_secret', current_setting('supabase_auth.jwt_secret', true)::text, true)
    )
    ELSE NULL
  END;

-- Check if the function exists before registering it
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc
    WHERE proname = 'custom_access_token_hook'
    AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  ) THEN
    -- Register the hook with Supabase Auth
    INSERT INTO auth.hooks (hook_table_id, hook_name, hook_function_name)
    VALUES ('00000000-0000-0000-0000-000000000000', 'JWT_ACCESS_TOKEN', 'public.custom_access_token_hook')
    ON CONFLICT (hook_name, hook_function_name) DO NOTHING;
    
    RAISE NOTICE 'Successfully registered custom_access_token_hook';
  ELSE
    RAISE EXCEPTION 'The custom_access_token_hook function does not exist!';
  END IF;
END;
$$ LANGUAGE plpgsql; 
-- v0.6: explicit grants for the API roles on schema public.
-- Newer Supabase Postgres 17.6 images (shipped with CLI 2.111.0) no longer give
-- anon, authenticated and service_role table privileges by default on objects
-- created by postgres, so every API request failed with 42501 "permission denied".
-- This restores the classic Supabase defaults. Access stays restricted by RLS,
-- which is enabled on every table in public. Idempotent: GRANT is a no-op when
-- the privilege already exists.

------------------------------------------------------------
-- 1. Schema usage
------------------------------------------------------------
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

------------------------------------------------------------
-- 2. Existing tables, sequences and functions
------------------------------------------------------------
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;

------------------------------------------------------------
-- 3. Future objects created by postgres (i.e. by later migrations)
------------------------------------------------------------
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;

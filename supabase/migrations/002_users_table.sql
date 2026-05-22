-- Custom users table (passwords stored as bcrypt hashes — never plain text)

CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  full_name TEXT,
  designation TEXT,
  team TEXT,
  primary_stack TEXT,
  stacks TEXT,
  experience TEXT,
  timezone TEXT,
  industries TEXT,
  dependency TEXT DEFAULT 'Normal',
  bio TEXT,
  linkedin_url TEXT,
  github_url TEXT,
  portfolio_url TEXT,
  other_links JSONB DEFAULT '[]'::jsonb,
  resume_path TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS users_email_idx ON public.users (LOWER(email));

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- No direct client access; app uses service role on server
DROP POLICY IF EXISTS users_deny_all ON public.users;
CREATE POLICY users_deny_all ON public.users FOR ALL USING (false);

-- Link engineer_resources to app users (optional FK update)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'engineer_resources'
  ) THEN
    ALTER TABLE public.engineer_resources DROP CONSTRAINT IF EXISTS engineer_resources_user_id_fkey;
    ALTER TABLE public.engineer_resources
      ADD CONSTRAINT engineer_resources_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;
  END IF;
END $$;

DROP TRIGGER IF EXISTS users_updated_at ON public.users;
CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

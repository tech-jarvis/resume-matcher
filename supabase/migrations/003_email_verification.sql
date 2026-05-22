-- Email verification for @devsinc.com accounts

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS public.email_verification_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS email_verification_tokens_user_idx
  ON public.email_verification_tokens (user_id);

CREATE INDEX IF NOT EXISTS email_verification_tokens_hash_idx
  ON public.email_verification_tokens (token_hash);

ALTER TABLE public.email_verification_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY email_tokens_deny_all ON public.email_verification_tokens FOR ALL USING (false);

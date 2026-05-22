# Supabase auth & security setup

## 1. Run database migration

In [Supabase Dashboard](https://supabase.com/dashboard) → **SQL Editor**, paste and run:

`supabase/migrations/001_profiles_auth.sql`

This creates `profiles`, `engineer_resources`, RLS policies, storage bucket `resumes`, and auto-profile on signup.

## 2. Enable Google OAuth

1. **Authentication** → **Providers** → **Google** → Enable
2. Add Google Cloud OAuth client ID/secret ([Google Cloud Console](https://console.cloud.google.com/apis/credentials))
3. Authorized redirect URI: `https://<project-ref>.supabase.co/auth/v1/callback`

## 3. Email auth & redirects

**Authentication** → **URL Configuration**:

| Setting | Value |
|---------|--------|
| Site URL | `http://localhost:3000` (dev) or your production URL |
| Redirect URLs | `http://localhost:3000/auth/callback`, `http://localhost:3000/auth/update-password`, `http://localhost:3000/auth/confirm` |

## 4. Domain restriction (@devsinc.com)

Enforced in app middleware and OAuth callback:

- Only `*@devsinc.com` emails can stay signed in
- Google OAuth uses `hd=devsinc.com` hint (not sufficient alone — app validates email)

Optional extra lock in Supabase Dashboard → **Authentication** → **Hooks** (advanced).

## 5. Environment variables

Copy `.env.local.example` → `.env.local` and fill:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server only — for seeding default roster)
- `ANTHROPIC_API_KEY`

## 6. Seed engineer roster

1. Sign in with a @devsinc.com account
2. Open **Resume database** → **Seed cloud database** (once, when empty)

## Security summary

| Layer | Protection |
|-------|------------|
| Middleware | Session refresh; redirect unauthenticated users |
| Domain check | Non-@devsinc.com users signed out immediately |
| API routes | `requireAuth()` on all AI/match/convert endpoints |
| RLS | Users read all resources; write/update/delete own rows only |
| Storage | Resume files scoped to `resumes/{user_id}/` |
| Secrets | Service role key server-only; never in client bundle |

## Password reset

1. Login → **Reset password** tab
2. Enter @devsinc.com email
3. Click link in email → set new password on `/auth/update-password`

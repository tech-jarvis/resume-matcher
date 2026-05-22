# Supabase auth & security setup

## 1. Run database migration

In [Supabase Dashboard](https://supabase.com/dashboard) → **SQL Editor**, paste and run:

`supabase/migrations/001_profiles_auth.sql`

## 2. URL configuration (required)

**Authentication** → **URL Configuration**

### Production ([resume-matcher-red-alpha.vercel.app](https://resume-matcher-red-alpha.vercel.app))

| Setting | Value |
|---------|--------|
| **Site URL** | `https://resume-matcher-red-alpha.vercel.app` |
| **Redirect URLs** | Add each line below |

```
https://resume-matcher-red-alpha.vercel.app/auth/callback
https://resume-matcher-red-alpha.vercel.app/auth/callback?next=/auth/update-password
https://resume-matcher-red-alpha.vercel.app/auth/confirm
https://resume-matcher-red-alpha.vercel.app/login
https://resume-matcher-red-alpha.vercel.app/auth/update-password
```

### Local development (optional)

```
http://localhost:3000/auth/callback
http://localhost:3000/auth/callback?next=/auth/update-password
http://localhost:3000/auth/confirm
http://localhost:3000/login
```

**Important:** Email links expire in ~1 hour. If you see `otp_expired`, use **Reset password** on `/login` to get a new link.

## 3. Vercel environment variables

In [Vercel Project Settings → Environment Variables](https://vercel.com), set for **Production**:

| Variable | Value |
|----------|--------|
| `NEXT_PUBLIC_SITE_URL` | `https://resume-matcher-red-alpha.vercel.app` |
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role (server only) |
| `ANTHROPIC_API_KEY` | Anthropic API key |

Redeploy after adding variables.

## 4. Enable Google OAuth

1. **Authentication** → **Providers** → **Google** → Enable
2. Google Cloud OAuth credentials → Authorized redirect URI:  
   `https://<your-project-ref>.supabase.co/auth/v1/callback`

## 5. Domain restriction (@devsinc.com)

Only `*@devsinc.com` accounts can use the app (enforced in middleware + OAuth callback).

## 6. Seed engineer roster

Sign in → **Resume database** → **Seed cloud database** (once, when empty).

# Devsinc Resource Matcher

Match client JDs and requirements to the best Devsinc engineers — powered by Claude.

## Quick start

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.local.example .env.local
# Fill in ANTHROPIC_API_KEY and Supabase keys (see docs/SUPABASE_SETUP.md)

# 3. Run Supabase migration (SQL Editor) — see docs/SUPABASE_SETUP.md

# 4. Enable Google OAuth in Supabase + set redirect URLs

# 5. Run locally
npm run dev
# → Open http://localhost:3000 (sign in with @devsinc.com)
```

**Access:** Only `@devsinc.com` Google or email accounts. See [docs/SUPABASE_SETUP.md](docs/SUPABASE_SETUP.md) for auth configuration.

## Stack

- **Next.js 15** (App Router)
- **Anthropic SDK** for Claude Sonnet
- API key is used **server-side only** via `/app/api/match/route.js` — never exposed to the browser

## Deploy to Vercel

```bash
npm i -g vercel
vercel
# Add ANTHROPIC_API_KEY as an environment variable in Vercel dashboard
# Settings → Environment Variables → ANTHROPIC_API_KEY
```

## Resume converter

Use the **Resume converter** tab to:

- Upload **PDF**, **DOCX**, **DOC**, or **TXT** resumes (up to 10 MB)
- AI extracts and maps content to Devsinc’s standardized profile format
- Download a branded **Word document** (`.docx`) with profile table, summary, stacks, domains, and highlights
- Optionally **Add to database** for matching

## Resume database

Use the **Resume database** tab in the app to:

- View and edit all engineer profiles in a spreadsheet-style table
- Upload `.json`, `.csv`, or text resumes (AI extracts fields from pasted/uploaded text)
- Export your roster as JSON
- Changes persist in your browser (`localStorage`) and are used for matching

To reset to the built-in roster, click **Reset defaults**.

## Adding / updating engineers (source file)

The default roster lives in `lib/resources.js` — each entry has:

```js
{
  id,           // Employee ID
  name,         // Full name
  team,         // Cluster lead
  designation,  // SE / SSE / ATL / TL / etc.
  primary,      // Primary tech stack
  stacks,       // All tech stacks (comma-separated string)
  exp,          // Total experience
  tz,           // Preferred timezone
  industries,   // Industries worked in
  dep,          // Project dependency (High / Normal / Low)
}
```

The resource list is imported by the API route and used as context for Claude.

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

## Resume converter / updater (official template)

Both tabs output the **same two-column Devsinc Word layout** via `lib/devsincResumeDocx/build.js`:

- US Letter (12240×15840 DXA), 0.5″ margins, table **6240 + 3120** DXA
- Left: name, title, summary, work experience, projects (hyperlinks)
- Right: photo placeholder, contact, skills, achievements, certificates, education
- Sidebar `#F6F7F9`, section headings `#4468B1`, Word `LevelFormat.BULLET` bullets

Export the Google Doc to `files/storage/Devsinc_-_Resume_Template_.docx`, then:

```bash
npm run resume:extract-template
npm run resume:generate
npm run resume:validate
```

**Converter:** upload PDF/DOCX/DOC/TXT → `.docx` (+ optional add to matcher DB)  
**Updater:** paste JD + resume → JD-tailored `.docx`

Validation uses Node (`scripts/office/validate.mjs`) — works on Vercel; Python wrappers call the same script locally.

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

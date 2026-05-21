# Devsinc Resource Matcher

Match client JDs and requirements to the best Devsinc engineers — powered by Claude.

## Quick start

```bash
# 1. Install dependencies
npm install

# 2. Set up your Anthropic API key
cp .env.local.example .env.local
# Then edit .env.local and paste your key from https://console.anthropic.com/settings/keys

# 3. Run locally
npm run dev
# → Open http://localhost:3000
```

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

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

## Adding / updating engineers

Edit `lib/resources.js` — each entry has:

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

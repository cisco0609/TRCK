# TRCK

Personal running + strength coach. AI-generated training plans, nutrition targets,
weight tracking, and a drag-to-rearrange weekly planner.

## Deploy to Vercel (the easy way)

1. Push this folder to a new GitHub repo.
2. Go to vercel.com -> New Project -> import the repo.
3. Vercel auto-detects Vite. Leave build settings as default.
4. Before deploying, open **Settings -> Environment Variables** and add:
   - Name: `ANTHROPIC_API_KEY`
   - Value: your key from https://console.anthropic.com
5. Click Deploy. Done.

Your API key lives only on Vercel's server (in /api/claude), never in the
browser, so it can't be stolen from the deployed site.

## Run locally

```
npm install
echo "ANTHROPIC_API_KEY=your-key-here" > .env.local
npm run dev
```

Note: the /api/claude function only runs on Vercel (or `vercel dev`).
For full local testing including plan generation, install the Vercel CLI:

```
npm i -g vercel
vercel dev
```

## How it works

- Frontend: React + Vite, single file at `src/TRCK.jsx`
- Plan generation: calls `/api/claude` (serverless proxy) which holds your key
- Storage: browser localStorage (your data stays on your device)

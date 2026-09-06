# Contributing to JobPulse

Thanks for your interest in contributing! Here's how to get started.

## Development Setup

1. Fork and clone the repo
2. Install dependencies: `npm install`
3. Start Convex: `npx convex dev`
4. Start the dev server: `npm run dev`
5. Open http://localhost:5173

## Environment Variables

Copy `.env.example` to `.env.local` and fill in your API keys:

```
OPENAI_API_KEY=
FIRECRAWL_API_KEY=
AGENTMAIL_API_KEY=
```

## Scripts

| Command | What it does |
|---------|--------------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Type-check + production build |
| `npm run typecheck` | Type-check only |
| `npx convex dev` | Start Convex backend |

## Pull Requests

1. Create a feature branch from `main`
2. Make your changes
3. Run `npm run typecheck` to verify
4. Commit with a clear message
5. Open a PR describing what changed and why

## Code Style

- TypeScript strict mode — no `any` unless unavoidable
- Components go in `src/components/`
- Screens go in `src/screens/`
- Convex functions go in `convex/`
- Keep functions small and focused

## Reporting Issues

Open a GitHub issue or email opeblow2021@gmail.com.

<div align="center">

<img src="./public/favicon.svg" alt="JobPulse logo" width="96" height="96" />

# JobPulse

**Track every application to the offer — in real time.**

> A real-time job application tracker with an AI-powered inbox. Paste a job posting URL and JobPulse scrapes it, extracts the details, and drafts your application checklist. Forward application emails to your own inbox and they're automatically classified, matched to the right job card, and the board updates live.

[Live app](#) · [Demo video](#) · [Build log](./hackathon.md) · [Report an issue](#)

</div>

---

## Badges

<p align="center">
  <img alt="Convex backend" src="https://img.shields.io/badge/Backend-Convex-000000?style=flat-square&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZD0iTTE0LjQgNi4yIGwwIC0wIDAgMCAwIDAgMC41IDQuMiBhMS4yIDEuMiAwIDAgMSAwIDAgbDAgMCAxLjQgMCAwIC0wLjUgMCAtNC4yIDAgaDAgWiBNMTAgMTIgTDEwIDEyIGwwIC0wLjUgMy42IC0xLjQgMCAtMC41IDAgMCBMMTIuMyAyIDExLjggMiA4LjAgNC4yIDguMCAxMiAwaDAgWiAiPjwvcGF0aD48L3N2Zz4=">
  <img alt="React" src="https://img.shields.io/badge/Frontend-React-61DAFB?style=flat-square&logo=react&logoColor=black">
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white">
  <img alt="Vite" src="https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white">
  <img alt="OpenAI" src="https://img.shields.io/badge/AI-OpenAI-412991?style=flat-square&logo=openai&logoColor=white">
  <img alt="Firecrawl" src="https://img.shields.io/badge/Scraping-Firecrawl-000000?style=flat-square">
  <img alt="AgentMail" src="https://img.shields.io/badge/Email-AgentMail-000000?style=flat-square">
  <img alt="license" src="https://img.shields.io/badge/License-MIT-green.svg?style=flat-square">
  <img alt="status" src="https://img.shields.io/badge/status-hackathon%20submission-orange?style=flat-square">
  <img alt="hackathon" src="https://img.shields.io/badge/Hackathon-Convex%20All%20Gas-ffffff?style=flat-square">
</p>

---

## Why JobPulse

Applying to jobs is a mess of scattered browser tabs, email threads you forget to reply to, and spreadsheets that go stale. **JobPulse turns your application pipeline into a living kanban board** that moves itself:

- Paste a **job posting URL** → the job appears on your board, fully parsed.
- Forward recruiter emails to your **own AgentMail inbox** → the right card moves to **Interview** / **Offer** / **Rejected** automatically.
- Tap **AI Coach** on any role → get a tailored fit score, gaps, company intel, and interview prep.
- Track your funnel with **real-time analytics** and follow up from right inside the app.

Everything runs on **Convex** — database, type-safe functions, and live real-time sync — with **OpenAI** generating, **Firecrawl** crawling, and **AgentMail** handling the inbox.

---

## Features

| Feature | What it does |
|---------|--------------|
| **Kanban board** | Drag cards between **Applied → Interview → Offer → Rejected**. Updates sync live across every open tab via Convex subscriptions. |
| **Add-from-URL** | Paste a job posting and **Firecrawl** scrapes it while **OpenAI** extracts company, role, location, salary, and requirements. |
| **Application checklist** | OpenAI drafts a tailored checklist from the actual posting — missing skill? It's in the list. |
| **AI inbox** | Forward application emails to `your@agentmail.to` and they're **classified** (interview / offer / rejected / follow-up) and **matched to the right job card**. |
| **AI Application Coach** | Fit score, skill gaps, company intel, and interview prep for any role. |
| **AI draft replies** | Draft professional follow-up responses and send them straight from the app via AgentMail. |
| **Analytics dashboard** | Response rate, interview/offer/conversion rates, time-to-first-response, company count. |
| **Dark / light mode** | Banker-brown-and-cream aesthetic that keeps the board readable in both. |

---

## Why Convex under the hood

This app leans on Convex as the reactive core, not as a thin wrapper:

- **Schema + indexes** (`convex/schema.ts`) for jobs and emails.
- **Queries, mutations, and actions** — including `addJob`, `coach`, and `sendEmail` actions that call the sponsor APIs.
- **HTTP action** at `/webhook/agentmail` — AgentMail pushes `message.received`, JobPulse classifies and updates the board, all server-side.
- **Real-time subscriptions** — moving a card or receiving an email updates the UI live.
- **`"use node"` actions** run Node runtime for outbound fetch calls.

---

## Tech stack

| Layer | Tech | Role |
|-------|------|------|
| **Backend** | [Convex](https://convex.dev) | Database, functions, real-time sync, HTTP webhooks |
| **Scraping** | [Firecrawl](https://firecrawl.dev) | Converts job posting URLs into structured markdown |
| **AI** | [OpenAI](https://openai.com) | Job extraction, email classification, draft replies, application coaching |
| **Email** | [AgentMail](https://agentmail.to) | Inbound inbox + outbound sending |
| **Frontend** | [React](https://react.dev) + [Vite](https://vite.dev) + [TypeScript](https://typescriptlang.org) | Kanban UI, analytics, theming |

---

## Getting started

### Prerequisites

- [Node.js](https://nodejs.org) 18+
- [Convex](https://convex.dev) account + a project
- API keys for **OpenAI**, **Firecrawl**, and **AgentMail**

### 1. Clone & install

```bash
git clone <your-repo-url>
cd jobpulse
npm install
```

### 2. Run Convex locally

```bash
npx convex dev
```

This starts a local Convex backend and generates the client code.

### 3. Set environment variables

Create `.env.local` (gitignored) for your local Convex deployment, and set the same keys in your Convex project dashboard:

```
OPENAI_API_KEY=<your-openai-key>
FIRECRAWL_API_KEY=<your-firecrawl-key>
AGENTMAIL_API_KEY=<your-agentmail-inbox-key>
```

Set them on Convex too:

```bash
npx convex env set OPENAI_API_KEY <key>
npx convex env set FIRECRAWL_API_KEY <key>
npx convex env set AGENTMAIL_API_KEY <key>
```

> **AgentMail:** update `AGENTMAIL_INBOX` in `convex/ai.ts` to your own inbox address, and point an AgentMail webhook at your deployment's `/webhook/agentmail` endpoint.

### 4. Run the web app

```bash
npm run dev
```

Open <http://localhost:5173>.

---

## Usage

1. **Add a job** — hit *Add job* and paste a job posting URL, or enter company/role manually.
2. **Forward emails** — forward interview/offer/status emails to your AgentMail inbox; the board moves itself.
3. **Coach a role** — open a card and tap **AI Coach** for fit score, gaps, and interview prep.
4. **Follow up** — use *AI draft reply* then send, or write directly.

> **Tip:** for reliable scraping, use job postings on boards like Greenhouse, Ashby, or Lever — LinkedIn postings are not scrapable by Firecrawl.

---

## Testing

```bash
# 41-endpoint integration suite (jobs, emails, webhook, actions, cleanup)
node scripts/test-all.mjs

# assert-based verification with final clean-DB check
node scripts/verify-all.mjs
```

---

## Deployment

This app is hosted on **Convex static hosting** and is meant to be published to a live `convex.site` URL (no localhost demos per hackathon rules).

```bash
npx convex deploy
npm run build
npx convex deploy --type static-site dist   # push the frontend to your convex.site URL
```

---

## Documentation

- **[Build log (hackathon.md)](./hackathon.md)** — the full hacking process the judges read: what we built, the stack, the live URL, and the demo link.

---

## Built for the Convex All Gas Hackathon

This project was built for the [**Convex All Gas Hackathon**](https://www.convex.dev/hackathons/all-gas), sponsored by **OpenAI**, **Firecrawl**, and **AgentMail** — the three services that do real work in the product.

<div align="center">
  <sub>Made with <a href="https://convex.dev">Convex</a> · <a href="https://openai.com">OpenAI</a> · <a href="https://firecrawl.dev">Firecrawl</a> · <a href="https://agentmail.to">AgentMail</a></sub>
</div>

---

## License

MIT

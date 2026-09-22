<div align="center">

<img src="./public/favicon.svg" alt="JobPulse — the ember-pulse JP monogram from the landing page" width="120" height="120" />

# JobPulse

**Track every application to the offer — in real time.**

> A real-time job application tracker with an AI-powered inbox. Paste a job posting URL and JobPulse scrapes it, extracts the details, and drafts your application checklist. Forward application emails to your own inbox and they're automatically classified, matched to the right job card, and the board updates live.

[Live app](https://proficient-sandpiper-540.convex.site) · [Demo video](https://youtu.be/QKOzZZyr1us) · [Build log](./hackathon.md) · [Social proof — post on X](https://x.com/OpeyemiBolatit1/status/2098417133944295846) · [Report an issue](mailto:opeblow2021@gmail.com)

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
  <img alt="CI" src="https://img.shields.io/github/actions/workflow/status/opeblow/jobpulse/ci.yml?branch=main&label=CI&style=flat-square">
  <img alt="status" src="https://img.shields.io/badge/status-hackathon%20submission-orange?style=flat-square">
  <img alt="hackathon" src="https://img.shields.io/badge/Hackathon-Convex%20All%20Gas-ffffff?style=flat-square">
  <img alt="Built with Codex" src="https://img.shields.io/badge/Built_with-Codex%20%2B%20Convex%20Plugin-10001f?style=flat-square&logo=OpenAI&logoColor=white">
</p>

---

## Table of contents

<details>
<summary><b>Click to expand — all sections</b></summary>

| # | Section | What you'll find |
|---|---------|-----------------|
| 1 | [Demo Video](#demo-video--welcometojobpulse) | #WelcomeToJobPulse — end-to-end walkthrough |
| 2 | [Architecture](#architecture) | Full mermaid diagram — data flow across Convex, sponsors, frontend |
| 3 | [Overview](#why-jobpulse) | The problem, the vision, the live app |
| 4 | [Features](#features) | Kanban board, AI inbox, AI Coach, analytics, dark mode |
| 5 | [Sponsor deep dives](#sponsor-deep-dives) | How **Convex**, **OpenAI**, **Firecrawl**, and **AgentMail** work together |
| 5.1 | [Built with Convex](#built-with-convex) | Schema, indexes, queries, mutations, actions, HTTP webhooks, real-time sync |
| 5.2 | [Built with OpenAI](#built-with-openai) | Structured extraction, email classification, AI Coach, draft-reply generation |
| 5.3 | [Built with Firecrawl](#built-with-firecrawl) | Job-posting scraping + multi-URL company-intel crawling |
| 5.4 | [Built with AgentMail](#built-with-agentmail) | Inbound webhook → classification → job matching + durable outbound sends |
| 6 | [Tech stack](#tech-stack) | Full layer-by-layer breakdown |
| 7 | [Getting started](#getting-started) | Clone, run locally, set env vars |
| 8 | [Usage](#usage) | Add jobs, forward emails, coach roles, follow up |
| 9 | [Testing](#testing) | 41-endpoint integration suite + assert-based verification |
| 10 | [Deployment](#deployment) | Deploy backend to Convex, push frontend to `convex.site` |
| 11 | [Documentation](#documentation) | Build log and community files |
| 12 | [File structure](#file-structure) | Where every Convex function and React component lives |
| 13 | [Built for the Convex All Gas Hackathon](#built-for-the-convex-all-gas-hackathon) | Hackathon context, sponsors, and "made with" credits |

</details>

---

## Demo Video — #WelcomeToJobPulse

<video src="https://github.com/user-attachments/assets/626ebfc5-f682-4a77-8aa8-681e39a63880" controls width="100%" style="border-radius: 8px; max-width: 720px;">
  #WelcomeToJobPulse — the full JobPulse experience from job paste to AI Coach
</video>

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
- **`"use node"` actions** run Node runtime for outbound fetch calls (Firecrawl, OpenAI, AgentMail).
- **Built with Codex** using the [Convex plugin](https://www.convex.dev/docs/getting-started/plugins), which scaffolds Convex tables, queries, mutations, and actions via the Convex CLI (`convex dev`, `convex deploy`) integrated into the agent workflow.

---

## Architecture

```mermaid
flowchart TD
    subgraph Frontend
        A[<b>React + Vite UI</b><br/>Kanban board, analytics, coach modal<br/>dark/light mode] -->|useQuery| B
    end

    subgraph Convex[<b>Convex Backend</b><br/>Type-safe functions + real-time DB]
        B[<b>Convex client</b><br/>reactive pub/sub]
        B --> C[<b>Schema</b><br/>jobs + emails tables<br/>7 indexes]

        subgraph Queries
            Q1[<b>jobs.list</b><br/>sorted by updatedAt]
            Q2[<b>emails.list</b><br/>sorted by receivedAt]
            Q3[<b>analytics.get</b><br/>pipeline stats]
        end

        subgraph Mutations
            M1[<b>jobs.create</b><br/>parse + insert card]
            M2[<b>jobs.setColumn</b><br/>drag-and-drop move]
            M3[<b>jobs.patchCoach</b><br/>persist AI Coach output]
            M4[<b>emails.insertProcessed</b><br/>store classified email]
            M5[<b>applyClassificationToJob</b><br/>auto-move card]
        end

        subgraph Actions
            AC1[<b>addJob action</b><br/>scrape + extract]
            AC2[<b>coach action</b><br/>company intel + coaching]
            AC3[<b>sendEmail action</b><br/>outbound + draft]
        end

        subgraph HTTP
            HX[<b>/webhook/agentmail</b><br/>deduplicate → classify → match → move]
        end
    end

    B --> C
    C --> Q1 & Q2 & Q3
    C --> M1 & M2 & M3 & M4 & M5

    subgraph Sponsors
        FC[<b>Firecrawl</b><br/>scrape job URLs<br/>crawl company sites]
        OAI[<b>OpenAI</b><br/>gpt-4o-mini<br/>extraction, classification, coach, draft]
        AM[<b>AgentMail</b><br/>inbound webhook<br/>outbound workpool]
    end

    AC1 -->|scrape| FC
    AC1 -->|JSON extraction| OAI
    AC2 -->|scrape company| FC
    AC2 -->|coaching JSON| OAI
    AC3 -->|draft reply| OAI
    AC3 -->|enqueueSend| AM
    HX -->|classification| OAI
    HX -->|store + match| M4 & M5
    AM -->|POST message.received| HX

    subgraph Components
        COMP1[<b>@convex-dev/static-hosting</b>]
        COMP2[<b>@firecrawl/firecrawl-convex</b>]
        COMP3[<b>@agentmail/convex</b>]
    end

    COMP1 --> B
    COMP2 --> AC1 & AC2
    COMP3 --> HX & AC3

    %% Live updates
    Q1 -.->|real-time| A
    Q2 -.->|real-time| A
    M2 ==>|optimistic| A

    %% Styling
    classDef convex fill:#000,stroke:#000,color:#fff,stroke-width:2px
    classDef sponsor fill:#1a1a1a,stroke:#333,color:#fff,stroke-width:2px
    classDef component fill:#2a2a2a,stroke:#444,color:#fff,stroke-width:1px
    class B,C,Q1,Q2,Q3,M1,M2,M3,M4,M5,AC1,AC2,AC3,HX convex
    class FC,OAI,AM sponsor
    class COMP1,COMP2,COMP3 component
```

---

## Sponsor deep dives

### Built with Convex

Convex is the reactive backbone — database, type-safe functions, real-time sync, and HTTP webhooks all in one platform:

| Convex piece | File | What it does |
|---|---|---|
| **Schema** | `convex/schema.ts` | Two tables — `jobs` (kanban cards) and `emails` (classified inbound) — with typed fields, 7 indexes (`by_column`, `by_updatedAt`, `by_agentmailId`, `by_receivedAt`, `by_job`, etc.), and schema validation on. |
| **Queries** | `convex/jobs.ts:5` `convex/emails.ts:6` `convex/analytics.ts:1` | Live, automatically-cached reads. The board subscribes to `jobs.list` (sorted by `updatedAt`); emails subscribe to `by_receivedAt` desc. Every drag or webhook triggers a re-push to all open tabs. |
| **Mutations** | `convex/jobs.ts:12` `convex/emails.ts:33` | CRUD on jobs + emails. `setColumn` moves a card; `patchCoach` persists AI Coach output; `applyClassificationToJob` auto-moves a card when a classified email arrives. |
| **Actions** | `convex/addJob.ts:22` `convex/coach.ts:11` `convex/sendEmail.ts:8` | Node-runtime functions (`"use node"`) that make outbound HTTP calls to Firecrawl, OpenAI, and AgentMail. Actions run server-side so API keys never reach the browser. |
| **HTTP action** | `convex/http.ts:12` | The `/webhook/agentmail` endpoint receives AgentMail's `message.received` webhook, deduplicates by `agentmailId`, classifies the email with OpenAI, matches it to a job by fuzzy company/role, and patches the board — all server-side in one transaction. |
| **Components** | `convex/convex.config.ts` | Mounts `@convex-dev/static-hosting` (SPA + favicon routes on `convex.site`), `@firecrawl/firecrawl-convex` (durable crawl webhooks), and `@agentmail/convex` (inbound email + outbound workpool). |
| **Real-time sync** | `src/main.tsx` | Frontend uses `useQuery` from `convex/react`. No polling — when a job moves or an email lands, every connected tab updates instantly. |
| **Optimistic updates** | `src/components/Column.tsx` | Drag-and-drop column changes write through Convex mutations but update the UI immediately, so the board feels as snappy as a local app. |

### Built with OpenAI

OpenAI (via `gpt-4o-mini`, configurable as `OPENAI_MODEL`) powers four distinct intelligent workflows — all in `convex/ai.ts:20` as a shared `openAIJSON` helper that returns parsed JSON:

| Workflow | Where | What happens |
|---|---|---|
| **Job extraction** | `convex/addJob.ts:43` | Scraped markdown is sent to OpenAI with a strict JSON schema prompt. The model extracts: company, role, location, salary, source, 3–6 requirements, and a 5–8-item application checklist — all tailored to the specific posting. |
| **Email classification** | `convex/http.ts:59` | Each inbound AgentMail webhook triggers `classifyEmail()` — OpenAI reads the subject + body + sender and returns one of five labels: `interview / offer / rejected / followup / other`, plus the company name and job role for matching. |
| **Company intel** | `convex/coach.ts:131` | After Firecrawl scrapes company pages, OpenAI extracts an "about" summary, tech stack, culture signals, and interview hints — surfacing the same intel a human researcher would dig up manually. |
| **AI Application Coach** | `convex/coach.ts:29` | Combines the job requirements + company intel and produces: a 0–100 **fit score**, a coaching **summary**, 3–6 **gaps** to shore up, 4 **interview question/answer pairs**, and **tactical prep notes**. |
| **Draft replies** | `convex/sendEmail.ts:38` | Given the inbound email + the job context, OpenAI drafts a concise, warm, professional `Re:` reply — the user reviews before it's sent through AgentMail. |

### Built with Firecrawl

Firecrawl (via the `@firecrawl/firecrawl-convex` component) is the data-ingestion layer, called from two actions:

| Use case | File | Detail |
|---|---|---|
| **Job posting scrape** | `convex/addJob.ts:33` | `firecrawl.scrape(ctx, url, { formats: ["markdown"], onlyMainContent: true })` turns any job URL into clean markdown. Falls back gracefully — if scraping fails, OpenAI still extracts what it can from the URL alone. |
| **Company research crawl** | `convex/coach.ts:112` | The Coach fires multiple `firecrawl.scrape()` calls across candidate URLs (`.com`, `/careers`, `/about`, `/jobs`, Wikipedia) and uses the first one with substantive content (> 400 chars) as company intel for the AI Coach. |

All Firecrawl calls go through Convex actions with the API key stored as `FIRECRAWL_API_KEY` — the component also mounts a durable-webhook route at `/firecrawl/webhook` for long-running crawl completion callbacks.

### Built with AgentMail

AgentMail handles the entire email lifecycle — inbound classification and durable outbound sending:

| Function | File | Detail |
|---|---|---|
| **Inbound webhook** | `convex/http.ts:12` | AgentMail POSTs to `/webhook/agentmail` on every `message.received`. The HTTP action deduplicates, extracts sender/subject/body, then hands off to OpenAI for classification and to the job-matching logic so the board auto-moves. |
| **Outbound sends** | `convex/sendEmail.ts:23` | `ctx.runMutation(components.agentmail.lib.enqueueSend, { ... })` enqueues a message through AgentMail's component workpool, which delivers with bounded retries (`retryAttempts: 5`, `initialBackoffMs: 30000`) — no lost follow-ups. |
| **Email storage** | `convex/emails.ts:33` | Every received email is stored in the `emails` table with its classification, summary, and optional link back to the matched `jobs` row. |
| **Inbox config** | `convex/ai.ts:15` | `AGENTMAIL_INBOX` and `AGENTMAIL_INBOX_ID` are set as env vars; the webhook URL is published in the Convex deployment. |

---

## Tech stack

| Layer | Tech | Role |
|-------|------|------|
| **Backend** | [Convex](https://convex.dev) | Database, functions, real-time sync, HTTP webhooks |
| **Scraping** | [Firecrawl](https://firecrawl.dev) | Converts job posting URLs into structured markdown |
| **AI** | [OpenAI](https://openai.com) | Job extraction, email classification, draft replies, application coaching |
| **Email** | [AgentMail](https://agentmail.to) | Inbound inbox + outbound sending |
| **Frontend** | [React](https://react.dev) + [Vite](https://vite.dev) + [TypeScript](https://typescriptlang.org) | Kanban UI, analytics, theming |
| **Build tooling** | [Codex](https://openai.com/codex) + [Convex plugin](https://www.convex.dev/docs/getting-started/plugins) | Agentic dev loop: Convex CLI (`convex dev`/`deploy`), schema/function scaffolding, component wiring |

---

## Getting started

### Prerequisites

- [Node.js](https://nodejs.org) 18+
- [Convex](https://convex.dev) account + a project
- API keys for **OpenAI**, **Firecrawl**, and **AgentMail**

### 1. Clone & install

```bash
git clone https://github.com/opeblow/jobpulse.git
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

## File structure

```text
jobpulse/
├── convex/                    # Convex backend (schema, functions, HTTP)
│   ├── _generated/            # Auto-generated client/server bindings
│   ├── addJob.ts              # Add & parse a job posting
│   ├── ai.ts                  # OpenAI classification + coach helpers
│   ├── analytics.ts           # Funnel analytics queries
│   ├── coach.ts               # AI Coach (fit score, gaps, interview prep)
│   ├── convex.config.ts       # App + static-hosting component wiring
│   ├── emails.ts              # Processed email storage + queries
│   ├── http.ts                # HTTP router: webhook + static routes
│   ├── jobs.ts                # Board queries & mutations
│   ├── schema.ts              # DB schema (jobs, emails)
│   └── sendEmail.ts           # Follow-up email actions
├── src/                       # React + Vite frontend
│   ├── components/            # AddJob, Coach, Column, JobCard, modals, etc.
│   ├── screens/               # Board & Landing screens
│   ├── App.tsx                # App root
│   ├── board.ts               # Kanban board logic
│   ├── main.tsx               # Entry point (Convex client)
│   └── ...                    # Styles & theme
├── .env.example               # Env vars (copy to .env.local)
├── index.html                 # Vite entry HTML
├── JobPulseDemo.mp4           # Demo video
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## Built for the Convex All Gas Hackathon

This project was built for the [**Convex All Gas Hackathon**](https://www.convex.dev/hackathons/all-gas), sponsored by **OpenAI**, **Firecrawl**, and **AgentMail** — the three services that do real work in the product.

<div align="center">
  <sub>Made with <a href="https://openai.com/codex">Codex</a> (with <a href="https://www.convex.dev/docs/getting-started/plugins">Convex plugin</a>) · <a href="https://convex.dev">Convex</a> · <a href="https://openai.com">OpenAI</a> · <a href="https://firecrawl.dev">Firecrawl</a> · <a href="https://agentmail.to">AgentMail</a></sub>
</div>

---

## Community

| File | Description |
|------|-------------|
| [Code of Conduct](./CODE_OF_CONDUCT.md) | Our standards for inclusive participation |
| [Contributing Guide](./CONTRIBUTING.md) | How to set up, develop, and submit a PR |
| [Security Policy](./SECURITY.md) | How to report vulnerabilities responsibly |
| [License](./LICENSE) | MIT |

---

## License

MIT — see [LICENSE](./LICENSE) for details.

## Author

**Mobolaji Opeyemi Bolatito** — [opeblow2021@gmail.com](mailto:opeblow2021@gmail.com)

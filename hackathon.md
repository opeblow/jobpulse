# Hackathon log

- **Project:** JobPulse
- **Event:** Convex All Gas Hackathon
- **What it does:** A real-time job application tracker with an AI-powered inbox. Paste a job posting URL and JobPulse scrapes it with Firecrawl, extracts the details with OpenAI, and drafts a tailored application checklist. Forward application emails to your AgentMail inbox and they're automatically classified (interview / offer / rejected / follow-up), matched to the right job card, and the board updates live. Send follow-up emails directly from the app, or let AI draft professional replies for you. Track your entire pipeline with analytics — response rates, conversion, time-to-interview.
- **Live app:** https://proficient-sandpiper-540.convex.site
- **Demo video:** https://youtu.be/QKOzZZyr1us?si=zmbKeH_yKTgl8Hbk
- **Repo:** https://github.com/opeblow/jobpulse.git
- **Frontend:** React + Vite, deployed on Convex static hosting (convex.site)
- **Convex deployment:** https://proficient-sandpiper-540.convex.site
- **Components:** `static-hosting`, `firecrawl` (@firecrawl/firecrawl-convex), `agentmail` (@agentmail/convex)
- **Convex features:** schema, indexes, queries, mutations, actions, HTTP actions, real-time subscriptions, Convex components
- **Auth:** none (single-user app)
- **AI models:** gpt-4o-mini (configurable via `OPENAI_MODEL`)
- **Started:** 2026-08-28T21:02:26Z
- **Last updated:** 2026-09-20

## Stack

| Layer | Tech | Role |
|-------|------|------|
| Backend | **Convex** | Database, queries, mutations, actions, HTTP webhooks, real-time sync |
| Scraping | **Firecrawl** | Turns job posting URLs into structured markdown |
| AI extraction | **OpenAI** | Extracts job details from scraped content, classifies inbound emails, drafts professional replies + application coaching |
| Email | **AgentMail** | Inbound inbox for application emails, outbound sending for follow-ups |
| Frontend | React + Vite | Kanban board with drag-and-drop, analytics dashboard, dark/light mode |

## How it works

### 1. Add a job (Firecrawl + OpenAI)
- Paste a job posting URL into the modal
- Firecrawl scrapes the page to markdown
- OpenAI extracts company, role, location, salary, requirements, and drafts a tailored application checklist
- The card appears on the board in the "Applied" column

### 2. Inbound email processing (AgentMail + OpenAI)
- Forward application-related emails to `opeyemi-8915@agentmail.to`
- AgentMail webhook fires on `message.received`
- OpenAI classifies the email (interview / offer / rejected / follow-up / other) and extracts company + role
- The email is matched to the correct job card by fuzzy company/role matching
- The board card moves to the correct column automatically — live, no refresh

### 3. Send emails (AgentMail outbound)
- Click "Send email" on any job card to compose and send a follow-up email
- Emails are sent through the AgentMail inbox

### 4. AI draft replies (OpenAI)
- Click "AI draft reply" on any inbound email to have OpenAI draft a professional response
- Review and edit the draft before sending

### 5. Analytics dashboard
- Real-time pipeline stats: response rate, interview rate, offer rate, conversion rate
- Average time-to-first-response tracking
- Company count and email classification breakdown

### 6. Drag-and-drop kanban
- Drag cards between Applied → Interview → Offer → Rejected columns
- Real-time updates propagate to all open tabs via Convex subscriptions

### 7. AI Application Coach (Firecrawl + OpenAI)
- Open any job card and hit "⚡ AI Coach"
- Firecrawl crawls the company's website / careers / about pages to build "Company intel" (what they do, tech stack, culture, interview signals)
- OpenAI combines the job requirements with that research to produce:
  - an **AI fit score** (0-100) shown right on the card
  - a **gap analysis** — the weak points to shore up before applying
  - **likely interview questions** with tailored example answers
  - a tactical prep plan
- Everything persists to the job record in Convex and updates live

## Convex depth at a glance

This is not a thin frontend on a hosted page — Convex is the entire product spine:

- **Schema + indexes** — typed `jobs` and `emails` tables with indexes on column, timestamps, and job references; every board/analytics read is index-backed, not a scan.
- **Queries** — board, analytics, and email lists all read through queries; analytics aggregates (response rate, time-to-first-response) are computed live in Convex.
- **Mutations** — CRUD for jobs/emails, optimistic update on drag-and-drop, classification → job matching flips cards atomically.
- **Actions** — the whole AI pipeline runs server-side: Firecrawl component scrapes → OpenAI extracts → coordinates the coach. Actions stay under the Convex 4s budget by composing component calls + a webhook-driven inbound path instead of one giant blocking call.
- **HTTP action** — AgentMail webhook (`/webhook/agentmail`) ingests inbound mail, classifies it with OpenAI, and drives the board — no client involved.
- **Real-time** — `useQuery` subscriptions push board + analytics updates to every open tab; no polling anywhere.
- **Convex components** — three mounted: `static-hosting` (serves the site), `firecrawl` (`@firecrawl/firecrawl-convex`, used for every scrape instead of raw HTTP), and `agentmail` (`@agentmail/convex`, outbound sends go through its durable workpool with bounded retries). Component tables ship in the same deployment, all visible live.

## File structure

```
jobpulse/
├─ .env.example                # Required API keys template
├─ .gitignore                  # Env, build, and Convex state ignored
├─ index.html                  # Vite entry + favicon links
├─ package.json                # Scripts: dev, build, typecheck, convex:*
├─ tsconfig.json               # TypeScript config
├─ vite.config.ts              # Vite config
├─ README.md                   # Project overview, badges, setup
├─ hackathon.md                # This build log
│
├─ convex/                     # Convex backend
│  ├─ _generated/              # Auto-generated client/server types
│  ├─ convex.config.ts         # App assembly: static-hosting, firecrawl, agentmail components
│  ├─ schema.ts                # Jobs + emails tables, fields, indexes
│  ├─ jobs.ts                  # CRUD mutations + queries for job cards
│  ├─ emails.ts                # Email storage, classification → job matching
│  ├─ addJob.ts                # Action: Firecrawl component scrape + OpenAI extraction
│  ├─ coach.ts                 # Action: AI Application Coach (Firecrawl component intel + coaching)
│  ├─ sendEmail.ts             # Action: AgentMail component durable send + AI draft replies
│  ├─ http.ts                  # HTTP action: AgentMail webhook (/webhook/agentmail)
│  ├─ analytics.ts             # Query: pipeline statistics
│  ├─ ai.ts                    # OpenAI helper + env vars + AgentMail config
│  └─ tsconfig.json
│
├─ src/                        # React frontend
│  ├─ main.tsx                 # Convex client + Toast providers + router
│  ├─ App.tsx                  # Landing / board route switch
│  ├─ board.ts                 # Column definitions, status metadata
│  ├─ theme.tsx                # Dark / light mode context
│  ├─ index.css                # Design tokens (ink, paper, ember, teal)
│  ├─ board.css                # Kanban board + card styles
│  ├─ landing.css              # Marketing screen styles
│  ├─ liveboard.css            # Hero animation styles
│  ├─ screens/
│  │  ├─ Landing.tsx           # Marketing entry screen
│  │  └─ Board.tsx             # Main board + analytics sidebar
│  └─ components/
│     ├─ Column.tsx            # Droppable column with drag-and-drop
│     ├─ JobCard.tsx           # Draggable card + fit-score badge + coach button
│     ├─ AddJobModal.tsx       # URL → Firecrawl → OpenAI pipeline
│     ├─ SendEmailModal.tsx    # Compose + send via AgentMail
│     ├─ DraftReplyModal.tsx   # AI-drafted email replies
│     ├─ CoachModal.tsx        # AI Coach panel (fit score, gaps, interview prep)
│     ├─ ThemeToggle.tsx       # Dark / light switch
│     ├─ Toast.tsx             # Toast notifications
│     └─ LiveBoard.tsx         # Animated SVG hero illustration
│
├─ public/                     # Static assets (favicons, logo)
│  ├─ favicon.svg
│  ├─ favicon-16.png
│  ├─ favicon-32.png
│  ├─ favicon-48.png
│  └─ apple-touch-icon.png
│
└─ scripts/                    # Node tooling
   ├─ test.mjs                 # Core endpoint suite (11 tests)
   ├─ test-all.mjs             # Full integration suite (41 tests)
   ├─ verify-all.mjs           # Assert-based verification (41 checks)
   ├─ seed.mjs                 # Local seed helper
   └─ gen-favicon.mjs          # PNG favicon generator (zlib encoder)
```

## Convex features used

- **Schema validation** with typed fields and indexes
- **Index-based queries** for sorting by column, timestamps, and job reference
- **Mutations** for CRUD operations on jobs and emails
- **Actions** for outbound AI calls (OpenAI extraction, classification, coaching)
- **HTTP actions** for AgentMail webhook endpoint
- **Real-time subscriptions** via `useQuery` — board updates live
- **Optimistic updates** on drag-and-drop column moves
- **Convex components:**
  - `@firecrawl/firecrawl-convex` — every scrape (job postings, AI Coach company intel) runs through the official Firecrawl component instead of raw HTTP
  - `@agentmail/convex` — outbound follow-up emails go through the component's durable send pipeline (its embedded workpool delivers with bounded retries)
  - `@convex-dev/static-hosting` — serves the frontend on convex.site

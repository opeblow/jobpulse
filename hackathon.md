# Hackathon log

- **Project:** JobPulse
- **Event:** Convex All Gas Hackathon
- **What it does:** A real-time job application tracker with an AI-powered inbox. Paste a job posting URL and JobPulse scrapes it with Firecrawl, extracts the details with OpenAI, and drafts a tailored application checklist. Forward application emails to your AgentMail inbox and they're automatically classified (interview / offer / rejected / follow-up), matched to the right job card, and the board updates live. Send follow-up emails directly from the app, or let AI draft professional replies for you. Track your entire pipeline with analytics — response rates, conversion, time-to-interview.
- **Live app:** (deploy before submission)
- **Repo:** (add public GitHub link)
- **Frontend:** React + Vite, deployed on Convex static hosting (convex.site)
- **Convex deployment:** (add deployment URL)
- **Components:** none
- **Convex features:** schema, indexes, queries, mutations, actions, HTTP actions, real-time subscriptions
- **Auth:** none (single-user app)
- **AI models:** gpt-4o-mini (configurable via `OPENAI_MODEL`)
- **Started:** 2026-08-28T21:02:26Z
- **Last updated:** 2026-09-03

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

## File structure

```
convex/
  schema.ts          — Jobs + emails tables with indexes
  jobs.ts            — CRUD mutations and queries for job cards
  emails.ts          — Email storage, classification application
  addJob.ts          — Firecrawl + OpenAI action for adding jobs
  coach.ts           — AI Application Coach (Firecrawl research + OpenAI coaching)
  sendEmail.ts       — AgentMail outbound + AI draft reply actions
  http.ts            — AgentMail webhook handler (inbound email)
  analytics.ts       — Pipeline statistics query
  ai.ts              — OpenAI helper + env vars + AgentMail config

src/
  App.tsx            — Router (landing / board)
  main.tsx           — Convex + Toast providers
  board.ts           — Column definitions, status metadata
  theme.tsx          — Dark/light mode context
  screens/
    Landing.tsx      — Marketing entry screen
    Board.tsx        — Main board with sidebar analytics
  components/
    Column.tsx       — Droppable column with drag-and-drop
    JobCard.tsx      — Draggable card with detail expansion + fit-score badge
    AddJobModal.tsx  — URL input → Firecrawl → OpenAI pipeline
    SendEmailModal.tsx — Compose and send via AgentMail
    DraftReplyModal.tsx — AI-drafted email replies
    CoachModal.tsx   — AI Application Coach panel (fit score, gaps, prep)
    ThemeToggle.tsx  — Dark/light switch
    Toast.tsx        — Toast notification system
    LiveBoard.tsx    — Animated SVG hero illustration
```

## Convex features used

- **Schema validation** with typed fields and indexes
- **Index-based queries** for sorting by column, timestamps, and job reference
- **Mutations** for CRUD operations on jobs and emails
- **Actions** for outbound API calls (Firecrawl, OpenAI, AgentMail)
- **HTTP actions** for AgentMail webhook endpoint
- **Real-time subscriptions** via `useQuery` — board updates live
- **Optimistic updates** on drag-and-drop column moves

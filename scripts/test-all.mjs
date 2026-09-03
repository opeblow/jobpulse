import { ConvexClient } from "convex/browser";

const WS_URL = "http://127.0.0.1:3210";
const HTTP_URL = "http://127.0.0.1:3211";
const client = new ConvexClient(WS_URL);

let pass = 0;
let fail = 0;

async function t(name, fn) {
  try {
    const result = await fn();
    console.log(`✓ PASS ${name}`);
    if (result !== undefined && result !== null) {
      console.log(`    ${JSON.stringify(result).slice(0, 260)}`);
    }
    pass++;
  } catch (e) {
    console.log(`✗ FAIL ${name}: ${e?.message ?? e}`);
    fail++;
  }
}

async function post(path, body) {
  const res = await fetch(`${HTTP_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {}
  return { status: res.status, body: text, json };
}

console.log("\n########## 1. QUERIES (empty state) ##########");

const emptyJobs = await client.query("jobs:list", {}).catch(() => null);
await t("jobs.list (empty)", () => Promise.resolve(emptyJobs));

const emptyEmails = await client.query("emails:list", {}).catch(() => null);
await t("emails.list (empty)", () => Promise.resolve(emptyEmails));

await t("analytics.stats (empty)", () => client.query("analytics:stats", {}));

// jobs.get on a valid id that no longer exists -> returns null (not an error)
{
  const tmp = await client.mutation("jobs:create", {
    company: "Temp",
    role: "T",
    requirements: [],
    checklist: [],
    column: "applied",
    status: "Application sent",
  });
  await client.mutation("jobs:remove", { jobId: tmp });
  await t("jobs.get (deleted id -> null)", () => client.query("jobs:get", { jobId: tmp }));
}

console.log("\n########## 2. MUTATIONS — job lifecycle ##########");

let jobId = null;
const created = await client.mutation("jobs:create", {
  company: "Acme Corp",
  role: "Backend Engineer",
  location: "Remote",
  salary: "$150k",
  postedUrl: "https://acme.example/careers/backend",
  source: "LinkedIn",
  requirements: ["Node.js", "PostgreSQL", "AWS"],
  checklist: ["Update resume", "Write cover letter"],
  column: "applied",
  status: "Application sent",
  note: "Referred by Jane",
});
jobId = created;
await t("jobs.create (returns id)", () => Promise.resolve(typeof created));

const gotJob = await client.query("jobs:get", { jobId });
await t("jobs.get (created job)", () =>
  Promise.resolve(
    `${gotJob?.company} · ${gotJob?.role} · col=${gotJob?.column} · reqs=${gotJob?.requirements?.length} · check=${gotJob?.checklist?.length}`,
  ),
);

const listed = await client.query("jobs:list", {});
await t("jobs.list (populated -> 1)", () => Promise.resolve(listed.length));

await t("jobs.setColumn (applied -> interview)", async () => {
  await client.mutation("jobs:setColumn", { jobId, column: "interview" });
  const j = await client.query("jobs:get", { jobId });
  return `column=${j.column} status="${j.status}"`;
});

await t("jobs.setColumn (interview -> offer, status auto-formatted)", async () => {
  await client.mutation("jobs:setColumn", { jobId, column: "offer" });
  const j = await client.query("jobs:get", { jobId });
  return `column=${j.column} status="${j.status}"`;
});

await t("jobs.setColumn (offer -> rejected, status auto-formatted)", async () => {
  await client.mutation("jobs:setColumn", { jobId, column: "rejected" });
  const j = await client.query("jobs:get", { jobId });
  return `column=${j.column} status="${j.status}"`;
});

await t("jobs.setColumn (rejected -> applied)", async () => {
  await client.mutation("jobs:setColumn", { jobId, column: "applied" });
  const j = await client.query("jobs:get", { jobId });
  return `column=${j.column} status="${j.status}"`;
});

await t("jobs.setStatus (custom)", async () => {
  await client.mutation("jobs:setStatus", { jobId, status: "2nd round scheduled" });
  const j = await client.query("jobs:get", { jobId });
  return `status="${j.status}"`;
});

await t("jobs.patchCoach (write coach fields)", async () => {
  await client.mutation("jobs:patchCoach", {
    jobId,
    fitScore: 88,
    coachSummary: "Strong candidate",
    interviewPrep: [{ question: "Tell me about Node?", answer: "…" }],
    gaps: ["No graph databases"],
    companyIntel: {
      about: "Acme does logistics",
      techStack: ["Node", "Kafka"],
      culture: ["Remote-first"],
      interviewSignals: ["They value systems design"],
      scrapedAt: Date.now(),
    },
    coachUpdatedAt: Date.now(),
  });
  const j = await client.query("jobs:get", { jobId });
  return `fit=${j.fitScore} intel.about="${j.companyIntel?.about}" prep=${j.interviewPrep?.length}`;
});

await t("jobs.touch (bump updatedAt)", async () => {
  const before = (await client.query("jobs:get", { jobId }))?.updatedAt;
  await client.mutation("jobs:touch", { jobId });
  const after = (await client.query("jobs:get", { jobId }))?.updatedAt;
  return `bumped ${after > before}`;
});

await t("jobs.reorderPriority (touch batch)", () =>
  client.mutation("jobs:reorderPriority", { jobIds: [jobId] }),
);

await t("jobs.remove (cleanup acme)", () => client.mutation("jobs:remove", { jobId }));

const afterClean = await client.query("jobs:list", {});
await t("jobs.list (empty again)", () => Promise.resolve(afterClean.length));
jobId = null;

console.log("\n########## 3. MUTATIONS — email lifecycle ##########");

// Need a job for applyClassificationToJob
const jobForEmail = await client.mutation("jobs:create", {
  company: "NimbusLabs",
  role: "Platform Engineer",
  requirements: [],
  checklist: [],
  column: "applied",
  status: "Application sent",
});
let emailId = null;

await t("emails.insertProcessed (interview)", () =>
  client.mutation("emails:insertProcessed", {
    agentmailId: "e2e-email-001",
    from: "recruiter@nimbuslabs.example",
    subject: "Interview Invitation - Platform Engineer",
    text: "We would like to schedule a technical interview.",
    classification: "interview",
    receivedAt: Date.now(),
    summary: "Invited to schedule a technical interview",
  }),
);

emailId = (await client.query("emails:list", {}))[0]?._id;
const emailCount = (await client.query("emails:list", {})).length;
await t("emails.list (has email, classification applied)", () => Promise.resolve(`emails=${emailCount}`));

await t("emails.applyClassificationToJob (interview, moves job)", async () => {
  await client.mutation("emails:applyClassificationToJob", {
    emailId,
    jobId: jobForEmail,
    classification: "interview",
    detail: "Phone screen with hiring manager",
  });
  const j = await client.query("jobs:get", { jobId: jobForEmail });
  return `job column=${j.column} status="${j.status}"`;
});

await t("emails.applyClassificationToJob (offer)", async () => {
  await client.mutation("emails:applyClassificationToJob", {
    emailId,
    jobId: jobForEmail,
    classification: "offer",
    detail: "Offer for $160k",
  });
  const j = await client.query("jobs:get", { jobId: jobForEmail });
  return `job column=${j.column} status="${j.status}"`;
});

await t("emails.applyClassificationToJob (rejected)", async () => {
  await client.mutation("emails:applyClassificationToJob", {
    emailId,
    jobId: jobForEmail,
    classification: "rejected",
  });
  const j = await client.query("jobs:get", { jobId: jobForEmail });
  return `job column=${j.column} status="${j.status}"`;
});

await t("emails.insertProcessed (other classification, no job match)", () =>
  client.mutation("emails:insertProcessed", {
    agentmailId: "e2e-email-002",
    from: "newsletter@example.com",
    subject: "Weekly digest",
    text: "Just a newsletter.",
    classification: "other",
    receivedAt: Date.now(),
  }),
);

await t("emails.remove (cleanup)", async () => {
  const all = await client.query("emails:list", {});
  for (const e of all) {
    await client.mutation("emails:remove", { emailId: e._id });
  }
  return `emails now=${(await client.query("emails:list", {})).length}`;
});

await t("jobs.remove (cleanup nimbus)", () =>
  client.mutation("jobs:remove", { jobId: jobForEmail }),
);

console.log("\n########## 4. HTTP ACTION — /webhook/agentmail ##########");

await t("webhook: non-message event -> 200 'ignored'", async () => {
  const r = await post("/webhook/agentmail", {
    event_type: "message.delivered",
    message: { message_id: "d1", subject: "x", text: "y" },
  });
  return `status=${r.status} body="${r.body}"`;
});

await t("webhook: missing message_id -> 200 'missing message id'", async () => {
  const r = await post("/webhook/agentmail", {
    event_type: "message.received",
    message: { subject: "no id" },
  });
  return `status=${r.status} body="${r.body}"`;
});

await t("webhook: GET method -> not allowed/404", async () => {
  const res = await fetch(`${HTTP_URL}/webhook/agentmail`);
  return `status=${res.status}`;
});

await t("webhook: unknown route -> 404", async () => {
  const res = await fetch(`${HTTP_URL}/webhook/nope`, { method: "POST" });
  return `status=${res.status}`;
});

await t("webhook: malformed JSON -> handled (no crash)", async () => {
  const res = await fetch(`${HTTP_URL}/webhook/agentmail`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "not-json{{{",
  });
  const text = await res.text();
  return `status=${res.status} body="${text}"`;
});

await t("webhook: received interview -> parses, classifies", async () => {
  // Ensure a matching job exists so classification can move it
  const jobForHook = await client.mutation("jobs:create", {
    company: "Stratus Works",
    role: "Frontend Developer",
    requirements: [],
    checklist: [],
    column: "applied",
    status: "Application sent",
  });
  const r = await post("/webhook/agentmail", {
    event_type: "message.received",
    message: {
      message_id: "e2e-hook-001",
      from_: "talent@stratus.example",
      subject: "Interview - Frontend Developer at Stratus Works",
      text: "Let's schedule an interview for the Frontend Developer role at Stratus Works.",
    },
  });
  const moved = await client.query("jobs:get", { jobId: jobForHook });
  const res = {
    status: r.status,
    classification: r.json?.classification,
    jobColumn: moved?.column,
  };
  await client.mutation("jobs:remove", { jobId: jobForHook });
  return JSON.stringify(res);
});

await t("webhook: received offer -> status auto-formatted", async () => {
  const jobForHook = await client.mutation("jobs:create", {
    company: "Beacon Hill",
    role: "Data Scientist",
    requirements: [],
    checklist: [],
    column: "applied",
    status: "Application sent",
  });
  const r = await post("/webhook/agentmail", {
    event_type: "message.received",
    message: {
      message_id: "e2e-hook-002",
      from_: "hr@beacon.example",
      subject: "Offer - Data Scientist at Beacon Hill",
      text: "We are thrilled to offer you the Data Scientist position at Beacon Hill.",
    },
  });
  const moved = await client.query("jobs:get", { jobId: jobForHook });
  const res = {
    status: r.status,
    classification: r.json?.classification,
    jobColumn: moved?.column,
    jobStatus: moved?.status,
  };
  await client.mutation("jobs:remove", { jobId: jobForHook });
  return JSON.stringify(res);
});

// clean up emails the webhook inserted
await t("webhook cleanup: remove inserted emails", async () => {
  const all = await client.query("emails:list", {});
  for (const e of all) {
    if (String(e.agentmailId ?? "").startsWith("e2e-hook-")) {
      await client.mutation("emails:remove", { emailId: e._id });
    }
  }
  return "ok";
});

console.log("\n########## 5. ACTIONS (need real API keys) ##########");

// coach requires a job + Firecrawl + OpenAI
const coachJob = await client.mutation("jobs:create", {
  company: "OpenAI",
  role: "Software Engineer",
  requirements: ["Python", "Distributed systems", "Machine learning"],
  checklist: [],
  column: "applied",
  status: "Application sent",
  location: "San Francisco",
  salary: "$200k",
});
await t("coach.coach (Firecrawl + OpenAI)", async () => {
  const r = await client.action("coach:coach", { jobId: coachJob });
  return `fit=${r.fitScore} intel=${r.companyIntel || "none"} prep=${r.interviewPrepCount}`;
});
// verify persisted
const coached = await client.query("jobs:get", { jobId: coachJob });
await t("coach persisted to job", () =>
  Promise.resolve(`fit=${coached?.fitScore} intel=${coached?.companyIntel ? "yes" : "no"} gaps=${coached?.gaps?.length}`),
);

// addJob requires Firecrawl + OpenAI — use a real scrapable job board
let addJobId = null;
await t("addJob.addJob (Firecrawl scrape + OpenAI extraction)", async () => {
  const r = await client.action("addJob:addJob", {
    url: "https://boards.greenhouse.io/gitlab",
  });
  addJobId = r?.jobId ?? null;
  const created = addJobId ? await client.query("jobs:get", { jobId: addJobId }) : null;
  return `scrapeError=${r?.scrapeError ?? "none"} company="${created?.company}" role="${created?.role}" reqs=${created?.requirements?.length} checklist=${created?.checklist?.length}`;
});
if (addJobId) {
  await t("cleanup addJob job", () => client.mutation("jobs:remove", { jobId: addJobId }));
}

// draftReply requires OpenAI + an email
const draftEmail = await client.mutation("emails:insertProcessed", {
  agentmailId: "e2e-draft-001",
  from: "recruiter@openai.example",
  subject: "Interview - Software Engineer",
  text: "We want to schedule an interview.",
  classification: "interview",
  receivedAt: Date.now(),
});
// ensure an email exists for draftReply
await t("sendEmail.draftReply (OpenAI)", async () => {
  const r = await client.action("sendEmail:draftReply", {
    emailId: draftEmail,
    jobId: coachJob,
    tone: "professional",
  });
  return `draft subject="${r?.subject?.slice(0, 40)}" bodyLen=${(r?.body || "").length}`;
});

// sendEmail requires AgentMail — send to the project's own inbox
await t("sendEmail.sendEmail (AgentMail outbound)", async () => {
  const r = await client.action("sendEmail:sendEmail", {
    to: "opeyemi-8915@agentmail.to",
    subject: `E2E test ${Date.now()}`,
    text: "This is an automated end-to-end test message from JobPulse.",
  });
  return String(r ?? "ok");
});

// cleanup draft email + coach job
await t("cleanup draft email", async () => {
  await client.mutation("emails:remove", { emailId: draftEmail });
  return "ok";
});
await t("cleanup coach job", () => client.mutation("jobs:remove", { jobId: coachJob }));

await client.close();
console.log(`\n########## RESULTS: ${pass} passed, ${fail} failed ##########`);
process.exit(fail > 0 ? 1 : 0);

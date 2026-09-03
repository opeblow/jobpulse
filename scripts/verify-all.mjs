import { ConvexClient } from "convex/browser";

const WS_URL = "http://127.0.0.1:3210";
const HTTP_URL = "http://127.0.0.1:3211";
const client = new ConvexClient(WS_URL);

let pass = 0;
let fail = 0;
const failures = [];

async function check(name, cond, detail) {
  if (cond) {
    console.log(`  ✓ ${name}${detail ? " — " + detail : ""}`);
    pass++;
  } else {
    console.log(`  ✗ ${name}${detail ? " — " + detail : ""}`);
    fail++;
    failures.push(name);
  }
}

async function run(name, fn) {
  console.log(`\n▶ ${name}`);
  try {
    await fn();
  } catch (e) {
    console.log(`  ✗ EXCEPTION in ${name}: ${e?.message ?? e}`);
    fail++;
    failures.push(name);
  }
}

/* ============================================================
   1. QUERIES
   ============================================================ */
await run("QUERY jobs.list", async () => {
  const r = await client.query("jobs:list", {});
  check("jobs.list returns array", Array.isArray(r), `len=${r.length}`);
});

await run("QUERY emails.list", async () => {
  const r = await client.query("emails:list", {});
  check("emails.list returns array", Array.isArray(r), `len=${r.length}`);
});

await run("QUERY analytics.stats", async () => {
  const r = await client.query("analytics:stats", {});
  const required = ["total", "companyCount", "responseRate", "interviewRate", "offerRate"];
  check("analytics.stats has all fields", required.every((k) => k in r), Object.keys(r).join(","));
});

await run("QUERY jobs.get -> null when missing", async () => {
  const tmp = await client.mutation("jobs:create", { company: "T", role: "R", requirements: [], checklist: [], column: "applied", status: "x" });
  await client.mutation("jobs:remove", { jobId: tmp });
  const r = await client.query("jobs:get", { jobId: tmp });
  check("jobs.get returns null for deleted id", r === null);
});

/* ============================================================
   2. JOB MUTATIONS (full lifecycle)
   ============================================================ */
let jobId = null;
await run("MUTATION jobs.create -> full lifecycle", async () => {
  jobId = await client.mutation("jobs:create", {
    company: "Verifly Corp", role: "Full Stack Engineer", location: "Remote",
    salary: "$170k", postedUrl: "https://x.example", source: "HackerNews",
    requirements: ["React", "Node", "AWS"], checklist: ["Tailor resume"],
    column: "applied", status: "Application sent", note: "note",
  });
  check("create returns string id", typeof jobId === "string");

  const j0 = await client.query("jobs:get", { jobId });
  check("created fields persisted", j0?.company === "Verifly Corp" && j0?.requirements?.length === 3, `company=${j0?.company}`);

  await client.mutation("jobs:setColumn", { jobId, column: "interview" });
  const j1 = await client.query("jobs:get", { jobId });
  check("setColumn->interview updates job + status", j1?.column === "interview" && j1?.status === "Interview scheduled", `status="${j1?.status}"`);

  await client.mutation("jobs:setColumn", { jobId, column: "offer" });
  const j2 = await client.query("jobs:get", { jobId });
  check("setColumn->offer", j2?.column === "offer", `status="${j2?.status}"`);

  await client.mutation("jobs:setColumn", { jobId, column: "rejected" });
  const j3 = await client.query("jobs:get", { jobId });
  check("setColumn->rejected", j3?.column === "rejected", `status="${j3?.status}"`);

  await client.mutation("jobs:setColumn", { jobId, column: "applied" });
  const j4 = await client.query("jobs:get", { jobId });
  check("setColumn->applied", j4?.column === "applied");

  await client.mutation("jobs:setStatus", { jobId, status: "Custom update" });
  const j5 = await client.query("jobs:get", { jobId });
  check("setStatus custom", j5?.status === "Custom update");

  await client.mutation("jobs:patchCoach", {
    jobId, fitScore: 91, coachSummary: "s", gaps: ["g1"],
    interviewPrep: [{ question: "q", answer: "a" }],
    companyIntel: { about: "a", techStack: ["t"], culture: ["c"], interviewSignals: ["i"], scrapedAt: Date.now() },
    coachUpdatedAt: Date.now(),
  });
  const j6 = await client.query("jobs:get", { jobId });
  check("patchCoach fitScore persisted", j6?.fitScore === 91, `fit=${j6?.fitScore}`);
  check("patchCoach companyIntel persisted", j6?.companyIntel?.about === "a");

  const before = j6?.updatedAt;
  await new Promise((r) => setTimeout(r, 20));
  await client.mutation("jobs:touch", { jobId });
  const j7 = await client.query("jobs:get", { jobId });
  check("touch bumps updatedAt", j7?.updatedAt > before, `${before} -> ${j7?.updatedAt}`);

  await client.mutation("jobs:reorderPriority", { jobIds: [jobId] });
  check("reorderPriority runs", true);

  await client.mutation("jobs:remove", { jobId });
  const gone = await client.query("jobs:get", { jobId });
  check("remove deletes job", gone === null);
  jobId = null;
});

/* ============================================================
   3. EMAIL MUTATIONS (insert + classify + job move integration)
   ============================================================ */
await run("MUTATION emails lifecycle + integration", async () => {
  const jid = await client.mutation("jobs:create", { company: "Aster Tech", role: "ML Engineer", requirements: [], checklist: [], column: "applied", status: "Application sent" });

  const eid = await client.mutation("emails:insertProcessed", {
    agentmailId: "v-email-1", from: "r@aster.example", subject: "Interview ML Engineer", text: "Interview", classification: "interview", receivedAt: Date.now(), summary: "Invite",
  });
  check("insertProcessed returns email id", typeof eid === "string");

  const list1 = await client.query("emails:list", {});
  check("emails.list shows inserted", list1.some((e) => e._id === eid), `count=${list1.length}`);

  await client.mutation("emails:applyClassificationToJob", { emailId: eid, jobId: jid, classification: "interview", detail: "Phone" });
  const moved = await client.query("jobs:get", { jobId: jid });
  check("applyClassification interview moved job", moved?.column === "interview", `col=${moved?.column}`);

  await client.mutation("emails:applyClassificationToJob", { emailId: eid, jobId: jid, classification: "offer", detail: "Offer" });
  const moved2 = await client.query("jobs:get", { jobId: jid });
  check("applyClassification offer moved job", moved2?.column === "offer", `col=${moved2?.column} status="${moved2?.status}"`);

  await client.mutation("emails:applyClassificationToJob", { emailId: eid, jobId: jid, classification: "rejected" });
  const moved3 = await client.query("jobs:get", { jobId: jid });
  check("applyClassification rejected moved job", moved3?.column === "rejected", `col=${moved3?.column}`);

  await client.mutation("emails:remove", { emailId: eid });
  const list2 = await client.query("emails:list", {});
  check("emails.remove deletes", !list2.some((e) => e._id === eid));

  await client.mutation("jobs:remove", { jobId: jid });
});

/* ============================================================
   4. HTTP WEBHOOK
   ============================================================ */
await run("HTTP webhook POST /webhook/agentmail", async () => {
  const post = async (body) => {
    const res = await fetch(`${HTTP_URL}/webhook/agentmail`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const text = await res.text();
    let json = null; try { json = JSON.parse(text); } catch {}
    return { status: res.status, body: text, json };
  };

  const r0 = await post({ event_type: "message.delivered", message: {} });
  check("non-message event -> 200 ignored", r0.status === 200 && r0.body === "ignored", `status=${r0.status}`);

  const r1 = await post({ event_type: "message.received", message: { subject: "no id" } });
  check("missing message_id -> 200 'missing message id'", r1.status === 200 && r1.body === "missing message id", `"${r1.body}"`);

  // Real processing: creates a job in DB with matching company, then push an email
  const jid = await client.mutation("jobs:create", { company: "Vertex Labs", role: "DevOps Engineer", requirements: [], checklist: [], column: "applied", status: "Application sent" });
  const r2 = await post({
    event_type: "message.received",
    message: { message_id: "v-hook-1", from_: "hr@vertex.example", subject: "Interview DevOps at Vertex Labs", text: "Schedule an interview for DevOps Engineer at Vertex Labs." },
  });
  check("received -> 200 + classified", r2.status === 200 && r2.json?.classification === "interview", `classification=${r2.json?.classification}`);
  const movedJob = await client.query("jobs:get", { jobId: jid });
  check("webhook moved job card to interview", movedJob?.column === "interview", `col=${movedJob?.column}`);
  const emails = await client.query("emails:list", {});
  const hookEmail = emails.find((e) => e.agentmailId === "v-hook-1");
  check("webhook inserted email record", !!hookEmail, `found=${!!hookEmail}`);
  if (hookEmail) await client.mutation("emails:remove", { emailId: hookEmail._id });
  await client.mutation("jobs:remove", { jobId: jid });
});

await run("HTTP webhook robustness", async () => {
  const get = await fetch(`${HTTP_URL}/webhook/agentmail`);
  check("GET -> 404", get.status === 404, `status=${get.status}`);
  const nope = await fetch(`${HTTP_URL}/webhook/nope`, { method: "POST" });
  check("unknown route -> 404", nope.status === 404, `status=${nope.status}`);
  const mal = await fetch(`${HTTP_URL}/webhook/agentmail`, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{bad json" });
  check("malformed json -> 200 no crash", mal.status === 200, `status=${mal.status}`);
});

/* ============================================================
   5. ACTIONS (real sponsor API calls)
   ============================================================ */
await run("ACTION coach.coach (Firecrawl + OpenAI)", async () => {
  const jid = await client.mutation("jobs:create", { company: "OpenAI", role: "Software Engineer", requirements: ["Python", "Distributed systems"], checklist: [], column: "applied", status: "x", location: "SF", salary: "$250k" });
  const r = await client.action("coach:coach", { jobId: jid });
  check("coach returns fitScore number", typeof r.fitScore === "number" && r.fitScore >= 0 && r.fitScore <= 100, `fit=${r.fitScore}`);
  check("coach companyIntel loaded (Firecrawl)", r.companyIntel === "loaded", String(r.companyIntel));
  check("coach generated interview prep", r.interviewPrepCount >= 1, `${r.interviewPrepCount}`);
  const j = await client.query("jobs:get", { jobId: jid });
  check("coach persisted fitScore", j?.fitScore === r.fitScore, `job.fit=${j?.fitScore}`);
  check("coach persisted gaps", Array.isArray(j?.gaps) && j?.gaps.length >= 1, `gaps=${j?.gaps?.length}`);
  await client.mutation("jobs:remove", { jobId: jid });
});

await run("ACTION addJob.addJob (Firecrawl + OpenAI)", async () => {
  const r = await client.action("addJob:addJob", { url: "https://boards.greenhouse.io/gitlab" });
  check("addJob no scrape error", !r?.scrapeError, `scrapeError=${r?.scrapeError ?? "none"}`);
  check("addJob returns jobId", typeof r?.jobId === "string" && r?.jobId);
  const j = await client.query("jobs:get", { jobId: r?.jobId });
  check("addJob created company+role", j?.company && j?.role, `company="${j?.company}" role="${j?.role}"`);
  check("addJob created checklist", Array.isArray(j?.checklist) && j?.checklist.length >= 1, `checklist=${j?.checklist?.length}`);
  if (r?.jobId) await client.mutation("jobs:remove", { jobId: r?.jobId });
});

await run("ACTION sendEmail.draftReply (OpenAI)", async () => {
  const jid = await client.mutation("jobs:create", { company: "Draft Co", role: "Engineer", requirements: [], checklist: [], column: "applied", status: "x" });
  const eid = await client.mutation("emails:insertProcessed", { agentmailId: "v-draft", from: "r@draft.example", subject: "Interview", text: "hi", classification: "interview", receivedAt: Date.now() });
  const r = await client.action("sendEmail:draftReply", { emailId: eid, jobId: jid, tone: "professional" });
  check("draftReply returns subject+body", typeof r?.subject === "string" && typeof r?.body === "string" && r.body.length > 0, `subject="${r?.subject?.slice(0, 30)}" bodyLen=${r?.body?.length}`);
  await client.mutation("emails:remove", { emailId: eid });
  await client.mutation("jobs:remove", { jobId: jid });
});

await run("ACTION sendEmail.sendEmail (AgentMail outbound)", async () => {
  const r = await client.action("sendEmail:sendEmail", { to: "opeyemi-8915@agentmail.to", subject: `UAT ${Date.now()}`, text: "UAT message" });
  check("sendEmail returns messageId", !!r?.messageId, `messageId=${!!r?.messageId} threadId=${!!r?.threadId}`);
});

/* ============================================================
   Final
   ============================================================ */
await client.close();

// verify DB is clean
const finalClient = new ConvexClient(WS_URL);
const fj = await finalClient.query("jobs:list", {});
const fe = await finalClient.query("emails:list", {});
await finalClient.close();

console.log(`\n==============================================`);
console.log(`DONE: ${pass} checks PASSED, ${fail} FAILED`);
if (failures.length) console.log(`Failures: ${failures.join("; ")}`);
console.log(`Final DB state: jobs=${fj.length}, emails=${fe.length}`);
process.exit(fail > 0 ? 1 : 0);

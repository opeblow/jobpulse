import { ConvexClient } from "convex/browser";

const url = "http://127.0.0.1:3210";
const client = new ConvexClient(url);

let pass = 0;
let fail = 0;

async function t(name, fn) {
  try {
    const result = await fn();
    console.log(`✓ PASS ${name}`);
    if (result !== undefined && result !== null) {
      console.log(`    ${JSON.stringify(result).slice(0, 300)}`);
    }
    pass++;
  } catch (e) {
    console.log(`✗ FAIL ${name}: ${e?.message ?? e}`);
    fail++;
  }
}

console.log("=== QUERIES ===");

await t("jobs.list", () => client.query("jobs:list", {}));

const jobs = await client.query("jobs:list", {}).catch(() => []);
const anyJobId = jobs[0]?._id;

if (anyJobId) {
  await t("jobs.get", () => client.query("jobs:get", { jobId: anyJobId }));
}

await t("emails.list", () => client.query("emails:list", {}));
await t("analytics.stats", () => client.query("analytics:stats", {}));

console.log("=== MUTATIONS ===");

let testJobId = null;
await t("jobs.create", async () => {
  testJobId = await client.mutation("jobs:create", {
    company: "Endpoint Test",
    role: "Test Role",
    location: "Remote",
    requirements: ["Req A", "Req B"],
    checklist: ["Check 1", "Check 2"],
    column: "applied",
    status: "Application sent",
  });
  return testJobId;
});

if (testJobId) {
  await t("jobs.setColumn -> interview", () =>
    client.mutation("jobs:setColumn", { jobId: testJobId, column: "interview" }),
  );
  await t("jobs.setStatus", () =>
    client.mutation("jobs:setStatus", { jobId: testJobId, status: "2nd round" }),
  );
  await t("jobs.touch", () => client.mutation("jobs:touch", { jobId: testJobId }));
  await t("jobs.reorderPriority", () =>
    client.mutation("jobs:reorderPriority", { jobIds: jobs.map((j) => j._id) }),
  );
}

// emails: apply classification needs a real job + email
const emails = await client.query("emails:list", {}).catch(() => []);
if (testJobId && emails.length > 0) {
  await t("emails.applyClassificationToJob (interview)", () =>
    client.mutation("emails:applyClassificationToJob", {
      emailId: emails[0]._id,
      jobId: testJobId,
      classification: "interview",
      detail: "Phone screen",
    }),
  );
  // Verify the job moved
  const moved = await client.query("jobs:get", { jobId: testJobId });
  console.log(`    job column now: ${moved?.column}`);
} else {
  console.log(`  (skipped email apply - need email+job)`);
}

// Clean up the test job
if (testJobId) {
  await t("jobs.remove (cleanup)", () => client.mutation("jobs:remove", { jobId: testJobId }));
}

console.log("=== ACTIONS ===");
// addJob requires Firecrawl + OpenAI keys
await t("addJob.addJob (needs keys)", () =>
  client.action("addJob:addJob", { url: "https://example.com/job-posting" }),
);

// draftReply requires OpenAI key
if (anyJobId && emails.length > 0) {
  await t("sendEmail.draftReply (needs OpenAI key)", async () => {
    const r = await client.action("sendEmail:draftReply", {
      emailId: emails[0]._id,
      jobId: anyJobId,
    });
    return { subject: r?.subject };
  });
} else {
  console.log("  (skipped draftReply - need email+job)");
}

// sendEmail requires AgentMail key
await t("sendEmail.sendEmail (needs AgentMail key)", () =>
  client.action("sendEmail:sendEmail", {
    to: "test@example.com",
    subject: "Test",
    text: "Test body",
  }),
);

await client.close();
console.log(`\n=== RESULTS: ${pass} passed, ${fail} failed ===`);
process.exit(fail > 0 ? 1 : 0);
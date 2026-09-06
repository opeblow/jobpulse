import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";
import { openAIJSON, truncate } from "./ai";

const http = httpRouter();

http.route({
  path: "/webhook/agentmail",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    let raw = "";
    try {
      raw = await request.text();
    } catch {
      // fall through with empty body
    }
    const payload = parseJSON(raw);

    const eventType = payload?.event_type ?? payload?.type ?? "";
    if (!eventType.startsWith("message.received")) {
      // Ignore delivery, sent, bounce, etc. to avoid processing loops.
      return new Response("ignored", { status: 200 });
    }

    const message = payload?.message ?? {};
    const agentmailId = (message.message_id ?? payload?.event_id ?? "").toString();
    if (!agentmailId) {
      return new Response("missing message id", { status: 200 });
    }

    const existing = await ctx.runQuery(api.emails.getByAgentmailId, { agentmailId });
    if (existing) {
      return jsonResponse({ ok: true, deduped: true });
    }

    const from = extractSender(message) ?? "";
    const subject = (message.subject ?? "").toString();
    const threadId = (message.thread_id ?? message.threadId ?? "").toString() || undefined;
    const bodyText =
      (message.text ?? "").toString() ||
      stripHtml((message.html ?? "").toString()) ||
      (message.preview ?? "").toString();

    let classification:
      | "interview"
      | "offer"
      | "rejected"
      | "followup"
      | "other" = "other";
    let summary = "";
    let emailCompany = "";
    let emailRole = "";
    try {
      const parsed = await classifyEmail({ subject, body: bodyText, from });
      classification = normalizeClassification(parsed.classification);
      summary = (parsed.summary ?? "").toString().slice(0, 300);
      emailCompany = (parsed.company ?? "").toString().trim();
      emailRole = (parsed.role ?? "").toString().trim();
    } catch (e: any) {
      console.error("Email classification failed:", e?.message ?? e);
    }

    const emailId = await ctx.runMutation(api.emails.insertProcessed, {
      agentmailId,
      from,
      subject,
      threadId,
      text: truncate(bodyText, 4000) || undefined,
      classification,
      summary,
      receivedAt: Date.now(),
    });

    // Match against known jobs by company, then use role only when no company was extracted.
    const jobs = await ctx.runQuery(api.jobs.list);
    const match = matchJob(jobs, emailCompany, emailRole);
    if (match) {
      let detail: string | undefined;
      if (classification === "interview") {
        detail = summary.length > 0 ? summary : undefined;
      } else if (classification === "offer") {
        detail = summary.length > 0 ? summary : undefined;
      } else if (classification === "rejected") {
        detail = summary.length > 0 ? summary : undefined;
      }
      await ctx.runMutation(api.emails.applyClassificationToJob, {
        emailId,
        jobId: match._id,
        classification,
        detail,
      });
    }

    return new Response(JSON.stringify({ ok: true, classification }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }),
});

export default http;

async function classifyEmail({
  subject,
  body,
  from,
}: {
  subject: string;
  body: string;
  from: string;
}): Promise<{ classification?: string; company?: string; role?: string; summary?: string }> {
  const system = `You classify email messages that arrive in a job-application inbox. The user applies to jobs and forwards application emails (confirmations, interview invites, offers, rejections, follow-up reminders) to this inbox for automated tracking.
Return ONLY JSON with these keys:
- "classification": one of exactly "interview" (interview/phone screen/call scheduled), "rejected" (application or after-interview rejection), "offer" (job offer), "followup" (a reminder that the user should follow up on an application), "other" (anything else, like newsletters or confirmation of receipt that warrants no board change)
- "company": the company the email is about, as a plain name, or "" if not a job-related email
- "role": the job role/title if stated, or ""
- "summary": one short, plain-English line about what this email means for the applicant
Confirmation-of-receipt emails that don't indicate movement should be "other". Never invent facts.`;
  const result = await openAIJSON(
    system,
    `From: ${from}\nSubject: ${subject}\n\nBody:\n${truncate(body, 6000)}`,
  );
  return result;
}

function normalizeClassification(value: unknown): "interview" | "offer" | "rejected" | "followup" | "other" {
  const s = String(value ?? "").toLowerCase().trim();
  if (s.includes("interview")) return "interview";
  if (s.includes("offer")) return "offer";
  if (s.includes("rejected") || s.includes("rejection")) return "rejected";
  if (s.includes("follow") || s.includes("followup")) return "followup";
  return "other";
}

function extractSender(message: any): string | null {
  const fromField = message.from_ ?? message.from ?? message.sender;
  if (!fromField) return null;
  const s = String(fromField).trim();
  const match = s.match(/<([^>]+)>/);
  return match ? match[1] : s;
}

const KNOWN_SEPARATORS = /[.,/#!$%^&*;:{}=\-_`~()@<>]/g;

function normalizeName(s: string): string {
  return s.toLowerCase().replace(KNOWN_SEPARATORS, "").replace(/\s+/g, " ").trim();
}

function fuzzyIncludes(haystack: string, needle: string): boolean {
  if (!haystack || !needle) return false;
  const h = normalizeName(haystack);
  const n = normalizeName(needle);
  if (!h || !n) return false;
  return h.includes(n) || n.includes(h);
}

function matchJob(
  jobs: Array<{ _id: any; company: string; role: string }>,
  emailCompany: string,
  emailRole: string,
): { _id: any } | null {
  for (const job of jobs) {
    if (emailCompany && fuzzyIncludes(job.company, emailCompany)) return job;
  }
  if (!emailCompany) {
    for (const job of jobs) {
      if (emailRole && fuzzyIncludes(job.role, emailRole)) return job;
    }
  }
  return null;
}

function jsonResponse(payload: Record<string, unknown>): Response {
  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

function parseJSON(text: string): any {
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return {};
  }
}

function stripHtml(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

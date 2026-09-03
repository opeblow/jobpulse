"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { api } from "./_generated/api";
import { envVar, AGENTMAIL_INBOX_ID, truncate, openAIJSON } from "./ai";

export const sendEmail = action({
  args: {
    to: v.string(),
    subject: v.string(),
    text: v.string(),
    jobId: v.optional(v.id("jobs")),
  },
  handler: async (_ctx, { to, subject, text }) => {
    const apiKey = envVar("AGENTMAIL_API_KEY");
    const inboxId = AGENTMAIL_INBOX_ID;

    const res = await fetch(
      `https://api.agentmail.to/v0/inboxes/${encodeURIComponent(inboxId)}/messages/send`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          to,
          subject,
          text: truncate(text, 4000),
        }),
      },
    );

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`AgentMail send failed (${res.status}): ${body.slice(0, 500)}`);
    }

    const data: any = await res.json();
    return { messageId: data.message_id, threadId: data.thread_id };
  },
});

export const draftReply = action({
  args: {
    emailId: v.id("emails"),
    jobId: v.id("jobs"),
    tone: v.optional(v.string()),
  },
  handler: async (
    ctx,
    { emailId, jobId, tone },
  ): Promise<{ subject: string; body: string }> => {
    const emailDoc = await ctx.runQuery(api.emails.list);
    const email = emailDoc.find((e: any) => e._id === emailId);
    if (!email) throw new Error("Email not found");

    const jobDoc = await ctx.runQuery(api.jobs.get, { jobId });

    const system = `You are a professional job-application assistant. Draft a concise, warm, professional email reply for a job applicant.
Context: The applicant is applying for a role. An email arrived about their application.
Write the reply as if from the applicant. Keep it under 200 words. Be specific to the context.
Return ONLY JSON with these keys:
- "subject": a reply subject line (with "Re: " prefix)
- "body": the full email body text`;

    const context = [
      `Email received: "${email.subject}"`,
      email.from ? `From: ${email.from}` : "",
      email.text ? `\nEmail body:\n${email.text.slice(0, 2000)}` : "",
      email.summary ? `\nSummary: ${email.summary}` : "",
      jobDoc ? `\nJob: ${jobDoc.role} at ${jobDoc.company}` : "",
      tone ? `\nTone: ${tone}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    const parsed = await openAIJSON(system, truncate(context, 4000));

    return {
      subject: parsed.subject || `Re: ${email.subject}`,
      body: parsed.body || "",
    };
  },
});

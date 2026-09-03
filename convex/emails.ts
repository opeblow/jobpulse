import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { Column, EmailClassification } from "./schema";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return ctx.db.query("emails").withIndex("by_receivedAt").order("desc").take(50);
  },
});

export const remove = mutation({
  args: { emailId: v.id("emails") },
  handler: async (ctx, { emailId }) => {
    await ctx.db.delete(emailId);
  },
});

export const insertProcessed = mutation({
  args: {
    agentmailId: v.string(),
    from: v.string(),
    subject: v.string(),
    text: v.optional(v.string()),
    classification: v.union(
      v.literal("interview"),
      v.literal("offer"),
      v.literal("rejected"),
      v.literal("followup"),
      v.literal("other"),
    ),
    summary: v.optional(v.string()),
    receivedAt: v.number(),
  },
  handler: async (ctx, args) => {
    return ctx.db.insert("emails", {
      agentmailId: args.agentmailId,
      from: args.from,
      subject: args.subject,
      text: args.text,
      classification: args.classification,
      summary: args.summary,
      receivedAt: args.receivedAt,
    });
  },
});

export const applyClassificationToJob = mutation({
  args: {
    emailId: v.id("emails"),
    jobId: v.id("jobs"),
    classification: v.union(
      v.literal("interview"),
      v.literal("offer"),
      v.literal("rejected"),
      v.literal("followup"),
      v.literal("other"),
    ),
    detail: v.optional(v.string()),
  },
  handler: async (ctx, { emailId, jobId, classification, detail }) => {
    const [job, email] = await Promise.all([ctx.db.get(jobId), ctx.db.get(emailId)]);
    if (!job || !email) return;

    const now = Date.now();
    let column = job.column as Column;
    let status = job.status;

    if (classification === "interview") {
      column = "interview";
      status = detail ? detail : "Interview scheduled";
    } else if (classification === "offer") {
      column = "offer";
      status = detail ? `Offer — ${detail}` : "Offer received";
    } else if (classification === "rejected") {
      column = "rejected";
      status = detail ? `Not selected — ${detail}` : "Not selected";
    } else if (classification === "followup") {
      status = "Needs follow-up";
    }

    await ctx.db.patch(jobId, { column, status, updatedAt: now });
    await ctx.db.patch(emailId, { jobId });
  },
});

export function classifyToColumn(classification: EmailClassification): Column | null {
  switch (classification) {
    case "interview":
      return "interview";
    case "offer":
      return "offer";
    case "rejected":
      return "rejected";
    default:
      return null;
  }
}

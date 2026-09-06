import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { columnStatus } from "./jobs";
import type { Column } from "./schema";

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
export const getByAgentmailId = query({
  args: { agentmailId: v.string() },
  handler: async (ctx, { agentmailId }) => {
    return ctx.db
      .query("emails")
      .withIndex("by_agentmailId", (q) => q.eq("agentmailId", agentmailId))
      .first();
  },
});

export const get = query({
  args: { emailId: v.id("emails") },
  handler: async (ctx, { emailId }) => ctx.db.get(emailId),
});

export const insertProcessed = mutation({
  args: {
    agentmailId: v.string(),
    from: v.string(),
    subject: v.string(),
    threadId: v.optional(v.string()),
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
      threadId: args.threadId,
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
      status = columnStatus(column, detail);
    } else if (classification === "offer") {
      column = "offer";
      status = columnStatus(column, detail);
    } else if (classification === "rejected") {
      column = "rejected";
      status = columnStatus(column, detail);
    } else if (classification === "followup") {
      status = "Needs follow-up";
    }

    await ctx.db.patch(jobId, {
      column,
      status,
      lastStatusChangeAt: now,
      updatedAt: now,
    });
    await ctx.db.patch(emailId, { jobId });
  },
});


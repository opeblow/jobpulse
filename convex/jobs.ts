import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { columns } from "./schema";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return ctx.db.query("jobs").withIndex("by_updatedAt").order("desc").collect();
  },
});

export const create = mutation({
  args: {
    company: v.string(),
    role: v.string(),
    location: v.optional(v.string()),
    salary: v.optional(v.string()),
    postedUrl: v.optional(v.string()),
    source: v.optional(v.string()),
    requirements: v.array(v.string()),
    checklist: v.array(v.string()),
    column: v.union(
      v.literal("applied"),
      v.literal("interview"),
      v.literal("offer"),
      v.literal("rejected"),
    ),
    status: v.string(),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return ctx.db.insert("jobs", {
      company: args.company,
      role: args.role,
      location: args.location,
      salary: args.salary,
      postedUrl: args.postedUrl,
      source: args.source,
      requirements: args.requirements,
      checklist: args.checklist,
      column: args.column,
      status: args.status,
      note: args.note,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const reorderPriority = mutation({
  args: { jobIds: v.array(v.id("jobs")) },
  handler: async (ctx, { jobIds }) => {
    const now = Date.now();
    for (const jobId of jobIds) {
      await ctx.db.patch(jobId, { updatedAt: now });
    }
  },
});

export const get = query({
  args: { jobId: v.id("jobs") },
  handler: async (ctx, { jobId }) => {
    return ctx.db.get(jobId);
  },
});

export const setColumn = mutation({
  args: {
    jobId: v.id("jobs"),
    column: v.union(
      v.literal("applied"),
      v.literal("interview"),
      v.literal("offer"),
      v.literal("rejected"),
    ),
  },
  handler: async (ctx, { jobId, column }) => {
    const job = await ctx.db.get(jobId);
    if (!job) {
      throw new Error(`No job with id ${jobId}`);
    }
    const status = columnStatus(column, undefined);
    await ctx.db.patch(jobId, {
      column,
      status,
      updatedAt: Date.now(),
    });
  },
});

export const setStatus = mutation({
  args: {
    jobId: v.id("jobs"),
    status: v.string(),
  },
  handler: async (ctx, { jobId, status }) => {
    const job = await ctx.db.get(jobId);
    if (!job) {
      throw new Error(`No job with id ${jobId}`);
    }
    await ctx.db.patch(jobId, { status, updatedAt: Date.now() });
  },
});

export const remove = mutation({
  args: { jobId: v.id("jobs") },
  handler: async (ctx, { jobId }) => {
    await ctx.db.delete(jobId);
  },
});

export const touch = mutation({
  args: { jobId: v.id("jobs") },
  handler: async (ctx, { jobId }) => {
    await ctx.db.patch(jobId, { updatedAt: Date.now() });
  },
});

export const patchCoach = mutation({
  args: {
    jobId: v.id("jobs"),
    fitScore: v.optional(v.number()),
    coachSummary: v.optional(v.string()),
    interviewPrep: v.optional(
      v.array(
        v.object({
          question: v.string(),
          answer: v.string(),
        }),
      ),
    ),
    gaps: v.optional(v.array(v.string())),
    companyIntel: v.optional(
      v.object({
        about: v.optional(v.string()),
        techStack: v.optional(v.array(v.string())),
        culture: v.optional(v.array(v.string())),
        interviewSignals: v.optional(v.array(v.string())),
        source: v.optional(v.string()),
        scrapedAt: v.optional(v.number()),
      }),
    ),
    coachUpdatedAt: v.number(),
  },
  handler: async (ctx, { jobId, ...patch }) => {
    await ctx.db.patch(jobId, { ...patch, updatedAt: Date.now() });
  },
});

function columnStatus(
  column: (typeof columns)[number],
  detail: string | undefined,
): string {
  switch (column) {
    case "applied":
      return "Application sent";
    case "interview":
      return detail ? `Interview ${detail}` : "Interview scheduled";
    case "offer":
      return detail ? `Offer — ${detail}` : "Offer received";
    case "rejected":
      return detail ? `Not selected${detail ? ` (${detail})` : ""}` : "Not selected";
  }
}

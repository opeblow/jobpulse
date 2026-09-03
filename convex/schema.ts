import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export const columns = [
  "applied",
  "interview",
  "offer",
  "rejected",
] as const;
export type Column = (typeof columns)[number];

export const emailClassifications = [
  "interview",
  "offer",
  "rejected",
  "followup",
  "other",
] as const;
export type EmailClassification = (typeof emailClassifications)[number];

export default defineSchema(
  {
    jobs: defineTable({
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
      createdAt: v.number(),
      updatedAt: v.number(),
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
      coachUpdatedAt: v.optional(v.number()),
    })
      .index("by_column", ["column"])
      .index("by_createdAt", ["createdAt"])
      .index("by_updatedAt", ["updatedAt"]),

    emails: defineTable({
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
      jobId: v.optional(v.id("jobs")),
      receivedAt: v.number(),
    })
      .index("by_agentmailId", ["agentmailId"])
      .index("by_receivedAt", ["receivedAt"])
      .index("by_job", ["jobId"]),
  },
  { schemaValidation: true },
);

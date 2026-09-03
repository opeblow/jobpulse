"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { api } from "./_generated/api";
import { envVar, openAIJSON, truncate } from "./ai";

const SCRAPE_PROMPT = `You are an expert job-posting analyst. From the job posting content provided, extract structured data.
Return ONLY JSON with these exact keys:
- "company": company name as a string (or "" if unknown)
- "role": the job title
- "location": work location, including remote/hybrid terms if present (or "" if unknown)
- "salary": the salary range or compensation as a short string if mentioned, else "" (never invent)
- "source": the platform/site the job was found on if derivable (e.g. "LinkedIn", "Greenhouse", "" if unknown)
- "requirements": array of 3-6 short strings summarizing the key requirements/qualifications
- "checklist": array of 5-8 short concrete action items the applicant should do to put together a strong, tailored application for THIS specific role. Write them as actions a person controls ("Tailor your resume to call out X", "Draft a cover letter that leads with Y"), not as system instructions. They are stored and shown to the applicant as a to-do checklist.
Rules: be concise, never invent facts not present, keep all strings plain and readable.`;

export const addJob = action({
  args: {
    url: v.string(),
  },
  handler: async (
    ctx,
    { url },
  ): Promise<{ jobId: string; scrapeError: string | undefined }> => {
    const firecrawlKey = envVar("FIRECRAWL_API_KEY");

    let markdown = "";
    let scrapeError: string | undefined;
    try {
      markdown = await scrapeJob(url, firecrawlKey);
    } catch (e: any) {
      scrapeError = e?.message ?? String(e);
      markdown = "";
    }

    const parsed = await openAIJSON(
      SCRAPE_PROMPT,
      `Job posting source:\nURL: ${url}\n\nScraped content:\n${truncate(markdown || (scrapeError ? "Could not be scraped." : "No content."), 14000)}`,
    );

    const company: string = parsed.company ?? "Unknown company";
    const role: string = parsed.role ?? "Untitled role";
    const location: string = parsed.location ?? "";
    const salary: string = parsed.salary ?? "";
    const source: string = parsed.source ?? "";
    const requirements: string[] = Array.isArray(parsed.requirements)
      ? parsed.requirements.map((r: unknown) => String(r)).slice(0, 6)
      : [];
    const checklist: string[] = Array.isArray(parsed.checklist)
      ? parsed.checklist.map((c: unknown) => String(c)).slice(0, 8)
      : [];

    const jobId = await ctx.runMutation(api.jobs.create, {
      company,
      role,
      location: location || undefined,
      salary: salary || undefined,
      postedUrl: url,
      source: source || undefined,
      requirements,
      checklist,
      column: "applied",
      status: "Application sent",
      note: scrapeError ? `Could not scrape the posting (${scrapeError}); details added from title only.` : undefined,
    });

    return { jobId, scrapeError };
  },
});

async function scrapeJob(url: string, key: string): Promise<string> {
  const res = await fetch("https://api.firecrawl.dev/v1/scrape", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      url,
      formats: ["markdown"],
      onlyMainContent: true,
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Firecrawl scrape failed (${res.status}): ${body.slice(0, 300)}`);
  }
  const data: any = await res.json();
  if (!data?.success) {
    throw new Error(data?.error ?? "Firecrawl could not scrape the page.");
  }
  return data?.data?.markdown ?? "";
}

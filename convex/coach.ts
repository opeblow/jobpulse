"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { api } from "./_generated/api";
import { envVar, truncate, openAIJSON } from "./ai";

export const coach = action({
  args: {
    jobId: v.id("jobs"),
  },
  handler: async (ctx, { jobId }) => {
    const job: any = await ctx.runQuery(api.jobs.get, { jobId });
    if (!job) throw new Error("Job not found");

    // 1. Firecrawl company intel
    let intel: any = null;
    let intelNote = "";
    try {
      intel = await fetchCompanyIntel(job);
    } catch (e: any) {
      intelNote = `Company research unavailable: ${e?.message ?? e}`;
    }

    // 2. OpenAI coaching engine
    const system = `You are a senior career coach and interview expert for software/tech job seekers.
Given a job, its requirements, and (optionally) research about the company, produce tailored coaching.
Return ONLY JSON with these EXACT keys:
- "fitScore": an integer 0-100 estimating how strong a generic candidate's fit is to this role based on the requirements' difficulty and the role's seniority
- "summary": one short paragraph (2-3 sentences) of coaching advice on how to approach this application
- "gaps": array of 3-6 short strings naming likely gaps or weak points the candidate should shore up before applying/interviewing
- "interviewPrep": array of exactly 4 objects, each { "question", "answer" }, with realistic likely interview questions for THIS role and short example answers (1-3 sentences each)
- "prepNotes": a short string of tactical prep guidance (what to research, what to bring, what to practice)
Rules: be concrete and role-specific, never generic fluff. Keep answers concise.`;

    const context = [
      `Role: ${job.role} at ${job.company}`,
      job.location ? `Location: ${job.location}` : "",
      job.salary ? `Compensation: ${job.salary}` : "",
      job.source ? `Source: ${job.source}` : "",
      `Requirements:\n${(job.requirements || []).map((r: string) => `- ${r}`).join("\n") || "(none listed)"}`,
      intel ? `\nCompany research:\n- About: ${intel.about || "n/a"}\n- Tech stack: ${(intel.techStack || []).join(", ") || "n/a"}\n- Culture: ${(intel.culture || []).join("; ") || "n/a"}\n- Interview signals: ${(intel.interviewSignals || []).join("; ") || "n/a"}` : "",
      intelNote ? `\nNote: ${intelNote}` : "",
    ]
      .filter(Boolean)
      .join("\n\n");

    const parsed = await openAIJSON(system, truncate(context, 10000));

    const interviewPrep = Array.isArray(parsed.interviewPrep)
      ? parsed.interviewPrep
          .map((q: any) => ({
            question: String(q.question ?? "").slice(0, 200),
            answer: String(q.answer ?? "").slice(0, 600),
          }))
          .filter((q: any) => q.question)
          .slice(0, 6)
      : [];
    const gaps = Array.isArray(parsed.gaps)
      ? parsed.gaps.map((g: unknown) => String(g)).slice(0, 8)
      : [];
    const fitScore = Math.max(
      0,
      Math.min(100, parseInt(String(parsed.fitScore ?? 50), 10) || 50),
    );

    const companyIntel =
      intel && (intel.about || intel.techStack?.length || intel.culture?.length || intel.interviewSignals?.length)
        ? {
            about: intel.about,
            techStack: intel.techStack,
            culture: intel.culture,
            interviewSignals: intel.interviewSignals,
            source: intel.source,
            scrapedAt: Date.now(),
          }
        : undefined;

    await ctx.runMutation(api.jobs.patchCoach, {
      jobId,
      fitScore,
      coachSummary: (parsed.summary ?? "").toString().slice(0, 500),
      interviewPrep,
      gaps,
      companyIntel,
      coachUpdatedAt: Date.now(),
    });

    return {
      fitScore,
      summary: parsed.summary,
      gaps,
      interviewPrepCount: interviewPrep.length,
      prepNotes: parsed.prepNotes,
      companyIntel: companyIntel ? "loaded" : undefined,
      intelNote,
    };
  },
});

async function fetchCompanyIntel(job: any): Promise<any> {
  const firecrawlKey = envVar("FIRECRAWL_API_KEY");
  const company = job.company;
  const domain = deriveDomain(company);

  // Try the company's own website first, then a generic search-style scrape.
  let goodMarkdown = "";
  for (const url of candidateUrls(company, domain)) {
    try {
      const md = await scrape(url, firecrawlKey);
      if (md && md.length > 400) {
        goodMarkdown = md;
        break;
      }
    } catch {
      // try next url
    }
  }

  if (!goodMarkdown) {
    throw new Error("Could not find company pages to scrape.");
  }

  const system = `You are an analyst. From the company web content provided, extract concise facts about the company for a job applicant's research.
Return ONLY JSON with these EXACT keys:
- "about": 1-2 sentence plain-English summary of what the company does
- "techStack": array of strings naming technologies/tools the company appears to use (may be empty)
- "culture": array of 2-4 short strings describing culture/values signals (may be empty)
- "interviewSignals": array of 2-4 short strings with hints useful for interviewing (what they seem to value, hiring language, etc.) (may be empty)
Be honest: only include what's actually in the content. Keep values short and plain.`;

  const parsed = await openAIJSON(system, truncate(goodMarkdown, 12000));

  return {
    about: (parsed.about ?? "").toString(),
    techStack: Array.isArray(parsed.techStack) ? parsed.techStack.map((t: unknown) => String(t)).slice(0, 12) : [],
    culture: Array.isArray(parsed.culture) ? parsed.culture.map((c: unknown) => String(c)).slice(0, 6) : [],
    interviewSignals: Array.isArray(parsed.interviewSignals)
      ? parsed.interviewSignals.map((s: unknown) => String(s)).slice(0, 6)
      : [],
    source: goodMarkdown.slice(0, 40),
  };
}

function deriveDomain(company: string): string {
  const slug = company
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .replace(/^(the|inc|labs|data|ai|tech|systems)$/g, "");
  return slug || "unknown";
}

function candidateUrls(company: string, domain: string): string[] {
  const base = `https://${encodeURIComponent(domain)}.com`;
  return [
    base,
    `${base}/careers`,
    `${base}/about`,
    `${base}/jobs`,
    `https://www.${encodeURIComponent(domain)}.com/careers`,
    `https://en.wikipedia.org/wiki/${encodeURIComponent(company.replace(/\s+/g, "_"))}`,
  ];
}

async function scrape(url: string, key: string): Promise<string> {
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
    throw new Error(`Firecrawl failed (${res.status}) for ${url}`);
  }
  const data: any = await res.json();
  if (!data?.success || !data?.data?.markdown) {
    throw new Error(`No content for ${url}`);
  }
  return data.data.markdown;
}

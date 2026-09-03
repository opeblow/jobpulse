import { query } from "./_generated/server";

export const stats = query({
  args: {},
  handler: async (ctx) => {
    const jobs = await ctx.db.query("jobs").collect();
    const emails = await ctx.db.query("emails").collect();

    const total = jobs.length;
    const applied = jobs.filter((j) => j.column === "applied").length;
    const interview = jobs.filter((j) => j.column === "interview").length;
    const offer = jobs.filter((j) => j.column === "offer").length;
    const rejected = jobs.filter((j) => j.column === "rejected").length;

    const responseRate = total > 0 ? ((interview + offer + rejected) / total) * 100 : 0;
    const interviewRate = total > 0 ? (interview / total) * 100 : 0;
    const offerRate = total > 0 ? (offer / total) * 100 : 0;
    const conversionRate = (interview + offer) > 0 ? (offer / (interview + offer)) * 100 : 0;

    // Time to first response (applied -> interview/offer/rejected)
    const responseTimes: number[] = [];
    for (const job of jobs) {
      if (job.column !== "applied") {
        const delta = job.updatedAt - job.createdAt;
        if (delta > 0 && delta < 90 * 24 * 60 * 60 * 1000) {
          responseTimes.push(delta);
        }
      }
    }
    const avgResponseDays = responseTimes.length > 0
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length / (24 * 60 * 60 * 1000)
      : 0;

    // Emails by classification
    const emailStats = {
      interview: emails.filter((e) => e.classification === "interview").length,
      offer: emails.filter((e) => e.classification === "offer").length,
      rejected: emails.filter((e) => e.classification === "rejected").length,
      followup: emails.filter((e) => e.classification === "followup").length,
      other: emails.filter((e) => e.classification === "other").length,
    };

    // Top companies
    const companyMap = new Map<string, { total: number; column: string }>();
    for (const job of jobs) {
      const existing = companyMap.get(job.company);
      if (existing) {
        existing.total++;
      } else {
        companyMap.set(job.company, { total: 1, column: job.column });
      }
    }

    return {
      total,
      applied,
      interview,
      offer,
      rejected,
      responseRate: Math.round(responseRate),
      interviewRate: Math.round(interviewRate),
      offerRate: Math.round(offerRate),
      conversionRate: Math.round(conversionRate),
      avgResponseDays: Math.round(avgResponseDays * 10) / 10,
      emailStats,
      companyCount: companyMap.size,
    };
  },
});

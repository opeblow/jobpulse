import type { Doc } from "../convex/_generated/dataModel";

export type Column = Doc<"jobs">["column"];

export const COLUMNS: { key: Column; label: string; verb: string }[] = [
  { key: "applied", label: "Applied", verb: "Move to applied" },
  { key: "interview", label: "Interview", verb: "Move to interview" },
  { key: "offer", label: "Offer", verb: "Move to offer" },
  { key: "rejected", label: "Rejected", verb: "Move to rejected" },
];

export const STATUS_META: Record<
  Column,
  { tone: "accent" | "teal" | "gold" | "rose" }
> = {
  applied: { tone: "accent" },
  interview: { tone: "teal" },
  offer: { tone: "gold" },
  rejected: { tone: "rose" },
};

export function columnLabel(key: Column): string {
  return COLUMNS.find((c) => c.key === key)?.label ?? key;
}

export function timeAgo(ts: number): string {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  const mo = Math.floor(d / 30);
  if (mo < 12) return `${mo}mo ago`;
  return `${Math.floor(mo / 12)}y ago`;
}

export function stampLabel(job: { column: Column; status: string }): string {
  switch (job.column) {
    case "applied":
      return "APPLIED";
    case "interview":
      return "INTERVIEW";
    case "offer":
      return "OFFER";
    case "rejected":
      return "REJECTED";
    default:
      return "APPLIED";
  }
}

export type Classification =
  | "interview"
  | "offer"
  | "rejected"
  | "followup"
  | "other";

export function feedTone(c: Classification): string {
  switch (c) {
    case "interview":
      return "teal";
    case "offer":
      return "gold";
    case "rejected":
      return "rose";
    default:
      return "accent";
  }
}

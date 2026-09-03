import { useState } from "react";
import type { Doc } from "../../convex/_generated/dataModel";
import { COLUMNS, STATUS_META, stampLabel, timeAgo } from "../board";

type Job = Doc<"jobs">;

type Props = {
  job: Job;
  onMove: (jobId: string, column: Job["column"]) => void;
  onRemove: (jobId: string) => void;
  onSendEmail?: (jobId: string) => void;
  onDraftReply?: (emailId: string, jobId: string) => void;
  onCoach?: (jobId: string) => void;
  relatedEmailId?: string;
};

export default function JobCard({ job, onMove, onRemove, onSendEmail, onDraftReply, onCoach, relatedEmailId }: Props) {
  const [open, setOpen] = useState(false);
  const tone = STATUS_META[job.column].tone;

  function onDragStart(e: React.DragEvent) {
    e.dataTransfer.setData("text/plain", job._id);
    e.dataTransfer.effectAllowed = "move";
    (e.currentTarget as HTMLElement).classList.add("card-dragging");
  }
  function onDragEnd(e: React.DragEvent) {
    (e.currentTarget as HTMLElement).classList.remove("card-dragging");
  }

  return (
    <div
      className="card"
      data-open={open || undefined}
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      <div className="card-top">
        <div className="card-stamp-wrap">
          <span className={`stamp stamp-${tone}`}>{stampLabel(job)}</span>
          {job.fitScore !== undefined && (
            <span className={`card-fit mono num fit-tone-${fitTone(job.fitScore)}`} title="AI fit score">
              {job.fitScore}%
            </span>
          )}
        </div>
        <div className="card-actions">
          <label className="sr-only" htmlFor={`move-${job._id}`}>
            Move {job.role} at {job.company}
          </label>
          <select
            id={`move-${job._id}`}
            className="card-move mono"
            value={job.column}
            onChange={(e) => onMove(job._id, e.target.value as Job["column"])}
            aria-label={`Move ${job.role} at ${job.company}`}
          >
            <option value={job.column}>Move…</option>
            {COLUMNS.filter((c) => c.key !== job.column).map((c) => (
              <option key={c.key} value={c.key}>
                {c.label}
              </option>
            ))}
          </select>
          <button
            className="card-open"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-label={`${open ? "Close" : "Open"} details for ${job.role}`}
          >
            {open ? "Close" : "Details"}
          </button>
        </div>
      </div>

      <div className="card-body">
        <p className="card-company mono">{job.company}</p>
        <h3 className="card-role">{job.role}</h3>
        <p className="card-meta mono num">
          {[job.location, job.salary].filter(Boolean).join(" · ") || "—"}
        </p>
        <p className="card-status">{job.status}</p>
        <div className="card-date mono num">
          <span>{timeAgo(job.updatedAt)}</span>
          <span className="card-count mono num">
            {job.checklist.length ? `${job.checklist.length} steps` : ""}
          </span>
        </div>
      </div>

      {open && (
        <div className="card-detail">
          <div className="detail-block">
            <h4 className="detail-label mono">Application checklist</h4>
            {job.checklist.length ? (
              <Checklist items={job.checklist} />
            ) : (
              <p className="detail-empty">No checklist generated for this role.</p>
            )}
          </div>
          {job.requirements.length > 0 && (
            <div className="detail-block">
              <h4 className="detail-label mono">Key requirements</h4>
              <ul className="req-list">
                {job.requirements.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>
          )}
          <div className="detail-foot">
            {job.postedUrl && (
              <a className="detail-link" href={job.postedUrl} target="_blank" rel="noreferrer">
                Open posting
              </a>
            )}
            {job.note && <p className="detail-note">{job.note}</p>}
            <div className="card-detail-actions">
              {onSendEmail && (
                <button className="btn btn-sm" onClick={() => onSendEmail(job._id)}>
                  Send email
                </button>
              )}
              {onDraftReply && relatedEmailId && (
                <button className="btn btn-sm btn-ghost" onClick={() => onDraftReply(relatedEmailId, job._id)}>
                  AI draft reply
                </button>
              )}
              {onCoach && (
                <button className="btn btn-sm" onClick={() => onCoach(job._id)}>
                  {job.coachUpdatedAt ? "AI Coach" : "⚡ AI Coach"}
                </button>
              )}
              <button className="card-remove mono" onClick={() => onRemove(job._id)}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Checklist({ items }: { items: string[] }) {
  return (
    <ul className="checklist">
      {items.map((item, i) => (
        <li key={i} className="checklist-item">
          <span className="check" aria-hidden="true" />
          {item}
        </li>
      ))}
    </ul>
  );
}

function fitTone(score: number): string {
  if (score >= 80) return "high";
  if (score >= 60) return "mid";
  return "low";
}

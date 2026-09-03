import { useState } from "react";
import type { Doc } from "../../convex/_generated/dataModel";
import { STATUS_META, type Column } from "../board";
import JobCard from "./JobCard";

type Job = Doc<"jobs">;

type Props = {
  column: Column;
  label: string;
  jobs: Job[];
  loading: boolean;
  onMove: (jobId: string, column: Job["column"]) => void;
  onRemove: (jobId: string) => void;
  onAdd: () => void;
  onSendEmail?: (jobId: string) => void;
  onDraftReply?: (emailId: string, jobId: string) => void;
  onCoach?: (jobId: string) => void;
  emailMap?: Map<string, string>;
};

export default function Column({
  column,
  label,
  jobs,
  loading,
  onMove,
  onRemove,
  onAdd,
  onSendEmail,
  onDraftReply,
  onCoach,
  emailMap,
}: Props) {
  const tone = STATUS_META[column].tone;
  const [dragOver, setDragOver] = useState(false);

  function onDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOver(true);
  }
  function onDragLeave() {
    setDragOver(false);
  }
  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const jobId = e.dataTransfer.getData("text/plain");
    if (jobId) {
      onMove(jobId, column);
    }
  }

  return (
    <section
      className={`col ${dragOver ? "col-drop-target" : ""}`}
      aria-label={`${label} applications`}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <header className="col-head">
        <span className={`col-dot col-dot-${tone}`} aria-hidden="true" />
        <h2 className="col-title">{label}</h2>
        <span className="col-count mono num" aria-label={`${jobs.length} applications`}>
          {loading ? "…" : jobs.length}
        </span>
      </header>

      <div className="col-list">
        {loading ? (
          <CardSkeleton count={column === "applied" ? 3 : 2} />
        ) : jobs.length === 0 ? (
          <ColumnEmpty column={column} onAdd={onAdd} />
        ) : (
          jobs.map((job) => (
            <JobCard
              key={job._id}
              job={job}
              onMove={onMove}
              onRemove={onRemove}
              onSendEmail={onSendEmail}
              onDraftReply={onDraftReply}
              onCoach={onCoach}
              relatedEmailId={emailMap?.get(job._id)}
            />
          ))
        )}
      </div>
    </section>
  );
}

export function CardSkeleton({ count }: { count: number }) {
  return (
    <div className="skeleton-stack" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <div className="skeleton card-skeleton" key={i}>
          <div className="sk sk-line" style={{ width: "38%" }} />
          <div className="sk sk-line" style={{ width: "72%" }} />
          <div className="sk sk-line" style={{ width: "52%" }} />
          <div className="sk sk-line" style={{ width: "30%" }} />
        </div>
      ))}
    </div>
  );
}

function ColumnEmpty({
  column,
  onAdd,
}: {
  column: Column;
  onAdd: () => void;
}) {
  if (column === "applied") {
    return (
      <div className="col-empty">
        <p>
          Add your first application — paste a job posting and JobPulse builds the
          card for you.
        </p>
        <button className="btn btn-sm" onClick={onAdd}>
          Add your first application
        </button>
      </div>
    );
  }
  return (
    <div className="col-empty col-empty-muted">
      <p>Drag a card here or applications move automatically as your inbox updates.</p>
    </div>
  );
}

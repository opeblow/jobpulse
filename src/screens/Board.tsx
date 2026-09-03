import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Doc } from "../../convex/_generated/dataModel";
import { COLUMNS, timeAgo, feedTone, type Column as ColumnKey } from "../board";
import Column from "../components/Column";
import AddJobModal from "../components/AddJobModal";
import SendEmailModal from "../components/SendEmailModal";
import DraftReplyModal from "../components/DraftReplyModal";
import CoachModal from "../components/CoachModal";
import ThemeToggle from "../components/ThemeToggle";
import { useToast } from "../components/Toast";
import "../board.css";

type Props = { onLogo: () => void };

export default function Board({ onLogo }: Props) {
  const jobs = useQuery(api.jobs.list);
  const emails = useQuery(api.emails.list);
  const stats = useQuery(api.analytics.stats);
  const setColumn = useMutation(api.jobs.setColumn);
  const remove = useMutation(api.jobs.remove);
  const [adding, setAdding] = useState(false);
  const [sendingEmail, setSendingEmail] = useState<string | undefined>();
  const [draftingReply, setDraftingReply] = useState<{ emailId: string; jobId: string } | undefined>();
  const [coaching, setCoaching] = useState<string | undefined>();
  const [showAnalytics, setShowAnalytics] = useState(false);
  const { toast } = useToast();

  const grouped = useMemo(() => {
    const map: Record<ColumnKey, Doc<"jobs">[]> = {
      applied: [],
      interview: [],
      offer: [],
      rejected: [],
    };
    (jobs ?? []).forEach((j) => map[j.column].push(j));
    return map;
  }, [jobs]);

  // Map job IDs to related email IDs for draft reply
  const emailMap = useMemo(() => {
    const map = new Map<string, string>();
    (emails ?? []).forEach((e) => {
      if (e.jobId && !map.has(e.jobId)) {
        map.set(e.jobId, e._id);
      }
    });
    return map;
  }, [emails]);

  const total = jobs?.length ?? 0;
  const interviewCount = grouped.interview.length;
  const offerCount = grouped.offer.length;
  const rejectedCount = grouped.rejected.length;

  const move = (jobId: string, column: ColumnKey) => {
    void setColumn({ jobId: jobId as any, column });
    toast(`Moved to ${column}`, "info");
  };
  const onRemove = (jobId: string) => {
    if (window.confirm("Delete this application?")) {
      void remove({ jobId: jobId as any });
      toast("Deleted", "info");
    }
  };

  const loading = jobs === undefined;

  return (
    <div className="board">
      <aside className="side">
        <button className="brand brand-side" onClick={onLogo}>
          <span className="brand-mark" aria-hidden="true">JP</span>
          <span className="brand-name">JobPulse</span>
        </button>

        <nav className="side-nav" aria-label="Board sections">
          <a className="side-link is-active" href="#board">
            <span className="side-link-label">Board</span>
            <span className="side-link-count mono num">{total}</span>
          </a>
          <button
            className="side-link"
            onClick={() => setShowAnalytics((v) => !v)}
            style={{ cursor: "pointer", width: "100%", textAlign: "left" }}
          >
            <span className="side-link-label">{showAnalytics ? "Hide" : "Show"} analytics</span>
            <span className="side-link-count mono">→</span>
          </button>
        </nav>

        {showAnalytics && stats && (
          <div className="side-analytics">
            <h3 className="side-feed-title mono">Pipeline stats</h3>
            <div className="analytics-grid">
              <div className="analytics-card">
                <span className="analytics-value mono num">{stats.responseRate}%</span>
                <span className="analytics-label">Response rate</span>
              </div>
              <div className="analytics-card">
                <span className="analytics-value mono num">{stats.interviewRate}%</span>
                <span className="analytics-label">Interview rate</span>
              </div>
              <div className="analytics-card">
                <span className="analytics-value mono num">{stats.offerRate}%</span>
                <span className="analytics-label">Offer rate</span>
              </div>
              <div className="analytics-card">
                <span className="analytics-value mono num">{stats.conversionRate}%</span>
                <span className="analytics-label">Conversion</span>
              </div>
              <div className="analytics-card">
                <span className="analytics-value mono num">{stats.avgResponseDays}d</span>
                <span className="analytics-label">Avg response</span>
              </div>
              <div className="analytics-card">
                <span className="analytics-value mono num">{stats.companyCount}</span>
                <span className="analytics-label">Companies</span>
              </div>
            </div>
          </div>
        )}

        <div className="side-stats">
          <div className="stat-row">
            <span className="stat-label mono">Applied</span>
            <span className="stat-value mono num">{grouped.applied.length}</span>
          </div>
          <div className="stat-row">
            <span className="stat-label mono">Interview</span>
            <span className="stat-value mono num">{interviewCount}</span>
          </div>
          <div className="stat-row">
            <span className="stat-label mono">Offer</span>
            <span className="stat-value mono num">{offerCount}</span>
          </div>
          <div className="stat-row">
            <span className="stat-label mono">Rejected</span>
            <span className="stat-value mono num">{rejectedCount}</span>
          </div>
        </div>

        <div className="side-feed">
          <h3 className="side-feed-title mono">Inbox activity</h3>
          {emails === undefined ? (
            <div className="skeleton-stack">
              <div className="skeleton sk-line" style={{ width: "100%" }} />
              <div className="skeleton sk-line" style={{ width: "85%" }} />
            </div>
          ) : emails.length === 0 ? (
            <p className="side-feed-empty">
              Forward application emails to your inbox and they appear here.
            </p>
          ) : (
            <ul className="feed-list">
              {emails.slice(0, 6).map((e) => (
                <li key={e._id} className="feed-item">
                  <span className={`feed-dot feed-dot-${feedTone(e.classification)}`} aria-hidden="true" />
                  <div className="feed-body">
                    <p className="feed-subject">{e.subject}</p>
                    {e.summary && <p className="feed-summary">{e.summary}</p>}
                    <span className="feed-meta mono num">
                      {e.classification} · {timeAgo(e.receivedAt)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="side-foot mono">
          <span>opeyemi-8915@agentmail.to</span>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div className="topbar-title">
            <h1>Board</h1>
            <p className="topbar-sub mono num">
              {total} applications · {offerCount} offer{offerCount === 1 ? "" : "s"}
            </p>
          </div>
          <div className="topbar-actions">
            <ThemeToggle />
            <button className="btn" onClick={() => setAdding(true)}>
              + Add job
            </button>
          </div>
        </header>

        <p className="board-inbox mono num">
          Forward emails to <span className="board-inbox-addr">opeyemi-8915@agentmail.to</span>
        </p>

        {loading && (
          <div className="board-grid" aria-busy="true">
            {COLUMNS.map((c) => (
              <Column
                key={c.key}
                column={c.key}
                label={c.label}
                jobs={[]}
                loading
                    onMove={move}
                    onRemove={onRemove}
                    onAdd={() => setAdding(true)}
                    onCoach={(jobId) => setCoaching(jobId)}
                  />
                ))}
              </div>
            )}
            {!loading && jobs.length === 0 && (
              <BoardEmpty onAdd={() => setAdding(true)} />
            )}
            {!loading && jobs.length > 0 && (
              <div className="board-grid">
                {COLUMNS.map((c) => (
                  <Column
                    key={c.key}
                    column={c.key}
                    label={c.label}
                    jobs={grouped[c.key]}
                    loading={false}
                    onMove={move}
                    onRemove={onRemove}
                    onAdd={() => setAdding(true)}
                    onSendEmail={(jobId) => setSendingEmail(jobId)}
                    onDraftReply={(emailId, jobId) => setDraftingReply({ emailId, jobId })}
                    onCoach={(jobId) => setCoaching(jobId)}
                    emailMap={emailMap}
                  />
                ))}
              </div>
            )}

        <p className="board-caption mono">
          Board updates live — drag cards between columns or use the dropdown.
        </p>
      </main>

      {adding && (
        <AddJobModal onClose={() => setAdding(false)} onAdded={() => setAdding(false)} />
      )}
      {sendingEmail && (
        <SendEmailModal onClose={() => setSendingEmail(undefined)} jobId={sendingEmail} />
      )}
      {draftingReply && (
        <DraftReplyModal
          emailId={draftingReply.emailId}
          jobId={draftingReply.jobId}
          onClose={() => setDraftingReply(undefined)}
        />
      )}
      {coaching && <CoachModal jobId={coaching} onClose={() => setCoaching(undefined)} />}
    </div>
  );
}

function BoardEmpty({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="board-empty">
      <p className="board-empty-kicker mono">No applications yet</p>
      <h2>Add your first application</h2>
      <p>
        Paste a job posting URL. JobPulse reads it, pulls out the company, role,
        salary, and key requirements, and drafts a tailored checklist — then the
        card lands on your board.
      </p>
      <div className="board-empty-actions">
        <button className="btn" onClick={onAdd}>
          + Add job
        </button>
      </div>
    </div>
  );
}

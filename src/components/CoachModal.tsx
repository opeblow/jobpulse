import { useState } from "react";
import { useAction, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Doc } from "../../convex/_generated/dataModel";

type Job = Doc<"jobs">;

type Props = {
  jobId: string;
  onClose: () => void;
};

export default function CoachModal({ jobId, onClose }: Props) {
  const job = useQuery(api.jobs.get, { jobId: jobId as any }) as Job | undefined;
  const coach = useAction(api.coach.coach);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const hasCoaching = !!job?.coachUpdatedAt;

  const runCoach = async () => {
    setRunning(true);
    setError(undefined);
    try {
      await coach({ jobId: jobId as any });
    } catch (e: any) {
      setError(e?.message ?? "Coaching failed. Check API keys.");
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal coach-modal" onClick={(e) => e.stopPropagation()} aria-modal="true" role="dialog" aria-labelledby="coach-title">
        <div className="modal-head">
          <div>
            <h2 id="coach-title" className="modal-title">AI Application Coach</h2>
            <p className="modal-sub mono">
              {job ? `${job.role} @ ${job.company}` : "Loading…"}
            </p>
          </div>
          <button className="modal-x mono" onClick={onClose} aria-label="Close" disabled={running}>
            ×
          </button>
        </div>

        <div className="modal-body">
          {!hasCoaching && !running && (
            <div className="coach-empty">
              <p>
                The AI Coach researches the company with <strong>Firecrawl</strong> and coaches you
                with <strong>OpenAI</strong> — fit score, gaps to close, likely interview questions,
                and a tactical plan — all tailored to this exact role.
              </p>
              {error && <p className="field-error">{error}</p>}
              <div className="modal-foot">
                <button className="btn" onClick={runCoach}>
                  ⚡ Run coach on this role
                </button>
              </div>
            </div>
          )}

          {running && (
            <div className="coach-running" aria-live="polite">
              <div className="addjob-progress">
                <span className="addjob-spin mono">?</span>
              </div>
              <p>Reading the posting, researching the company, drafting your coaching…</p>
            </div>
          )}

          {hasCoaching && !running && job && (
            <div className="coach-results">
              <div className="coach-score-row">
                <div className="coach-score">
                  <span className="coach-score-num mono num">{job.fitScore ?? "—"}</span>
                  <span className="coach-score-label mono">FIT SCORE</span>
                </div>
                <div className="coach-score-bar">
                  <div
                    className="coach-score-fill"
                    style={{ width: `${job.fitScore ?? 0}%` }}
                    aria-hidden="true"
                  />
                </div>
              </div>

              {job.coachSummary && (
                <div className="coach-block">
                  <h3 className="coach-label mono">Coaching</h3>
                  <p className="coach-text">{job.coachSummary}</p>
                </div>
              )}

              {job.companyIntel && (
                <div className="coach-block">
                  <h3 className="coach-label mono">
                    Company intel{" "}
                    <span className="coach-powered mono">· researched by Firecrawl</span>
                  </h3>
                  {job.companyIntel.about && <p className="coach-text">{job.companyIntel.about}</p>}
                  {job.companyIntel.techStack && job.companyIntel.techStack.length > 0 && (
                    <div className="coach-tags">
                      {job.companyIntel.techStack.map((t, i) => (
                        <span key={i} className="coach-tag mono">{t}</span>
                      ))}
                    </div>
                  )}
                  {job.companyIntel.interviewSignals && job.companyIntel.interviewSignals.length > 0 && (
                    <ul className="coach-list">
                      {job.companyIntel.interviewSignals.map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {job.gaps && job.gaps.length > 0 && (
                <div className="coach-block">
                  <h3 className="coach-label mono">Gaps to close</h3>
                  <ul className="coach-list">
                    {job.gaps.map((g, i) => (
                      <li key={i}>{g}</li>
                    ))}
                  </ul>
                </div>
              )}

              {job.interviewPrep && job.interviewPrep.length > 0 && (
                <div className="coach-block">
                  <h3 className="coach-label mono">Likely interview questions</h3>
                  {job.interviewPrep.map((q, i) => (
                    <div className="coach-qa" key={i}>
                      <p className="coach-q mono">Q{i + 1}. {q.question}</p>
                      <p className="coach-a">{q.answer}</p>
                    </div>
                  ))}
                </div>
              )}

              <div className="coach-foot">
                <button className="btn btn-ghost btn-sm" onClick={runCoach} disabled={running}>
                  Re-run coach
                </button>
                <span className="coach-saved mono num">
                  Updated {job.coachUpdatedAt ? new Date(job.coachUpdatedAt).toLocaleDateString() : ""}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

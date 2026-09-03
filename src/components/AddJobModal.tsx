import { useEffect, useRef, useState } from "react";
import { useAction } from "convex/react";
import { api } from "../../convex/_generated/api";

type Props = { onClose: () => void; onAdded: () => void };

type Phase = "idle" | "running" | "done" | "error";

export default function AddJobModal({ onClose, onAdded }: Props) {
  const [url, setUrl] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState("");
  const [urlError, setUrlError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const addJob = useAction(api.addJob.addJob);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && phase !== "running") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, phase]);

  async function submit() {
    const trimmed = url.trim();
    if (!/^https?:\/\/.+/i.test(trimmed)) {
      setUrlError("Enter a full job posting URL, starting with http:// or https://");
      return;
    }
    setUrlError("");
    setPhase("running");
    setError("");
    try {
      await addJob({ url: trimmed });
      setPhase("done");
      setUrl("");
    } catch (e: any) {
      setPhase("error");
      setError(
        e?.message ??
          "Something went wrong while adding that job. Check your keys are set (OpenAI + Firecrawl), then try again.",
      );
    }
  }

  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && phase !== "running" && onClose()}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="addjob-title"
      >
        <div className="modal-head">
          <h2 id="addjob-title">Add job</h2>
          <button className="modal-x" onClick={onClose} aria-label="Close" disabled={phase === "running"}>
            ×
          </button>
        </div>

        {phase === "running" ? (
          <div className="addjob-running" aria-live="polite">
            <div className="addjob-progress">
              <span className="addjob-spin mono">●</span>
              <p>
                Reading the posting and tailoring your checklist…
              </p>
            </div>
            <div className="skeleton-stack">
              <div className="skeleton card-skeleton">
                <div className="sk sk-line" style={{ width: "40%" }} />
                <div className="sk sk-line" style={{ width: "80%" }} />
                <div className="sk sk-line" style={{ width: "60%" }} />
              </div>
            </div>
          </div>
        ) : phase === "done" ? (
          <div className="addjob-done" aria-live="polite">
            <p className="addjob-done-title">Added</p>
            <p>The card is on your board, with a tailored checklist ready to go.</p>
            <div className="modal-foot">
              <button className="btn" onClick={onAdded}>
                Done
              </button>
              <button className="btn btn-ghost" onClick={() => setPhase("idle")}>
                Add another
              </button>
            </div>
          </div>
        ) : (
          <>
            <form
              className="addjob-form"
              onSubmit={(e) => {
                e.preventDefault();
                submit();
              }}
            >
              <label className="field-label" htmlFor="job-url">
                Paste the job posting URL
              </label>
              <input
                ref={inputRef}
                id="job-url"
                className="field-input"
                type="text"
                inputMode="url"
                placeholder="https://…"
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  setUrlError("");
                }}
              />
              {urlError && <p className="field-error">{urlError}</p>}
              {phase === "error" && <p className="field-error">{error}</p>}
              <div className="modal-foot">
                <button className="btn" type="submit">
                  Add job
                </button>
                <button
                  className="btn btn-ghost"
                  type="button"
                  onClick={onClose}
                >
                  Cancel
                </button>
              </div>
            </form>
            <p className="modal-hint mono">
              JobPulse scrapes the posting, extracts the details, and drafts your
              application checklist.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

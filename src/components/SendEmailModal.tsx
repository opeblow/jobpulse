import { useEffect, useRef, useState } from "react";
import { useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useToast } from "./Toast";

type Props = { onClose: () => void; jobId?: string; defaultTo?: string };

export default function SendEmailModal({ onClose, jobId, defaultTo }: Props) {
  const [to, setTo] = useState(defaultTo ?? "");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [phase, setPhase] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const sendEmail = useAction(api.sendEmail.sendEmail);
  const { toast } = useToast();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && phase !== "sending") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, phase]);

  async function submit() {
    if (!to.trim() || !subject.trim() || !body.trim()) {
      setError("All fields are required");
      return;
    }
    setPhase("sending");
    setError("");
    try {
      await sendEmail({
        to: to.trim(),
        subject: subject.trim(),
        text: body.trim(),
        jobId: jobId as any,
      });
      setPhase("done");
      toast("Email sent successfully", "success");
    } catch (e: any) {
      setPhase("error");
      setError(e?.message ?? "Failed to send email");
    }
  }

  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && phase !== "sending" && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="sendemail-title">
        <div className="modal-head">
          <h2 id="sendemail-title">Send email</h2>
          <button className="modal-x" onClick={onClose} aria-label="Close" disabled={phase === "sending"}>
            ×
          </button>
        </div>

        {phase === "done" ? (
          <div className="addjob-done" aria-live="polite">
            <p className="addjob-done-title">Sent</p>
            <p>Your email has been sent via AgentMail.</p>
            <div className="modal-foot">
              <button className="btn" onClick={onClose}>Done</button>
              <button className="btn btn-ghost" onClick={() => { setPhase("idle"); setSubject(""); setBody(""); }}>Send another</button>
            </div>
          </div>
        ) : phase === "sending" ? (
          <div className="addjob-running" aria-live="polite">
            <div className="addjob-progress">
              <span className="addjob-spin mono">●</span>
              <p>Sending via AgentMail…</p>
            </div>
          </div>
        ) : (
          <form className="addjob-form" onSubmit={(e) => { e.preventDefault(); submit(); }}>
            <label className="field-label" htmlFor="email-to">To</label>
            <input
              ref={inputRef}
              id="email-to"
              className="field-input"
              type="email"
              placeholder="hiring@company.com"
              value={to}
              onChange={(e) => { setTo(e.target.value); setError(""); }}
            />
            <label className="field-label" htmlFor="email-subject" style={{ marginTop: 12 }}>Subject</label>
            <input
              id="email-subject"
              className="field-input"
              type="text"
              placeholder="Thank you for the interview"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
            <label className="field-label" htmlFor="email-body" style={{ marginTop: 12 }}>Body</label>
            <textarea
              id="email-body"
              className="field-input"
              rows={6}
              placeholder="Write your email here…"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              style={{ resize: "vertical", minHeight: 120 }}
            />
            {error && <p className="field-error">{error}</p>}
            <div className="modal-foot">
              <button className="btn" type="submit">Send</button>
              <button className="btn btn-ghost" type="button" onClick={onClose}>Cancel</button>
            </div>
            <p className="modal-hint mono">
              Sent through your AgentMail inbox (opeyemi-8915@agentmail.to)
            </p>
          </form>
        )}
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import { useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useToast } from "./Toast";

type Props = {
  emailId: string;
  jobId: string;
  onClose: () => void;
};

export default function DraftReplyModal({ emailId, jobId, onClose }: Props) {
  const [phase, setPhase] = useState<"drafting" | "review" | "sending" | "done" | "error">("drafting");
  const [draft, setDraft] = useState<{ subject: string; body: string } | null>(null);
  const [error, setError] = useState("");
  const draftReply = useAction(api.sendEmail.draftReply);
  const sendEmail = useAction(api.sendEmail.sendEmail);
  const { toast } = useToast();

  useEffect(() => {
    (async () => {
      try {
        const result = await draftReply({ emailId: emailId as any, jobId: jobId as any });
        setDraft(result);
        setPhase("review");
      } catch (e: any) {
        setError(e?.message ?? "Failed to draft reply");
        setPhase("error");
      }
    })();
  }, [emailId, jobId]);

  async function handleSend() {
    if (!draft) return;
    setPhase("sending");
    try {
      await sendEmail({
        to: "",
        subject: draft.subject,
        text: draft.body,
        jobId: jobId as any,
      });
      setPhase("done");
      toast("Draft reply sent", "success");
    } catch (e: any) {
      setError(e?.message ?? "Failed to send");
      setPhase("error");
    }
  }

  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="draft-title">
        <div className="modal-head">
          <h2 id="draft-title">AI Draft Reply</h2>
          <button className="modal-x" onClick={onClose} aria-label="Close">×</button>
        </div>

        {phase === "drafting" && (
          <div className="addjob-running">
            <div className="addjob-progress">
              <span className="addjob-spin mono">●</span>
              <p>AI is drafting your reply…</p>
            </div>
          </div>
        )}

        {phase === "error" && (
          <div>
            <p className="field-error">{error}</p>
            <div className="modal-foot">
              <button className="btn btn-ghost" onClick={onClose}>Close</button>
            </div>
          </div>
        )}

        {phase === "review" && draft && (
          <div>
            <div className="draft-field">
              <label className="field-label">Subject</label>
              <input
                className="field-input"
                value={draft.subject}
                onChange={(e) => setDraft({ ...draft, subject: e.target.value })}
              />
            </div>
            <div className="draft-field">
              <label className="field-label">Body</label>
              <textarea
                className="field-input"
                rows={8}
                value={draft.body}
                onChange={(e) => setDraft({ ...draft, body: e.target.value })}
                style={{ resize: "vertical", minHeight: 160 }}
              />
            </div>
            <p className="modal-hint mono">Review and edit before sending. This will be sent from your AgentMail inbox.</p>
            <div className="modal-foot">
              <button className="btn" onClick={handleSend}>Send reply</button>
              <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
            </div>
          </div>
        )}

        {phase === "sending" && (
          <div className="addjob-running">
            <div className="addjob-progress">
              <span className="addjob-spin mono">●</span>
              <p>Sending…</p>
            </div>
          </div>
        )}

        {phase === "done" && (
          <div className="addjob-done">
            <p className="addjob-done-title">Sent</p>
            <p>Your AI-drafted reply has been sent.</p>
            <div className="modal-foot">
              <button className="btn" onClick={onClose}>Done</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

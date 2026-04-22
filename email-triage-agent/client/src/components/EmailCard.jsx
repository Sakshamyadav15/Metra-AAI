import { useState } from "react";
import Badge from "./Badge";
import DraftEditor from "./DraftEditor";

export default function EmailCard({ email, index, onUpdateDraft, onSend, onDiscard }) {
  const [busy, setBusy] = useState(false);

  const handleSend = async () => {
    setBusy(true);
    try {
      await onSend(email);
    } finally {
      setBusy(false);
    }
  };

  const handleDiscard = async () => {
    setBusy(true);
    try {
      await onDiscard(email.id);
    } finally {
      setBusy(false);
    }
  };

  return (
    <article
      className="animate-rise rounded-3xl border border-[#2f4f5d]/15 bg-white/85 p-5 shadow-[0_12px_30px_-20px_rgba(16,38,52,0.5)] backdrop-blur"
      style={{ animationDelay: `${index * 70}ms` }}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-display text-xl text-[#16303b]">{email.subject}</h3>
        <Badge category={email.category} />
      </div>

      <div className="mt-2 text-sm text-[#36515b]">
        <p>
          <span className="font-semibold">From:</span> {email.from}
        </p>
        <p>
          <span className="font-semibold">Topic:</span> {email.topic} | <span className="font-semibold">Confidence:</span> {email.confidence}
        </p>
      </div>

      <p className="mt-3 rounded-xl bg-[#f2f8fb] p-3 text-sm text-[#243b45]">{email.summary}</p>

      {email.category === "Routine" && (
        <DraftEditor
          value={email.draft || ""}
          onChange={(draft) => onUpdateDraft(email.id, draft)}
          onSend={handleSend}
          onDiscard={handleDiscard}
          busy={busy}
        />
      )}
    </article>
  );
}

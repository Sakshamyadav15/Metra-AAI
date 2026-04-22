export default function DraftEditor({ value, onChange, onSend, onDiscard, busy }) {
  return (
    <div className="mt-4 rounded-2xl border border-[#2b3e47]/20 bg-white/90 p-4">
      <p className="mb-2 text-xs uppercase tracking-widest text-[#365f6d]">Draft Reply</p>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={5}
        className="w-full resize-y rounded-xl border border-[#95b5bf] bg-[#f8fbfd] p-3 text-sm text-[#1a2f36] outline-none ring-0 focus:border-[#2a9d8f]"
      />
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          onClick={onSend}
          disabled={busy}
          className="rounded-xl bg-[#2a9d8f] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#22867a] disabled:cursor-not-allowed disabled:opacity-60"
        >
          Send
        </button>
        <button
          onClick={onDiscard}
          disabled={busy}
          className="rounded-xl border border-[#d77254] px-4 py-2 text-sm font-semibold text-[#c65633] transition hover:bg-[#fff0eb] disabled:cursor-not-allowed disabled:opacity-60"
        >
          Discard
        </button>
      </div>
    </div>
  );
}

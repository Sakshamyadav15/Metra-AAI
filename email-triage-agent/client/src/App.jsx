import { useEffect } from "react";
import EmailCard from "./components/EmailCard";
import { useTriageStore } from "./store/triageStore";

function Hero({ session, onRefresh }) {
  const apiBase = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

  return (
    <header className="relative overflow-hidden rounded-3xl border border-[#2f4f5d]/20 bg-[radial-gradient(circle_at_top_left,_#f4d6b8,_#e9f5f1_42%,_#edf6fa_85%)] p-7 shadow-[0_24px_55px_-40px_rgba(8,28,39,0.6)]">
      <div className="absolute -right-8 -top-10 h-28 w-28 rounded-full bg-[#2a9d8f]/20 blur-xl" />
      <div className="absolute -left-10 bottom-0 h-24 w-24 rounded-full bg-[#d77254]/20 blur-xl" />
      <p className="text-xs uppercase tracking-[0.28em] text-[#42606b]">AI Email Triage</p>
      <h1 className="mt-2 max-w-2xl font-display text-4xl leading-tight text-[#18313c] md:text-5xl">
        Agentic inbox ops: perceive, reason, draft, and route every email with full human control.
      </h1>
      <p className="mt-3 max-w-2xl text-sm text-[#2e505d] md:text-base">
        The assistant continuously triages unread threads, generates routine drafts, logs every action, and learns from your feedback without changing your review-first workflow.
      </p>
      <div className="mt-5 flex flex-wrap items-center gap-3 text-sm">
        <span className="rounded-full bg-white/70 px-3 py-1 text-[#244552]">
          Session: {session.authenticated ? "Active" : "Not Authenticated"}
        </span>
        <span className="rounded-full bg-white/70 px-3 py-1 text-[#244552]">
          Mode: {session.mock ? "Mock" : "Live"}
        </span>
      </div>
      <div className="mt-5 flex flex-wrap gap-3">
        <a
          href={`${apiBase}/auth/google`}
          className="rounded-xl border border-[#265f55] bg-[#2a9d8f] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#22867a]"
        >
          Sign in with Google
        </a>
        <button
          onClick={onRefresh}
          className="rounded-xl border border-[#284654] bg-white/75 px-4 py-2 text-sm font-semibold text-[#1f3a47] transition hover:bg-white"
        >
          Run Triage
        </button>
      </div>
    </header>
  );
}

export default function App() {
  const {
    emails,
    loading,
    error,
    session,
    fetchSession,
    loadLatestHistory,
    runTriage,
    updateDraft,
    sendDraft,
    discardDraft,
  } = useTriageStore();

  useEffect(() => {
    const bootstrap = async () => {
      await fetchSession();
      const currentSession = useTriageStore.getState().session;
      if (currentSession?.authenticated || currentSession?.mock) {
        await loadLatestHistory();
      }
    };

    bootstrap();
  }, [fetchSession, loadLatestHistory]);

  return (
    <div className="min-h-screen bg-[#f9f4ec] bg-[linear-gradient(120deg,#f9f4ec_0%,#edf8fb_45%,#eef6ee_100%)] px-4 py-8 font-body text-[#1f333b] md:px-8">
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <Hero session={session} onRefresh={runTriage} />

        {loading && (
          <section className="grid gap-4 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-44 animate-pulse rounded-3xl border border-[#9eb8c2] bg-white/60" />
            ))}
          </section>
        )}

        {!loading && error && (
          <p className="rounded-2xl border border-[#ef9d87] bg-[#fff3ef] p-4 text-[#a53f22]">{error}</p>
        )}

        {!loading && !error && emails.length === 0 && (
          <section className="rounded-3xl border border-[#9eb8c2]/40 bg-white/70 p-7 text-[#33535f]">
            No triaged emails yet. Click Run Triage to fetch and classify.
          </section>
        )}

        {!loading && emails.length > 0 && (
          <section className="grid gap-4 md:grid-cols-2">
            {emails.map((email, idx) => (
              <EmailCard
                key={email.id}
                email={email}
                index={idx}
                onUpdateDraft={updateDraft}
                onSend={sendDraft}
                onDiscard={discardDraft}
              />
            ))}
          </section>
        )}
      </main>
    </div>
  );
}

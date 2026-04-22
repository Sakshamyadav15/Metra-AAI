"use client"

import { useEffect } from "react"
import { useAuth, useTriage } from "@/lib/store"
import { Zap, Mail } from "lucide-react"

export default function Dashboard() {
  const { isAuthenticated, isLoading, checkSession, signIn, user } = useAuth()
  const { emails, drafts, selectedEmailId, isTriaging, runTriage, selectEmail, updateDraft, sendEmail, discardDraft } = useTriage()
  const selectedEmail = emails.find((email) => email.id === selectedEmailId) || null
  const selectedDraft = selectedEmailId ? drafts[selectedEmailId]?.content || "" : ""

  useEffect(() => {
    checkSession()
  }, [checkSession])

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground">Loading...</h2>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center rounded-xl border border-foreground/20 bg-foreground/10 backdrop-blur-md p-10">
          <h2 className="text-2xl font-light text-foreground mb-3">Sign in required</h2>
          <p className="text-foreground/70 mb-6">Connect Google to start triaging your inbox.</p>
          <button
            onClick={signIn}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-primary/80 text-primary-foreground font-medium hover:bg-primary transition-all"
          >
            Continue with Google
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="relative flex h-full flex-col overflow-hidden">
      {/* Header */}
      <header className="relative mb-8">
        <h1 className="text-4xl font-light tracking-tight text-foreground mb-2">
          <span className="text-balance">Email Triage</span>
        </h1>
        <p className="text-lg text-foreground/80">Welcome, {user?.name}</p>
      </header>

      {/* Main Content */}
      <div className="relative flex-1 overflow-auto">
        <div className="space-y-6">
          {/* Triage Control Card */}
          <div className="group relative overflow-hidden rounded-xl border border-foreground/20 bg-foreground/10 backdrop-blur-md p-8 transition-all duration-300 hover:border-foreground/40 hover:bg-foreground/15">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 rounded-lg bg-primary/30">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-light text-foreground">Run Email Triage</h2>
                <p className="text-sm text-foreground/70">Automatically categorize and process emails</p>
              </div>
            </div>

            <button
              onClick={runTriage}
              disabled={isTriaging}
              className="flex items-center gap-2 px-6 py-3 rounded-lg bg-primary/80 text-primary-foreground font-medium hover:bg-primary transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Zap className="w-5 h-5" />
              {isTriaging ? "Running Triage..." : "Run Triage"}
            </button>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {[
              { label: "Total Emails", value: emails.length },
              { label: "Processing", value: isTriaging ? 1 : 0 },
              { label: "Success Rate", value: "98%" },
            ].map((stat, i) => (
              <div
                key={i}
                className="rounded-lg border border-foreground/20 bg-foreground/10 backdrop-blur-md p-6 hover:border-foreground/40 transition-all"
              >
                <p className="text-sm text-foreground/70">{stat.label}</p>
                <p className="mt-2 text-3xl font-light text-foreground">{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Emails List + Draft Panel */}
          {emails.length > 0 && (
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-xl border border-foreground/20 bg-foreground/10 backdrop-blur-md overflow-hidden hover:shadow-lg transition-all">
                <div className="border-b border-foreground/20 px-8 py-4 flex items-center gap-2">
                  <Mail className="w-5 h-5 text-primary" />
                  <h3 className="font-medium text-foreground">Triaged Emails ({emails.length})</h3>
                </div>
                <div className="divide-y divide-foreground/20">
                  {emails.map((email) => {
                    const category = email.category.toLowerCase()
                    const isSelected = selectedEmailId === email.id
                    return (
                      <div
                        key={email.id}
                        onClick={() => selectEmail(email.id)}
                        className={`group relative cursor-pointer px-8 py-5 transition-all hover:bg-foreground/20 hover:border-l-2 hover:border-l-primary ${
                          isSelected ? "bg-foreground/15 border-l-2 border-l-primary" : ""
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-foreground group-hover:text-primary transition-colors">
                              {email.subject}
                            </p>
                            <p className="text-sm text-foreground/70 truncate">{email.from}</p>
                            <p className="mt-2 line-clamp-1 text-sm text-foreground/70">{email.body}</p>
                          </div>
                          <div className="ml-4 text-right flex-shrink-0">
                            <span
                              className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${
                                category === "urgent"
                                  ? "bg-destructive/30 text-destructive"
                                  : category === "important" || category === "routine"
                                    ? "bg-primary/30 text-primary"
                                    : "bg-accent/30 text-accent"
                              }`}
                            >
                              {email.category}
                            </span>
                            <p className="mt-3 text-xs text-foreground/70">{(email.confidence * 100).toFixed(0)}% confident</p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="rounded-xl border border-foreground/20 bg-foreground/10 backdrop-blur-md p-6">
                <h3 className="text-lg font-medium text-foreground mb-2">Draft Response</h3>
                {!selectedEmail ? (
                  <p className="text-sm text-foreground/70">Select an email from the list to review and send a draft.</p>
                ) : (
                  <>
                    <p className="text-sm text-foreground/70 mb-1">To: {selectedEmail.from}</p>
                    <p className="text-sm text-foreground/70 mb-4">Subject: Re: {selectedEmail.subject}</p>
                    <textarea
                      value={selectedDraft}
                      onChange={(event) => updateDraft(selectedEmail.id, event.target.value)}
                      rows={10}
                      className="w-full rounded-lg border border-foreground/20 bg-foreground/5 px-3 py-2 text-sm text-foreground focus:border-primary/60 focus:outline-none"
                      placeholder="Draft will appear here. You can edit before sending."
                    />
                    <div className="mt-4 flex gap-3">
                      <button
                        onClick={() => sendEmail(selectedEmail.id)}
                        className="px-4 py-2 rounded-lg bg-primary/80 text-primary-foreground text-sm font-medium hover:bg-primary transition-all"
                      >
                        Send Reply
                      </button>
                      <button
                        onClick={() => discardDraft(selectedEmail.id)}
                        className="px-4 py-2 rounded-lg border border-foreground/30 text-foreground text-sm font-medium hover:bg-foreground/10 transition-all"
                      >
                        Discard
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {emails.length === 0 && !isTriaging && (
            <div className="rounded-xl border border-dashed border-foreground/20 bg-foreground/5 backdrop-blur-md p-12 text-center">
              <Mail className="w-12 h-12 text-foreground/40 mx-auto mb-4" />
              <p className="text-foreground/70">No emails yet. Click "Run Triage" to get started.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

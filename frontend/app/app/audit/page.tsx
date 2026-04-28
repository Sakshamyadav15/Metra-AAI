"use client"

export const dynamic = 'force-dynamic'

import { useEffect, useState } from "react"
import { ScrollText } from "lucide-react"
import { apiGet } from "@/lib/api"

type AuditEvent = {
  id: string
  action: string
  created_at: string
  actor?: string
}

export default function AuditPage() {
  const [auditLogs, setAuditLogs] = useState<AuditEvent[]>([])

  useEffect(() => {
    apiGet<{ events: AuditEvent[] }>("/feedback/audit")
      .then((data) => setAuditLogs(data.events || []))
      .catch((error) => {
        console.error("Failed to load audit events", error)
      })
  }, [])

  return (
    <div className="relative flex h-full flex-col overflow-hidden">
      {/* Header */}
      <header className="relative mb-8">
        <h1 className="text-4xl font-light tracking-tight text-foreground mb-2">
          <span className="text-balance">Audit Trail</span>
        </h1>
        <p className="text-lg text-foreground/80">Review all system actions and changes</p>
      </header>

      {/* Main Content */}
      <div className="relative flex-1 overflow-auto">
        <div className="space-y-3">
          {auditLogs.length > 0 ? (
            auditLogs.map((log) => (
              <div
                key={log.id}
                className="group relative overflow-hidden rounded-lg border border-foreground/20 bg-foreground/10 backdrop-blur-md p-6 transition-all hover:border-foreground/40 hover:bg-foreground/15"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/30">
                      <ScrollText className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{log.action}</p>
                      <p className="text-xs text-foreground/70 mt-1">{new Date(log.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                  <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-primary/30 text-primary">
                    {log.actor || "event"}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-xl border border-dashed border-foreground/20 bg-foreground/5 backdrop-blur-md p-12 text-center">
              <ScrollText className="w-12 h-12 text-foreground/40 mx-auto mb-4" />
              <p className="text-foreground/70">No audit logs yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

"use client"

import { useEffect } from "react"
import { useJobs } from "@/lib/store"
import { Zap, CheckCircle2, AlertCircle, Clock } from "lucide-react"

export default function JobsPage() {
  const { jobs, fetchJobs } = useJobs()

  useEffect(() => {
    fetchJobs().catch((error) => {
      console.error("Failed to load jobs", error)
    })
  }, [fetchJobs])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="w-5 h-5 text-accent" />
      case "failed":
        return <AlertCircle className="w-5 h-5 text-destructive" />
      case "running":
        return <Zap className="w-5 h-5 text-primary animate-pulse" />
      default:
        return <Clock className="w-5 h-5 text-foreground/60" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-accent/30 text-accent"
      case "failed":
        return "bg-destructive/30 text-destructive"
      case "running":
        return "bg-primary/30 text-primary"
      default:
        return "bg-foreground/20 text-foreground/80"
    }
  }

  return (
    <div className="relative flex h-full flex-col overflow-hidden">
      {/* Header */}
      <header className="relative mb-8">
        <h1 className="text-4xl font-light tracking-tight text-foreground mb-2">
          <span className="text-balance">Job History</span>
        </h1>
        <p className="text-lg text-foreground/80">Track all triage operations and their status</p>
      </header>

      {/* Main Content */}
      <div className="relative flex-1 overflow-auto">
        <div className="space-y-4">
          {jobs.length > 0 ? (
            jobs.map((job) => (
              <div
                key={job.id}
                className="group rounded-lg border border-foreground/20 bg-foreground/10 backdrop-blur-md p-6 transition-all hover:border-foreground/40 hover:bg-foreground/15"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(job.status)}
                      <div>
                        <h3 className="font-medium text-lg text-foreground capitalize">{job.type} Job</h3>
                        <p className="text-sm text-foreground/70">
                          {new Date(job.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex-1">
                        <div className="h-2 bg-foreground/20 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary transition-all"
                            style={{ width: `${job.progress}%` }}
                          />
                        </div>
                        <p className="mt-2 text-xs text-foreground/70">{job.progress}% complete</p>
                      </div>
                      <div className="ml-4">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                            job.status
                          )}`}
                        >
                          {job.status}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-xl border border-dashed border-foreground/20 bg-foreground/5 backdrop-blur-md p-12 text-center">
              <Zap className="w-12 h-12 text-foreground/40 mx-auto mb-4" />
              <p className="text-foreground/70">No jobs yet. Run triage from the dashboard to see job history.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

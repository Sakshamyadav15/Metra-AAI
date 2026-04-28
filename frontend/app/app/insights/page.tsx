"use client"

export const dynamic = 'force-dynamic'

import { useEffect, useMemo, useState } from "react"
import { BarChart3, TrendingUp, Users, Mail } from "lucide-react"
import { apiGet } from "@/lib/api"

type HistoryItem = {
  category?: string
  confidence?: number
}

type ProfileData = {
  totalFeedback: number
  overrideRate: number
  avgDraftEditRatio: number
}

export default function InsightsPage() {
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [profile, setProfile] = useState<ProfileData>({
    totalFeedback: 0,
    overrideRate: 0,
    avgDraftEditRatio: 0,
  })

  useEffect(() => {
    Promise.all([
      apiGet<{ emails: HistoryItem[] }>("/jobs/history/latest"),
      apiGet<ProfileData>("/feedback/profile"),
    ])
      .then(([historyData, profileData]) => {
        setHistory(historyData.emails || [])
        setProfile(profileData)
      })
      .catch((error) => {
        console.error("Failed to load insights", error)
      })
  }, [])

  const avgConfidence = useMemo(() => {
    if (!history.length) {
      return 0
    }

    const total = history.reduce((sum, item) => sum + (item.confidence ?? 0), 0)
    return Math.round((total / history.length) * 100)
  }, [history])

  const sendRate = useMemo(() => {
    if (!profile.totalFeedback) {
      return 0
    }
    return Math.max(0, Math.round((1 - profile.overrideRate) * 100))
  }, [profile.overrideRate, profile.totalFeedback])

  const stats = [
    {
      label: "Triaged",
      value: String(history.length),
      change: "Live",
      icon: Mail,
    },
    {
      label: "Override Rate",
      value: `${Math.round((profile.overrideRate || 0) * 100)}%`,
      change: "Live",
      icon: TrendingUp,
    },
    {
      label: "Avg Confidence",
      value: `${avgConfidence}%`,
      change: "Live",
      icon: BarChart3,
    },
    {
      label: "Send Rate",
      value: `${sendRate}%`,
      change: "Live",
      icon: Users,
    },
  ]

  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>()
    for (const item of history) {
      const key = item.category || "Other"
      counts.set(key, (counts.get(key) || 0) + 1)
    }
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 4)
  }, [history])

  const maxCount = categoryCounts[0]?.[1] || 1

  return (
    <div className="relative flex h-full flex-col overflow-hidden">
      {/* Header */}
      <header className="relative mb-8">
        <h1 className="text-4xl font-light tracking-tight text-foreground mb-2">
          <span className="text-balance">Insights & Analytics</span>
        </h1>
        <p className="text-lg text-foreground/80">Monitor triage performance and metrics</p>
      </header>

      {/* Main Content */}
      <div className="relative flex-1 overflow-auto">
        <div className="space-y-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat, idx) => {
              const Icon = stat.icon
              return (
                <div
                  key={idx}
                  className="group relative overflow-hidden rounded-xl border border-foreground/20 bg-foreground/10 backdrop-blur-md p-6 transition-all hover:border-foreground/40 hover:bg-foreground/15"
                >
                  <div>
                    <div className="flex items-start justify-between mb-4">
                      <div className="p-3 rounded-lg bg-primary/30">
                        <Icon className="w-5 h-5 text-primary" />
                      </div>
                      <span className="text-xs font-medium text-accent">{stat.change}</span>
                    </div>
                    <p className="text-sm text-foreground/70 font-medium">{stat.label}</p>
                    <p className="text-3xl font-light mt-2 text-foreground">{stat.value}</p>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Charts Section */}
          <div className="space-y-6">
            <div className="group rounded-xl border border-foreground/20 bg-foreground/10 backdrop-blur-md overflow-hidden hover:border-foreground/40 transition-all">
              <div className="border-b border-foreground/20 px-8 py-4 bg-foreground/5">
                <h2 className="text-lg font-medium text-foreground">Categorization Breakdown</h2>
              </div>
              <div className="p-8">
                <div className="h-64 rounded-lg border border-foreground/20 bg-foreground/5 flex items-center justify-center">
                  <div className="text-center">
                    <BarChart3 className="w-12 h-12 text-foreground/30 mx-auto mb-3" />
                    <p className="text-foreground/70">Chart data will appear here once you run triage</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="group rounded-xl border border-foreground/20 bg-foreground/10 backdrop-blur-md overflow-hidden hover:border-foreground/40 transition-all">
                <div className="border-b border-foreground/20 px-8 py-4 bg-foreground/5">
                  <h2 className="text-lg font-medium text-foreground">Performance Over Time</h2>
                </div>
                <div className="p-8">
                  <div className="h-48 rounded-lg border border-foreground/20 bg-foreground/5 flex items-center justify-center">
                    <p className="text-foreground/70 text-sm">Performance chart</p>
                  </div>
                </div>
              </div>

              <div className="group rounded-xl border border-foreground/20 bg-foreground/10 backdrop-blur-md overflow-hidden hover:border-foreground/40 transition-all">
                <div className="border-b border-foreground/20 px-8 py-4 bg-foreground/5">
                  <h2 className="text-lg font-medium text-foreground">Top Categories</h2>
                </div>
                <div className="p-8 space-y-3">
                  {categoryCounts.map(([cat, count], i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-3 rounded-lg bg-foreground/5 border border-foreground/20"
                    >
                      <p className="font-medium text-sm text-foreground">{cat}</p>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-20 bg-foreground/20 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary"
                            style={{ width: `${Math.round((count / maxCount) * 100)}%` }}
                          />
                        </div>
                        <span className="text-xs text-foreground/70">{count}</span>
                      </div>
                    </div>
                  ))}
                  {categoryCounts.length === 0 && (
                    <p className="text-sm text-foreground/70">Run triage to generate category insights.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

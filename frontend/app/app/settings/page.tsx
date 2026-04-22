"use client"

import { Settings, Zap, Check } from "lucide-react"
import { useEffect, useState } from "react"
import { apiGet, apiPost } from "@/lib/api"

type ProviderName = "groq" | "openai" | "azure" | "local"

type ProviderData = {
  configured: boolean
  classifyModel: string
  draftModel: string
}

type ProviderSettingsResponse = {
  activeProvider: ProviderName
  providers: Record<ProviderName, ProviderData>
}

export default function SettingsPage() {
  const [provider, setProvider] = useState<ProviderName>("groq")
  const [modelName, setModelName] = useState("")
  const [testing, setTesting] = useState(false)
  const [connectionMessage, setConnectionMessage] = useState("")

  useEffect(() => {
    const loadProviders = async () => {
      const data = await apiGet<ProviderSettingsResponse>("/providers")
      setProvider(data.activeProvider)
      setModelName(data.providers[data.activeProvider]?.classifyModel || "")
    }

    loadProviders().catch((error) => {
      console.error("Failed to load provider settings", error)
    })
  }, [])

  useEffect(() => {
    setConnectionMessage("")
  }, [provider])

  const handleTestConnection = async () => {
    setTesting(true)
    setConnectionMessage("")
    try {
      const result = await apiPost<{ ok: boolean; message?: string; error?: string }>("/providers/test", {
        provider,
      })
      if (result.ok) {
        setConnectionMessage(result.message || "Connection successful")
      } else {
        setConnectionMessage(result.error || "Connection failed")
      }
    } catch (error) {
      setConnectionMessage(error instanceof Error ? error.message : "Connection failed")
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="relative flex h-full flex-col overflow-hidden">
      {/* Header */}
      <header className="relative mb-8">
        <h1 className="text-4xl font-light tracking-tight text-foreground mb-2">
          <span className="text-balance">Settings</span>
        </h1>
        <p className="text-lg text-foreground/80">Configure your triage system</p>
      </header>

      {/* Main Content */}
      <div className="relative flex-1 overflow-auto">
        <div className="max-w-2xl space-y-6">
          {/* Provider Settings Card */}
          <div className="group rounded-xl border border-foreground/20 bg-foreground/10 backdrop-blur-md overflow-hidden hover:border-foreground/40 transition-all">
            <div className="border-b border-foreground/20 px-8 py-4 flex items-center gap-3 bg-foreground/5">
              <Settings className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-medium text-foreground">Provider Configuration</h2>
            </div>

            <div className="p-8 space-y-6">
              {/* Provider Select */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-3">Model Provider</label>
                <select
                  value={provider}
                  onChange={(e) => setProvider(e.target.value as ProviderName)}
                  className="w-full rounded-lg border border-foreground/20 bg-foreground/10 backdrop-blur-md px-4 py-3 text-foreground placeholder-foreground/50 transition-all hover:border-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="groq">Groq</option>
                  <option value="openai">OpenAI</option>
                  <option value="azure">Azure</option>
                  <option value="local">Local</option>
                </select>
                <p className="mt-2 text-xs text-foreground/70">Choose your AI provider for email categorization</p>
              </div>

              {/* Model Name */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-3">Model Name</label>
                <input
                  type="text"
                  value={modelName}
                  onChange={(e) => setModelName(e.target.value)}
                  placeholder="e.g., gpt-4-turbo"
                  className="w-full rounded-lg border border-foreground/20 bg-foreground/10 backdrop-blur-md px-4 py-3 text-foreground placeholder-foreground/50 transition-all hover:border-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <p className="mt-2 text-xs text-foreground/70">Specify the exact model name to use</p>
              </div>

              {/* API Key */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-3">API Key</label>
                <input
                  type="password"
                  placeholder="••••••••••••••••"
                  className="w-full rounded-lg border border-foreground/20 bg-foreground/10 backdrop-blur-md px-4 py-3 text-foreground placeholder-foreground/50 transition-all hover:border-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <p className="mt-2 text-xs text-foreground/70">Your API key is encrypted and never logged</p>
              </div>

              {/* Test Connection Button */}
              <div className="flex items-center gap-3 pt-4">
                <button
                  onClick={handleTestConnection}
                  disabled={testing}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/80 text-primary-foreground font-medium hover:bg-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Zap className="w-4 h-4" />
                  {testing ? "Testing..." : "Test Connection"}
                </button>
                {!!connectionMessage && (
                  <div className="flex items-center gap-2 text-accent">
                    <Check className="w-4 h-4" />
                    <span className="text-sm">{connectionMessage}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Advanced Settings */}
          <div className="group rounded-xl border border-foreground/20 bg-foreground/10 backdrop-blur-md overflow-hidden hover:border-foreground/40 transition-all">
            <div className="border-b border-foreground/20 px-8 py-4 flex items-center gap-3 bg-foreground/5">
              <Zap className="w-5 h-5 text-accent" />
              <h2 className="text-lg font-medium text-foreground">Advanced Settings</h2>
            </div>

            <div className="p-8 space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg border border-foreground/20 bg-foreground/5">
                <div>
                  <p className="font-medium text-foreground">Temperature</p>
                  <p className="text-sm text-foreground/70">Higher = more creative, Lower = more deterministic</p>
                </div>
                <input type="range" min="0" max="1" step="0.1" defaultValue="0.7" className="w-24" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

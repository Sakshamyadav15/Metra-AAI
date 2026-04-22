"use client"

import type React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { Shader, ChromaFlow, Swirl } from "shaders/react"
import { GrainOverlay } from "@/components/grain-overlay"
import { CustomCursor } from "@/components/custom-cursor"

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const navigation = [
    { name: "Dashboard", href: "/app/dashboard" },
    { name: "Jobs", href: "/app/jobs" },
    { name: "Insights", href: "/app/insights" },
    { name: "Audit", href: "/app/audit" },
    { name: "Settings", href: "/app/settings" },
  ]

  return (
    <div className="relative h-screen w-full overflow-hidden bg-background">
      <CustomCursor />
      <GrainOverlay />

      {/* Shader Background - Same as landing page */}
      <div className="fixed inset-0 z-0" style={{ contain: "strict" }}>
        <Shader className="h-full w-full">
          <Swirl
            colorA="#1275d8"
            colorB="#e19136"
            speed={0.8}
            detail={0.8}
            blend={50}
            coarseX={40}
            coarseY={40}
            mediumX={40}
            mediumY={40}
            fineX={40}
            fineY={40}
          />
          <ChromaFlow
            baseColor="#0066ff"
            upColor="#0066ff"
            downColor="#d1d1d1"
            leftColor="#e19136"
            rightColor="#e19136"
            intensity={0.9}
            radius={1.8}
            momentum={25}
            maskType="alpha"
            opacity={0.97}
          />
        </Shader>
        <div className="absolute inset-0 bg-black/20" />
      </div>

      {/* Header */}
      <header className="relative z-40 flex items-center justify-between border-b border-foreground/5 bg-background/30 px-6 py-4 backdrop-blur-lg md:px-12">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="flex h-8 w-8 items-center justify-center rounded transition-all md:hidden hover:bg-foreground/20 active:scale-95"
          >
            <svg className="w-5 h-5 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <Link href="/app/dashboard" className="flex items-center gap-2 transition-all hover:opacity-80">
            <div className="h-8 w-8 rounded-md bg-primary/40 flex items-center justify-center">
              <div className="h-6 w-6 rounded-sm bg-primary/60" />
            </div>
            <span className="font-sans text-base font-medium tracking-tight text-foreground hidden md:inline">Triage</span>
          </Link>
        </div>

        <Link
          href="/"
          className="flex items-center gap-2 px-3 py-2 rounded-md text-foreground text-sm font-medium transition-all hover:bg-foreground/10 active:scale-95 duration-150"
        >
          Back
        </Link>
      </header>

      <div className="relative z-30 flex h-[calc(100vh-73px)] overflow-hidden">
        {/* Sidebar */}
        <aside
          className={`${
            sidebarOpen ? "w-56" : "w-0 md:w-56"
          } shrink-0 border-r border-foreground/5 bg-background/20 backdrop-blur-lg transition-all duration-300 overflow-hidden`}
        >
          <nav className="space-y-1 p-3 h-full overflow-y-auto scrollbar-thin scrollbar-thumb-foreground/20 scrollbar-track-transparent hover:scrollbar-thumb-foreground/30">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                  pathname === item.href
                    ? "bg-primary/20 text-primary border border-primary/30"
                    : "text-foreground/70 hover:text-foreground/90 hover:bg-foreground/8 border border-transparent"
                }`}
              >
                <span className="truncate">{item.name}</span>
              </Link>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <div className="p-6 md:p-12 h-full">
            <div className="mx-auto max-w-6xl h-full">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

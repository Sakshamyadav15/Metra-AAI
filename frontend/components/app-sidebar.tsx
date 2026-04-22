'use client'

import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, LayoutDashboard, Zap, ScrollText, Settings, BarChart3 } from 'lucide-react'

export default function AppSidebar() {
  const router = useRouter()
  const pathname = usePathname()

  const navItems = [
    { href: '/app/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/app/jobs', label: 'Jobs', icon: Zap },
    { href: '/app/audit', label: 'Audit Log', icon: ScrollText },
    { href: '/app/insights', label: 'Insights', icon: BarChart3 },
    { href: '/app/settings', label: 'Settings', icon: Settings },
  ]

  return (
    <aside className="relative w-64 border-r border-border bg-gradient-to-b from-card/40 to-card/20 backdrop-blur-md flex flex-col overflow-hidden">
      {/* Background gradient accent */}
      <div className="absolute inset-0 pointer-events-none opacity-30">
        <div className="absolute top-0 left-1/2 h-40 w-40 -translate-x-1/2 rounded-full bg-primary/30 blur-3xl" />
      </div>

      {/* Header */}
      <div className="relative p-6 border-b border-border/50">
        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors group"
        >
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back
        </button>
      </div>

      {/* Navigation */}
      <nav className="relative flex-1 space-y-2 p-4 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                relative flex items-center gap-3 px-4 py-3 rounded-lg
                transition-all duration-200 group
                ${isActive 
                  ? 'bg-primary/20 text-primary font-medium' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-card/50'
                }
              `}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span>{item.label}</span>
              {isActive && (
                <div className="absolute inset-y-0 right-0 w-1 bg-gradient-to-b from-primary to-accent rounded-l" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="relative border-t border-border/50 p-4 space-y-2">
        <div className="px-4 py-3 rounded-lg bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20">
          <p className="text-xs font-medium text-muted-foreground">
            Email Triage System
          </p>
        </div>
      </div>
    </aside>
  )
}

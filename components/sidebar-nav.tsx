"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Bot, Database, Home, Settings } from "lucide-react"
import { cn } from "@/lib/utils"
import { ThemeToggle } from "./theme-toggle"

const navigation = [
  { name: "Dashboard", href: "/", icon: Home },
  { name: "Agents", href: "/agents", icon: Bot },
  { name: "RAG Pipeline", href: "/rag", icon: Database },
  { name: "Settings", href: "/settings", icon: Settings },
]

export function SidebarNav() {
  const pathname = usePathname()

  return (
    <div className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-border bg-sidebar">
      <div className="flex h-16 shrink-0 items-center gap-2 border-b border-sidebar-border px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
          <Bot className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-sidebar-foreground">AI Agent Builder</h1>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          )
        })}
      </nav>
      <div className="shrink-0 border-t border-sidebar-border p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-sidebar-foreground">Theme</span>
          <ThemeToggle />
        </div>
      </div>
    </div>
  )
}

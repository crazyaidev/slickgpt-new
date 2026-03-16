"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Bot, Database, Home, Settings } from "lucide-react"

import { ThemeToggle } from "@/components/theme-toggle"
import { cn } from "@/lib/utils"

const navigation = [
  {
    name: "Dashboard",
    href: "/",
    icon: Home,
    matches: (pathname: string) => pathname === "/",
  },
  {
    name: "Agents",
    href: "/agents",
    icon: Bot,
    matches: (pathname: string) =>
      pathname.startsWith("/agents") || pathname.startsWith("/chat"),
  },
  {
    name: "RAG Pipeline",
    href: "/rag",
    icon: Database,
    matches: (pathname: string) => pathname.startsWith("/rag"),
  },
  {
    name: "Settings",
    href: "/settings",
    icon: Settings,
    matches: (pathname: string) => pathname.startsWith("/settings"),
  },
]

export function SidebarNav() {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-border bg-sidebar">
      <div className="flex h-16 shrink-0 items-center gap-3 border-b border-sidebar-border px-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
          <Bot className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-sidebar-foreground">
            SlickGPT
          </h1>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {navigation.map((item) => {
          const isActive = item.matches(pathname)

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
    </aside>
  )
}

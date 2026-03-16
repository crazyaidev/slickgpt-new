"use client"

import type React from "react"

import { SidebarNav } from "@/components/sidebar-nav"
import { cn } from "@/lib/utils"

interface AppShellProps {
  title: string
  description?: string
  action?: React.ReactNode
  children: React.ReactNode
  fullBleed?: boolean
  contentClassName?: string
}

export function AppShell({
  title,
  description,
  action,
  children,
  fullBleed = false,
  contentClassName,
}: AppShellProps) {
  return (
    <div className="fixed inset-0 flex overflow-hidden bg-background text-foreground">
      <SidebarNav />

      <main className="ml-64 flex flex-1 flex-col overflow-hidden">
        <header className="flex min-h-16 shrink-0 items-center justify-between gap-4 border-b border-border bg-card px-8">
          <div className="min-w-0">
            <h2 className="truncate text-xl font-semibold text-foreground">
              {title}
            </h2>
            {description ? (
              <p className="truncate text-sm text-muted-foreground">
                {description}
              </p>
            ) : null}
          </div>

          {action ? <div className="shrink-0">{action}</div> : null}
        </header>

        <div className={cn("flex-1 overflow-y-auto", fullBleed ? "p-0" : "p-8")}>
          <div
            className={cn(
              fullBleed ? "h-full" : "mx-auto w-full max-w-7xl",
              contentClassName,
            )}
          >
            {children}
          </div>
        </div>
      </main>
    </div>
  )
}

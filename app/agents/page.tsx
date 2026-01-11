"use client"

import { useEffect } from "react"
import { SidebarNav } from "@/components/sidebar-nav"
import { CreateAgentDialog } from "@/components/agents/create-agent-dialog"
import { AgentCard } from "@/components/agents/agent-card"
import { useStore } from "@/lib/store"
import { Bot } from "lucide-react"

export default function AgentsPage() {
  const { agents, loadFromStorage } = useStore()

  useEffect(() => {
    loadFromStorage()
  }, [loadFromStorage])

  return (
    <div className="fixed inset-0 flex overflow-hidden">
      <SidebarNav />
      <main className="ml-64 flex flex-1 flex-col overflow-hidden">
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-card px-8">
          <h2 className="text-xl font-semibold text-foreground">Agents</h2>
          <CreateAgentDialog />
        </div>

        <div className="flex-1 overflow-y-auto p-8">
          {agents.length === 0 ? (
            <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border border-dashed border-border p-8">
              <Bot className="mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="mb-2 text-lg font-semibold text-foreground">No agents yet</h3>
              <p className="mb-4 text-sm text-muted-foreground">Create your first AI agent to get started</p>
              <CreateAgentDialog />
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {agents.map((agent) => (
                <AgentCard key={agent.id} agent={agent} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

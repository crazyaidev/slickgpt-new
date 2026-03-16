"use client"

import { useEffect, useState } from "react"
import { Bot, Search } from "lucide-react"

import { CreateAgentDialog } from "@/components/agents/create-agent-dialog"
import { AgentCard } from "@/components/agents/agent-card"
import { AppShell } from "@/components/app-shell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useStore } from "@/lib/store"

export default function AgentsPage() {
  const { agents, knowledgeBases, loadFromStorage } = useStore()
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    loadFromStorage()
  }, [loadFromStorage])

  const normalizedQuery = searchQuery.trim().toLowerCase()
  const knowledgeBaseNames = new Map(
    knowledgeBases.map((knowledgeBase) => [knowledgeBase.id, knowledgeBase.name]),
  )
  const filteredAgents = agents.filter((agent) => {
    if (!normalizedQuery) {
      return true
    }

    const knowledgeBaseName = agent.knowledgeBaseId
      ? knowledgeBaseNames.get(agent.knowledgeBaseId) ?? ""
      : ""

    const searchText = [
      agent.name,
      agent.model,
      agent.systemPrompt,
      knowledgeBaseName,
      agent.enableWebSearch ? "web search" : "",
      agent.enableFileUpload ? "file upload" : "",
    ]
      .join(" ")
      .toLowerCase()

    return searchText.includes(normalizedQuery)
  })

  return (
    <AppShell
      title="Agents"
      description="Create focused assistants with their own prompts, models, and tools."
      action={<CreateAgentDialog />}
      contentClassName="max-w-[96rem]"
    >
      <div className="space-y-6">
        {agents.length > 0 ? (
          <section className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-muted-foreground">
              {normalizedQuery
                ? `Showing ${filteredAgents.length} of ${agents.length} agents`
                : `${agents.length} agent${agents.length === 1 ? "" : "s"}`}
            </div>

            <div className="relative w-full sm:max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search agents by name, model, or prompt"
                className="h-10 rounded-full border-border bg-background pl-9"
                aria-label="Search agents"
              />
            </div>
          </section>
        ) : null}

        {agents.length === 0 ? (
          <div className="flex min-h-[360px] flex-col items-center justify-center rounded-lg border border-dashed border-border px-6 py-12 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Bot className="h-7 w-7" />
            </div>
            <h3 className="text-xl font-semibold">No agents yet</h3>
            <p className="mt-3 max-w-md text-sm text-muted-foreground">
              Create your first AI agent to get started.
            </p>
            <div className="mt-6">
              <CreateAgentDialog />
            </div>
          </div>
        ) : filteredAgents.length === 0 ? (
          <div className="flex min-h-[280px] flex-col items-center justify-center rounded-lg border border-dashed border-border px-6 py-12 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Search className="h-7 w-7" />
            </div>
            <h3 className="text-xl font-semibold">No agents found</h3>
            <p className="mt-3 max-w-md text-sm text-muted-foreground">
              Try a different search term or clear the current filter.
            </p>
            <Button
              variant="outline"
              className="mt-6"
              onClick={() => setSearchQuery("")}
            >
              Clear search
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
            {filteredAgents.map((agent) => (
              <AgentCard key={agent.id} agent={agent} />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  )
}

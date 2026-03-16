"use client"

import { useEffect, useState } from "react"
import { Save, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { useStore } from "@/lib/store"

interface SystemPromptSidebarProps {
  isOpen: boolean
  onClose: () => void
}

export function SystemPromptSidebar({
  isOpen,
  onClose,
}: SystemPromptSidebarProps) {
  const { currentAgentId, agents, updateAgent } = useStore()
  const { toast } = useToast()
  const [systemPrompt, setSystemPrompt] = useState("")
  const [hasChanges, setHasChanges] = useState(false)

  const currentAgent = agents.find((agent) => agent.id === currentAgentId)

  useEffect(() => {
    if (currentAgent) {
      setSystemPrompt(currentAgent.systemPrompt || "")
      setHasChanges(false)
    }
  }, [currentAgent, isOpen])

  const handleSave = () => {
    if (!currentAgentId) {
      return
    }

    updateAgent(currentAgentId, { systemPrompt })
    setHasChanges(false)
    toast({
      title: "System prompt updated",
      description: "The assistant will use this configuration in the next response.",
    })
    onClose()
  }

  if (!currentAgent || !isOpen) {
    return null
  }

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-40 bg-black/45"
        onClick={onClose}
        aria-label="Close prompt editor"
      />

      <aside className="fixed inset-y-0 right-0 z-50 flex w-full max-w-xl flex-col border-l border-border bg-background shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-5">
          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
              Prompt editor
            </p>
            <h2 className="mt-1 text-xl font-semibold">System prompt</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Refine the role, constraints, and voice for{" "}
              <span className="font-medium text-foreground">
                {currentAgent.name}
              </span>
              .
            </p>
          </div>
          <Button
            size="icon"
            variant="ghost"
            className="rounded-full"
            onClick={onClose}
            aria-label="Close prompt editor"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          <div className="rounded-[1.5rem] border border-border bg-card p-4">
            <p className="text-sm leading-6 text-muted-foreground">
              Keep the prompt focused on responsibilities, boundaries, and the
              kind of help this agent should provide.
            </p>
          </div>

          <Textarea
            value={systemPrompt}
            onChange={(event) => {
              setSystemPrompt(event.target.value)
              setHasChanges(event.target.value !== (currentAgent.systemPrompt || ""))
            }}
            placeholder="Enter system prompt here..."
            className="mt-4 min-h-[65vh] rounded-[1.5rem] border-border bg-card font-mono text-sm"
          />
        </div>

        <div className="border-t border-border px-5 py-4">
          <div className="flex flex-wrap justify-end gap-2">
            <Button
              variant="outline"
              className="rounded-full border-border bg-transparent"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              className="rounded-full px-5"
              onClick={handleSave}
              disabled={!hasChanges}
            >
              <Save className="h-4 w-4" />
              Save changes
            </Button>
          </div>
        </div>
      </aside>
    </>
  )
}

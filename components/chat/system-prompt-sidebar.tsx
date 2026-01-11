"use client"

import { useState, useEffect } from "react"
import { useStore } from "@/lib/store"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { X, Save } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface SystemPromptSidebarProps {
  isOpen: boolean
  onClose: () => void
}

export function SystemPromptSidebar({ isOpen, onClose }: SystemPromptSidebarProps) {
  const { currentAgentId, agents, updateAgent } = useStore()
  const { toast } = useToast()
  const [systemPrompt, setSystemPrompt] = useState("")
  const [hasChanges, setHasChanges] = useState(false)

  const currentAgent = agents.find((a) => a.id === currentAgentId)

  useEffect(() => {
    if (currentAgent) {
      setSystemPrompt(currentAgent.systemPrompt || "")
      setHasChanges(false)
    }
  }, [currentAgent, isOpen])

  const handleSave = () => {
    if (!currentAgentId) return

    updateAgent(currentAgentId, { systemPrompt })
    setHasChanges(false)
    toast({
      title: "System prompt updated",
      description: "Your changes have been saved and will be reflected in the agent editor.",
    })
    onClose()
  }

  const handleChange = (value: string) => {
    setSystemPrompt(value)
    setHasChanges(value !== (currentAgent?.systemPrompt || ""))
  }

  if (!currentAgent || !isOpen) {
    return null
  }

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Form */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="flex w-[90vw] md:w-[60vw] md:min-w-[600px] md:max-w-[90vw] flex-col rounded-lg border border-border bg-background shadow-lg"
          style={{ 
            height: "80vh",
            minHeight: "400px",
            maxHeight: "90vh"
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex h-16 shrink-0 items-center justify-between border-b border-border px-6">
            <div>
              <h2 className="text-lg font-semibold">System Prompt</h2>
              <p className="text-sm text-muted-foreground">
                Define the behavior and personality of your AI agent
              </p>
            </div>
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Content */}
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-6">
            <div className="mb-4 shrink-0">
              <Label htmlFor="system-prompt" className="text-sm font-medium">
                Prompt
              </Label>
            </div>

            <div className="flex min-h-0 flex-1 flex-col gap-4">
              <Textarea
                id="system-prompt"
                value={systemPrompt}
                onChange={(e) => handleChange(e.target.value)}
                placeholder="Enter system prompt here..."
                className="flex-1 min-h-0 resize-none font-mono text-sm"
              />

              {hasChanges && (
                <div className="flex shrink-0 justify-end gap-2">
                  <Button variant="outline" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button onClick={handleSave}>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

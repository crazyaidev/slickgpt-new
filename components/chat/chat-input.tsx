"use client"

import type React from "react"

import { useState } from "react"
import { ArrowUp, FileUp, Globe, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useStore } from "@/lib/store"
import { cn } from "@/lib/utils"

interface ChatInputProps {
  onSend: (message: string, webSearchEnabled?: boolean) => void
  isLoading: boolean
}

export function ChatInput({ onSend, isLoading }: ChatInputProps) {
  const [input, setInput] = useState("")
  const [webSearchEnabled, setWebSearchEnabled] = useState(false)
  const { currentAgentId, agents } = useStore()

  const currentAgent = agents.find((agent) => agent.id === currentAgentId)
  const hasFileUpload = currentAgent?.enableFileUpload
  const hasWebSearch = currentAgent?.enableWebSearch

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()

    if (!input.trim() || isLoading) {
      return
    }

    onSend(input.trim(), webSearchEnabled)
    setInput("")
  }

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault()
      handleSubmit(event)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto w-full max-w-3xl">
      <div className="overflow-hidden rounded-[28px] border border-border bg-card shadow-sm">
        <Textarea
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={`Ask ${currentAgent?.name || "your agent"} anything`}
          className="min-h-[88px] max-h-[240px] resize-none border-0 bg-transparent px-5 py-4 text-[15px] shadow-none focus-visible:ring-0"
          disabled={isLoading}
        />

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/70 px-4 py-3">
          <div className="flex flex-wrap items-center gap-2">
            {hasWebSearch ? (
              <Button
                type="button"
                variant={webSearchEnabled ? "secondary" : "ghost"}
                className={cn(
                  "rounded-full px-4",
                  webSearchEnabled &&
                    "bg-primary/10 text-primary hover:bg-primary/15",
                )}
                onClick={() => setWebSearchEnabled((current) => !current)}
              >
                <Globe className="h-4 w-4" />
                Web
              </Button>
            ) : null}

            {hasFileUpload ? (
              <Button
                type="button"
                variant="ghost"
                className="rounded-full px-4 text-muted-foreground"
                disabled
              >
                <FileUp className="h-4 w-4" />
                Attach
              </Button>
            ) : null}
          </div>

          <Button
            type="submit"
            size="icon"
            className="h-10 w-10 rounded-full"
            disabled={!input.trim() || isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ArrowUp className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </form>
  )
}

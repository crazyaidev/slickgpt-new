"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { FileUp, Globe, Send, Check } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
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

  const currentAgent = agents.find((a) => a.id === currentAgentId)
  const hasFileUpload = currentAgent?.enableFileUpload
  const hasWebSearch = currentAgent?.enableWebSearch

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return
    onSend(input.trim(), webSearchEnabled)
    setInput("")
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <div className="bg-background p-3 md:p-4">
      <form onSubmit={handleSubmit} className="mx-auto w-full max-w-3xl">
        <div className="flex flex-wrap items-end gap-2">
          <div className="flex min-w-0 flex-1 items-end gap-2">
            {hasWebSearch && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      size="icon"
                      variant={webSearchEnabled ? "default" : "outline"}
                      onClick={() => setWebSearchEnabled(!webSearchEnabled)}
                      className={cn(
                        "h-9 w-9 shrink-0 transition-all md:h-10 md:w-10",
                        webSearchEnabled
                          ? "bg-primary text-primary-foreground shadow-md ring-2 ring-primary/20"
                          : "bg-transparent"
                      )}
                    >
                      {webSearchEnabled ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Globe className="h-4 w-4" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{webSearchEnabled ? "Web search enabled - Click to disable" : "Enable web search"}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            <div className="relative min-w-0 flex-1">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Message your agent..."
                className="min-h-[60px] max-h-[40vh] resize-none overflow-y-auto pr-12 text-sm md:text-base"
                disabled={isLoading}
              />
              {webSearchEnabled && hasWebSearch && (
                <Badge
                  variant="secondary"
                  className="pointer-events-none absolute top-2 right-2 px-2 py-0.5 text-xs"
                >
                  <Globe className="mr-1 h-3 w-3" />
                  Web Search ON
                </Badge>
              )}
            </div>
          </div>
          <div className="ml-auto flex shrink-0 gap-1 md:gap-2">
            {hasFileUpload && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      disabled
                      className="h-9 w-9 md:h-10 md:w-10 bg-transparent"
                    >
                      <FileUp className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>File upload (coming soon)</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            <Button type="submit" size="icon" disabled={!input.trim() || isLoading} className="h-9 w-9 md:h-10 md:w-10">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}

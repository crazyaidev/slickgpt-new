"use client"

import { useState } from "react"
import {
  Bot,
  Check,
  Copy,
  Edit2,
  ExternalLink,
  Globe,
  Trash2,
  User,
} from "lucide-react"

import { MessageMarkdown } from "@/components/chat/message-markdown"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import type { Message } from "@/lib/types"
import { cn } from "@/lib/utils"

interface ChatMessageProps {
  message: Message
  onEdit?: (messageId: string, content: string) => void
  onDelete?: (messageId: string) => void
}

export function ChatMessage({
  message,
  onEdit,
  onDelete,
}: ChatMessageProps) {
  const isUser = message.role === "user"
  const [copied, setCopied] = useState(false)
  const [showSources, setShowSources] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(message.content)
  const { toast } = useToast()

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content)
      setCopied(true)
      toast({
        title: "Copied",
        description: "The message is now in your clipboard.",
      })
      setTimeout(() => setCopied(false), 1800)
    } catch {
      toast({
        title: "Copy failed",
        description: "Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleEdit = () => {
    if (isEditing) {
      const trimmedContent = editContent.trim()

      if (trimmedContent && trimmedContent !== message.content) {
        onEdit?.(message.id, trimmedContent)
      }

      setIsEditing(false)
      return
    }

    setIsEditing(true)
  }

  const handleCancelEdit = () => {
    setEditContent(message.content)
    setIsEditing(false)
  }

  return (
    <div className={cn("group w-full py-6", isUser && "flex justify-end")}>
      <div className={cn("min-w-0", isUser ? "max-w-[78%]" : "w-full")}>
        <div
          className={cn(
            "mb-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground",
            isUser ? "justify-end" : "justify-start",
          )}
        >
          {isUser ? (
            <User className="h-4 w-4" />
          ) : (
            <Bot className="h-4 w-4" />
          )}
          <span className="font-medium text-foreground/80">
            {isUser ? "You" : "Assistant"}
          </span>

          {message.webSearchUsed ? (
            <Badge
              variant="secondary"
              className="rounded-full border border-border bg-background px-2.5 py-1 text-[11px] font-medium"
            >
              <Globe className="h-3 w-3" />
              Web
            </Badge>
          ) : null}

          {message.sources && message.sources.length > 0 ? (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 rounded-full px-3 text-xs"
              onClick={() => setShowSources((current) => !current)}
            >
              {showSources ? "Hide" : "Show"} sources
            </Button>
          ) : null}
        </div>

        <div
          className={cn(
            isUser
              ? "rounded-[26px] bg-secondary px-5 py-4 text-secondary-foreground"
              : "px-1",
          )}
        >
          {isEditing ? (
            <div className="space-y-3">
              <Textarea
                value={editContent}
                onChange={(event) => setEditContent(event.target.value)}
                className="min-h-[160px] rounded-[1.5rem] border-border bg-background"
                autoFocus
              />
              <div className="flex flex-wrap gap-2">
                <Button className="rounded-full" size="sm" onClick={handleEdit}>
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-full border-border bg-transparent"
                  onClick={handleCancelEdit}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : message.content ? (
            <MessageMarkdown content={message.content} />
          ) : (
            <div className="flex items-center gap-2 py-2 text-muted-foreground">
              <div
                className="h-2 w-2 animate-bounce rounded-full bg-primary"
                style={{ animationDelay: "0ms" }}
              />
              <div
                className="h-2 w-2 animate-bounce rounded-full bg-primary"
                style={{ animationDelay: "150ms" }}
              />
              <div
                className="h-2 w-2 animate-bounce rounded-full bg-primary"
                style={{ animationDelay: "300ms" }}
              />
            </div>
          )}
        </div>

        {showSources && message.sources && message.sources.length > 0 ? (
          <div className="mt-4 rounded-[1.5rem] border border-border bg-card p-4">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Sources
            </p>
            <ul className="mt-3 space-y-2">
              {message.sources.map((source, index) => (
                <li key={`${source.url}-${index}`}>
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                  >
                    <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">
                      {source.title || source.url}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {message.citations && message.citations.length > 0 ? (
          <details className="mt-4 rounded-[1.5rem] border border-border bg-card p-4 text-sm text-muted-foreground">
            <summary className="cursor-pointer font-medium text-foreground">
              {message.citations.length} citation
              {message.citations.length === 1 ? "" : "s"}
            </summary>
            <ul className="mt-3 space-y-2">
              {message.citations.map((citation, index) => (
                <li key={`${citation.url}-${index}`}>
                  <a
                    href={citation.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-start gap-2 text-primary hover:underline"
                  >
                    <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    <span>{citation.title}</span>
                  </a>
                </li>
              ))}
            </ul>
          </details>
        ) : null}

        {message.content && !isEditing ? (
          <div
            className={cn(
              "mt-3 flex flex-wrap gap-1 opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100",
              isUser ? "justify-end" : "justify-start",
            )}
          >
            <Button
              variant="ghost"
              size="sm"
              className="h-8 rounded-full px-3 text-xs"
              onClick={handleCopy}
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  Copy
                </>
              )}
            </Button>

            {onEdit ? (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 rounded-full px-3 text-xs"
                onClick={handleEdit}
              >
                <Edit2 className="h-3.5 w-3.5" />
                Edit
              </Button>
            ) : null}

            {onDelete ? (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 rounded-full px-3 text-xs hover:text-destructive"
                onClick={() => onDelete(message.id)}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  )
}

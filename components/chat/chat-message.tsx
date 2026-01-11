"use client"

import type { Message } from "@/lib/types"
import { Bot, Copy, User, Check, Globe, ExternalLink, Edit2, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import ReactMarkdown from "react-markdown"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useState } from "react"
import { useToast } from "@/hooks/use-toast"

interface ChatMessageProps {
  message: Message
  onEdit?: (messageId: string, content: string) => void
  onDelete?: (messageId: string) => void
}

export function ChatMessage({ message, onEdit, onDelete }: ChatMessageProps) {
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
        title: "Copied!",
        description: "Message copied to clipboard.",
      })
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleEdit = () => {
    if (isEditing) {
      if (editContent.trim() && editContent !== message.content) {
        onEdit?.(message.id, editContent.trim())
      }
      setIsEditing(false)
    } else {
      setIsEditing(true)
    }
  }

  const handleCancelEdit = () => {
    setEditContent(message.content)
    setIsEditing(false)
  }

  const handleDelete = () => {
    onDelete?.(message.id)
  }

  return (
    <div
      className={cn("group flex gap-3 md:gap-4 px-3 md:px-4 py-4 md:py-6", isUser ? "bg-background" : "bg-muted/30")}
    >
      <div className="flex h-7 w-7 md:h-8 md:w-8 shrink-0 items-center justify-center rounded-full">
        {isUser ? (
          <div className="flex h-7 w-7 md:h-8 md:w-8 items-center justify-center rounded-full bg-primary">
            <User className="h-3 w-3 md:h-4 md:w-4 text-primary-foreground" />
          </div>
        ) : (
          <div className="flex h-7 w-7 md:h-8 md:w-8 items-center justify-center rounded-full bg-primary/10">
            <Bot className="h-3 w-3 md:h-4 md:w-4 text-primary" />
          </div>
        )}
      </div>
      <div className="flex-1 space-y-2 overflow-hidden">
        {message.webSearchUsed && (
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              <Globe className="mr-1 h-3 w-3" />
              Web Search Used
            </Badge>
            {message.sources && message.sources.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={() => setShowSources(!showSources)}
              >
                {showSources ? "Hide" : "Show"} {message.sources.length} source{message.sources.length !== 1 ? "s" : ""}
              </Button>
            )}
          </div>
        )}

        {/* Display sources if toggled */}
        {showSources && message.sources && message.sources.length > 0 && (
          <div className="rounded-lg border bg-card p-3 space-y-2">
            <h4 className="text-sm font-semibold">Sources:</h4>
            <ul className="space-y-1">
              {message.sources.map((source, index) => (
                <li key={index} className="text-xs">
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-primary hover:underline"
                  >
                    <ExternalLink className="h-3 w-3 flex-shrink-0" />
                    <span className="truncate">{source.title || source.url}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="prose prose-sm dark:prose-invert max-w-none">
          {isEditing ? (
            <div className="space-y-2">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full min-h-[100px] p-2 text-sm border rounded-md bg-background"
                autoFocus
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleEdit}>
                  Save
                </Button>
                <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : message.content ? (
            <ReactMarkdown
              components={{
                a: ({ href, children }) => (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline inline-flex items-center gap-1"
                  >
                    {children}
                    <ExternalLink className="h-3 w-3 inline" />
                  </a>
                ),
              }}
            >
              {message.content}
            </ReactMarkdown>
          ) : (
            <div className="flex items-center gap-2 text-muted-foreground">
              <div className="h-2 w-2 animate-bounce rounded-full bg-primary" style={{ animationDelay: "0ms" }} />
              <div className="h-2 w-2 animate-bounce rounded-full bg-primary" style={{ animationDelay: "150ms" }} />
              <div className="h-2 w-2 animate-bounce rounded-full bg-primary" style={{ animationDelay: "300ms" }} />
            </div>
          )}
        </div>

        {/* Display citations */}
        {message.citations && message.citations.length > 0 && (
          <div className="mt-2 pt-2 border-t">
            <details className="text-xs text-muted-foreground">
              <summary className="cursor-pointer hover:text-foreground">
                {message.citations.length} citation{message.citations.length !== 1 ? "s" : ""}
              </summary>
              <ul className="mt-2 space-y-1 pl-4">
                {message.citations.map((citation, index) => (
                  <li key={index}>
                    <a
                      href={citation.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline flex items-center gap-1"
                    >
                      <ExternalLink className="h-3 w-3 flex-shrink-0" />
                      {citation.title}
                    </a>
                  </li>
                ))}
              </ul>
            </details>
          </div>
        )}

        {message.content && !isEditing && (
          <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={handleCopy}
            >
              {copied ? (
                <>
                  <Check className="mr-1 h-3 w-3" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="mr-1 h-3 w-3" />
                  Copy
                </>
              )}
            </Button>
            {onEdit && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={handleEdit}
              >
                <Edit2 className="mr-1 h-3 w-3" />
                Edit
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs hover:text-destructive"
                onClick={handleDelete}
              >
                <Trash2 className="mr-1 h-3 w-3" />
                Delete
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Loader2, Send, Plus } from "lucide-react"
import { useStore } from "@/lib/store"
import { useToast } from "@/hooks/use-toast"
import { AgentSelector } from "./agent-selector"
import { ChatMessage } from "@/components/chat/chat-message"
import type { Message, ChatSession } from "@/lib/types"

export function ChatInterface() {
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [streamingMessage, setStreamingMessage] = useState("")
  const {
    currentAgentId,
    currentChatSessionId,
    agents,
    apiKeys,
    chatSessions,
    addChatSession,
    updateChatSession,
    editMessage,
    deleteMessage,
    setCurrentChatSessionId,
  } = useStore()
  const { toast } = useToast()
  const scrollRef = useRef<HTMLDivElement>(null)

  const currentSession = chatSessions.find((s) => s.id === currentChatSessionId)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [currentSession?.messages, streamingMessage])

  useEffect(() => {
    if (currentAgentId && !currentChatSessionId) {
      handleNewChat()
    }
  }, [currentAgentId])

  const handleNewChat = () => {
    if (!currentAgentId) {
      toast({
        title: "No agent selected",
        description: "Please select an agent first.",
        variant: "destructive",
      })
      return
    }

    const newSession: ChatSession = {
      id: Date.now().toString(),
      agentId: currentAgentId,
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    addChatSession(newSession)
    setCurrentChatSessionId(newSession.id)

    toast({
      title: "New chat started",
      description: "Started a new conversation.",
    })
  }

  const handleSend = async () => {
    if (!currentAgentId || !currentChatSessionId) {
      toast({
        title: "No active chat",
        description: "Please select an agent and start a chat.",
        variant: "destructive",
      })
      return
    }

    if (!apiKeys.openai) {
      toast({
        title: "OpenAI API key missing",
        description: "Please add your OpenAI API key in Settings.",
        variant: "destructive",
      })
      return
    }

    if (!input.trim()) return

    const agent = agents.find((a) => a.id === currentAgentId)
    if (!agent) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date().toISOString(),
    }

    const updatedMessages = [...(currentSession?.messages || []), userMessage]
    updateChatSession(currentChatSessionId, { messages: updatedMessages })

    setInput("")
    setIsLoading(true)
    setStreamingMessage("")

    try {
      // Import web search utilities
      const { makeWebSearchAPICall } = await import("@/lib/web-search")

      // Convert messages to API format
      const apiMessages = updatedMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }))

      // Make API call with web search support
      const { content, sources, citations } = await makeWebSearchAPICall(
        apiKeys.openai,
        agent.model,
        agent.systemPrompt,
        apiMessages,
        agent.enableWebSearch || false,
        (chunk) => {
          if (chunk) {
            setStreamingMessage((prev) => prev + chunk)
          }
        },
      )

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content,
        timestamp: new Date().toISOString(),
        webSearchUsed: agent.enableWebSearch && (sources.length > 0 || citations.length > 0),
        citations: citations.length > 0 ? citations : undefined,
        sources: sources.length > 0 ? sources : undefined,
      }

      updateChatSession(currentChatSessionId, {
        messages: [...updatedMessages, assistantMessage],
        updatedAt: new Date().toISOString(),
      })

      setStreamingMessage("")
    } catch (error) {
      console.error("[Chat] Error:", error)
      
      // Remove the empty assistant message that was created
      const currentSession = chatSessions.find((s) => s.id === currentChatSessionId)
      if (currentSession) {
        const lastMessage = currentSession.messages[currentSession.messages.length - 1]
        if (lastMessage && lastMessage.role === "assistant" && !lastMessage.content) {
          deleteMessage(currentChatSessionId, lastMessage.id)
        }
      }
      
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to get response. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleEditMessage = (messageId: string, content: string) => {
    if (!currentChatSessionId) return
    editMessage(currentChatSessionId, messageId, content)
    setIsLoading(false) // Stop any ongoing loading
    setStreamingMessage("") // Clear streaming message
  }

  const handleDeleteMessage = (messageId: string) => {
    if (!currentChatSessionId) return
    deleteMessage(currentChatSessionId, messageId)
    setIsLoading(false) // Stop any ongoing loading
    setStreamingMessage("") // Clear streaming message
  }

  return (
    <Card className="flex h-[600px] flex-col">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Chat with Agent</CardTitle>
            <CardDescription>Have a conversation with your AI freelancer agent</CardDescription>
          </div>
          <Button onClick={handleNewChat} size="sm" variant="outline">
            <Plus className="mr-2 h-4 w-4" />
            New Chat
          </Button>
        </div>
        <AgentSelector />
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4 overflow-hidden p-4">
        <ScrollArea ref={scrollRef} className="flex-1 pr-4">
          <div className="space-y-4">
            {(!currentSession?.messages || currentSession.messages.length === 0) && !streamingMessage && (
              <p className="text-center text-sm text-muted-foreground">Start a conversation with your agent...</p>
            )}
            {currentSession?.messages.map((message) => (
              <ChatMessage
                key={message.id}
                message={message}
                onEdit={message.role === "user" ? handleEditMessage : undefined}
                onDelete={handleDeleteMessage}
              />
            ))}
            {streamingMessage && (
              <ChatMessage
                message={{
                  id: "streaming",
                  role: "assistant",
                  content: streamingMessage,
                  timestamp: new Date().toISOString(),
                }}
              />
            )}
          </div>
        </ScrollArea>

        <div className="flex gap-2">
          <Input
            placeholder="Type your message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
            disabled={isLoading}
          />
          <Button onClick={handleSend} disabled={isLoading} size="icon">
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

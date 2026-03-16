"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MessageSquare, Plus } from "lucide-react"
import { useStore } from "@/lib/store"
import { useToast } from "@/hooks/use-toast"
import { AgentSelector } from "./agent-selector"

export function ChatInterface() {
  const router = useRouter()
  const { currentAgentId, agents, createNewChat, loadFromStorage, setCurrentAgentId } =
    useStore()
  const { toast } = useToast()

  useEffect(() => {
    loadFromStorage()
  }, [loadFromStorage])

  const handleNewChat = () => {
    const fallbackAgentId = currentAgentId ?? agents[0]?.id

    if (!fallbackAgentId) {
      toast({
        title: "No agent selected",
        description: "Please select an agent first.",
        variant: "destructive",
      })
      return
    }

    setCurrentAgentId(fallbackAgentId)
    createNewChat(fallbackAgentId)
    router.push("/chat")
  }

  return (
      <Card className="flex h-[600px] flex-col">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Open the full chat workspace</CardTitle>
            <CardDescription>
              Pick an agent here, then continue in the dedicated chat view.
            </CardDescription>
          </div>
          <Button onClick={handleNewChat} size="sm" variant="outline">
            <Plus className="mr-2 h-4 w-4" />
            New Chat
          </Button>
        </div>
        <AgentSelector />
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4 overflow-hidden p-4">
        <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 p-6 text-center">
          <div>
            <MessageSquare className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
            <p className="font-medium">Use the dedicated chat page for conversations</p>
            <p className="mt-2 text-sm text-muted-foreground">
              The new chat experience includes the full conversation canvas, recent history in the sidebar, and the updated composer.
            </p>
            <Button className="mt-4" onClick={handleNewChat}>
              Open Chat
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

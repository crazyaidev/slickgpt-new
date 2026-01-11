"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Bot, Database, Edit, MessageSquare, Search, Trash2 } from "lucide-react"
import type { Agent } from "@/lib/types"
import { useStore } from "@/lib/store"
import { useToast } from "@/hooks/use-toast"

interface AgentCardProps {
  agent: Agent
}

export function AgentCard({ agent }: AgentCardProps) {
  const router = useRouter()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const { deleteAgent, setCurrentAgentId, knowledgeBases } = useStore()
  const { toast } = useToast()

  const knowledgeBase = knowledgeBases.find((kb) => kb.id === agent.knowledgeBaseId)

  const handleDelete = () => {
    deleteAgent(agent.id)
    toast({
      title: "Agent deleted",
      description: `${agent.name} has been deleted successfully.`,
    })
    setShowDeleteDialog(false)
  }

  const handleChatClick = () => {
    setCurrentAgentId(agent.id)
    router.push("/chat")
  }

  const handleEditClick = () => {
    router.push(`/agents/${agent.id}/edit`)
  }

  return (
    <>
      <Card className="transition-shadow hover:shadow-md">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Bot className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">{agent.name}</CardTitle>
                <CardDescription className="text-xs">{agent.model}</CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <p className="mb-4 line-clamp-3 text-sm text-muted-foreground">{agent.systemPrompt}</p>

          <div className="flex flex-wrap gap-2">
            {knowledgeBase && (
              <Badge variant="secondary" className="gap-1">
                <Database className="h-3 w-3" />
                {knowledgeBase.name}
              </Badge>
            )}
            {agent.enableWebSearch && (
              <Badge variant="secondary" className="gap-1">
                <Search className="h-3 w-3" />
                Web Search
              </Badge>
            )}
            {agent.enableFileUpload && (
              <Badge variant="secondary" className="gap-1">
                File Upload
              </Badge>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex gap-2">
          <Button className="flex-1" onClick={handleChatClick}>
            <MessageSquare className="mr-2 h-4 w-4" />
            Chat
          </Button>
          <Button variant="outline" size="icon" onClick={handleEditClick}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => setShowDeleteDialog(true)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </CardFooter>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Agent</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{agent.name}"? This action cannot be undone and will delete all chat
              history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

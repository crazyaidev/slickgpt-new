"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
      <Card className="h-full gap-0 py-0 transition-shadow hover:shadow-md">
        <CardHeader className="gap-3 px-4 pb-3 pt-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Bot className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <CardTitle className="truncate text-base">{agent.name}</CardTitle>
              <CardDescription className="mt-1 truncate text-xs">
                {agent.model}
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-3 px-4 pb-3">
          <p className="line-clamp-2 text-sm leading-6 text-muted-foreground">
            {agent.systemPrompt}
          </p>

          <div className="flex flex-wrap gap-2">
            {knowledgeBase ? (
              <Badge variant="secondary" className="gap-1 text-[11px]">
                <Database className="h-3 w-3" />
                {knowledgeBase.name}
              </Badge>
            ) : null}
            {agent.enableWebSearch ? (
              <Badge variant="secondary" className="gap-1 text-[11px]">
                <Search className="h-3 w-3" />
                Web Search
              </Badge>
            ) : null}
            {agent.enableFileUpload ? (
              <Badge variant="secondary" className="text-[11px]">
                File Upload
              </Badge>
            ) : null}
          </div>
        </CardContent>

        <CardFooter className="mt-auto gap-2 px-4 pb-4 pt-0">
          <Button className="flex-1" size="sm" onClick={handleChatClick}>
            <MessageSquare className="h-4 w-4" />
            Chat
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={handleEditClick}
            aria-label={`Edit ${agent.name}`}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => setShowDeleteDialog(true)}
            aria-label={`Delete ${agent.name}`}
          >
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

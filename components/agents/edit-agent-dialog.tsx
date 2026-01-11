"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { useStore } from "@/lib/store"
import { useToast } from "@/hooks/use-toast"
import type { Agent } from "@/lib/types"

const OPENAI_MODELS = ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gpt-4", "gpt-3.5-turbo"]

interface EditAgentDialogProps {
  agent: Agent
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditAgentDialog({ agent, open, onOpenChange }: EditAgentDialogProps) {
  const [name, setName] = useState(agent.name)
  const [model, setModel] = useState(agent.model)
  const [systemPrompt, setSystemPrompt] = useState(agent.systemPrompt)
  const [knowledgeBaseId, setKnowledgeBaseId] = useState<string | null>(agent.knowledgeBaseId)
  const [enableWebSearch, setEnableWebSearch] = useState(agent.enableWebSearch || false)
  const [enableFileUpload, setEnableFileUpload] = useState(agent.enableFileUpload || false)
  const [temperature, setTemperature] = useState(agent.temperature || 0.7)

  const { updateAgent, knowledgeBases } = useStore()
  const { toast } = useToast()

  useEffect(() => {
    setName(agent.name)
    setModel(agent.model)
    setSystemPrompt(agent.systemPrompt)
    setKnowledgeBaseId(agent.knowledgeBaseId)
    setEnableWebSearch(agent.enableWebSearch || false)
    setEnableFileUpload(agent.enableFileUpload || false)
    setTemperature(agent.temperature || 0.7)
  }, [agent])

  const handleUpdate = () => {
    if (!name.trim()) {
      toast({
        title: "Name required",
        description: "Please enter a name for your agent.",
        variant: "destructive",
      })
      return
    }

    if (!systemPrompt.trim()) {
      toast({
        title: "System prompt required",
        description: "Please enter a system prompt for your agent.",
        variant: "destructive",
      })
      return
    }

    updateAgent(agent.id, {
      name,
      model,
      systemPrompt,
      knowledgeBaseId,
      enableWebSearch,
      enableFileUpload,
      temperature,
    })

    toast({
      title: "Agent updated!",
      description: `${name} has been updated successfully.`,
    })

    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Agent</DialogTitle>
          <DialogDescription>Update your agent's configuration.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="edit-agent-name">Agent Name</Label>
            <Input id="edit-agent-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-model">OpenAI Model</Label>
            <Select value={model} onValueChange={setModel}>
              <SelectTrigger id="edit-model">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {OPENAI_MODELS.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-system-prompt">System Prompt</Label>
            <Textarea
              id="edit-system-prompt"
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              rows={6}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-temperature">Temperature: {temperature.toFixed(1)}</Label>
            <Slider
              id="edit-temperature"
              min={0}
              max={2}
              step={0.1}
              value={[temperature]}
              onValueChange={(values) => setTemperature(values[0])}
            />
            <p className="text-xs text-muted-foreground">
              Controls randomness. Lower is more focused, higher is more creative.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-knowledge-base">Knowledge Base (Optional)</Label>
            <Select
              value={knowledgeBaseId || "none"}
              onValueChange={(v) => setKnowledgeBaseId(v === "none" ? null : v)}
            >
              <SelectTrigger id="edit-knowledge-base">
                <SelectValue placeholder="Select a knowledge base" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No knowledge base</SelectItem>
                {knowledgeBases.map((kb) => (
                  <SelectItem key={kb.id} value={kb.id}>
                    {kb.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4 rounded-lg border border-border p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="edit-enable-file-upload">Enable File Upload</Label>
                <p className="text-sm text-muted-foreground">Allow uploading files in chat (coming soon)</p>
              </div>
              <Switch id="edit-enable-file-upload" checked={enableFileUpload} onCheckedChange={setEnableFileUpload} />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="edit-enable-web-search">Enable Web Search</Label>
                <p className="text-sm text-muted-foreground">Allow agent to search the web (coming soon)</p>
              </div>
              <Switch id="edit-enable-web-search" checked={enableWebSearch} onCheckedChange={setEnableWebSearch} />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleUpdate}>Update Agent</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

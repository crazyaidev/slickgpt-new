"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Plus, RefreshCw } from "lucide-react"
import { useStore } from "@/lib/store"
import { useToast } from "@/hooks/use-toast"
import { useOpenAIModels } from "@/hooks/use-openai-models"
import type { Agent } from "@/lib/types"

export function CreateAgentDialog() {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [model, setModel] = useState("gpt-4o-mini")
  const [systemPrompt, setSystemPrompt] = useState(
    "You are an expert Upwork freelancer. Help create professional cover letters and proposals tailored to job descriptions. Be concise, professional, and highlight relevant experience.",
  )
  const [knowledgeBaseId, setKnowledgeBaseId] = useState<string | null>(null)
  const [enableWebSearch, setEnableWebSearch] = useState(false)
  const [enableFileUpload, setEnableFileUpload] = useState(false)
  const [temperature, setTemperature] = useState(0.7)

  const { addAgent, knowledgeBases } = useStore()
  const { toast } = useToast()
  const { models: openaiModels, isLoading: modelsLoading, refresh: refreshModels } = useOpenAIModels()

  const handleCreate = () => {
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

    const newAgent: Agent = {
      id: crypto.randomUUID(),
      name,
      model,
      systemPrompt,
      knowledgeBaseId,
      enableWebSearch,
      enableFileUpload,
      temperature,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    addAgent(newAgent)

    toast({
      title: "Agent created!",
      description: `${name} has been created successfully.`,
    })

    // Reset form
    setName("")
    setModel("gpt-4o-mini")
    setSystemPrompt(
      "You are an expert Upwork freelancer. Help create professional cover letters and proposals tailored to job descriptions. Be concise, professional, and highlight relevant experience.",
    )
    setKnowledgeBaseId(null)
    setEnableWebSearch(false)
    setEnableFileUpload(false)
    setTemperature(0.7)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Agent
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Agent</DialogTitle>
          <DialogDescription>
            Create an AI agent representing a freelancer with their own expertise and knowledge base.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="agent-name">Freelancer Name</Label>
            <Input
              id="agent-name"
              placeholder="e.g., John - Full Stack Developer"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="model">OpenAI Model</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => refreshModels()}
                className="h-6 text-xs"
                disabled={modelsLoading}
              >
                <RefreshCw className={`mr-1 h-3 w-3 ${modelsLoading ? "animate-spin" : ""}`} />
                {modelsLoading ? "Syncing..." : "Refresh"}
              </Button>
            </div>
            <Select value={model} onValueChange={setModel} disabled={modelsLoading}>
              <SelectTrigger id="model">
                <SelectValue placeholder={modelsLoading ? "Loading models..." : "Select a model"} />
              </SelectTrigger>
              <SelectContent>
                {openaiModels.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Models are synced from your OpenAI account. Make sure your API key is configured in Settings.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="system-prompt">System Prompt</Label>
            <Textarea
              id="system-prompt"
              placeholder="Define this freelancer's expertise, style, and approach..."
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              rows={6}
            />
            <p className="text-xs text-muted-foreground">
              Define this agent&apos;s personality, expertise, and how they should respond to clients.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="temperature">Temperature: {temperature.toFixed(1)}</Label>
            <Slider
              id="temperature"
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
            <Label htmlFor="knowledge-base">Knowledge Base (Optional)</Label>
            <Select
              value={knowledgeBaseId || "none"}
              onValueChange={(v) => setKnowledgeBaseId(v === "none" ? null : v)}
            >
              <SelectTrigger id="knowledge-base">
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
            <p className="text-xs text-muted-foreground">
              Link a knowledge base containing portfolio, past work, or reference materials for this freelancer.
            </p>
          </div>

          <div className="space-y-4 rounded-lg border border-border p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="enable-file-upload">Enable File Upload</Label>
                <p className="text-sm text-muted-foreground">Allow uploading files in chat (coming soon)</p>
              </div>
              <Switch id="enable-file-upload" checked={enableFileUpload} onCheckedChange={setEnableFileUpload} />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="enable-web-search">Enable Web Search</Label>
                <p className="text-sm text-muted-foreground">Allow agent to search the web (coming soon)</p>
              </div>
              <Switch id="enable-web-search" checked={enableWebSearch} onCheckedChange={setEnableWebSearch} />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreate}>Create Agent</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

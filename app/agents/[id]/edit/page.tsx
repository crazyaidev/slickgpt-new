"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { SidebarNav } from "@/components/sidebar-nav"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { useStore } from "@/lib/store"
import { useToast } from "@/hooks/use-toast"
import { useOpenAIModels } from "@/hooks/use-openai-models"
import { ArrowLeft, Save, RefreshCw } from "lucide-react"
import type { Agent } from "@/lib/types"

export default function EditAgentPage() {
  const router = useRouter()
  const params = useParams()
  const agentId = params?.id as string
  const { agents, updateAgent, knowledgeBases, loadFromStorage } = useStore()
  const { toast } = useToast()
  const { models: openaiModels, isLoading: modelsLoading, refresh: refreshModels } = useOpenAIModels()

  const [agent, setAgent] = useState<Agent | null>(null)
  const [name, setName] = useState("")
  const [model, setModel] = useState("gpt-4o")
  const [systemPrompt, setSystemPrompt] = useState("")
  const [knowledgeBaseId, setKnowledgeBaseId] = useState<string | null>(null)
  const [enableWebSearch, setEnableWebSearch] = useState(false)
  const [enableFileUpload, setEnableFileUpload] = useState(false)
  const [temperature, setTemperature] = useState(0.7)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    loadFromStorage()
  }, [loadFromStorage])

  useEffect(() => {
    if (agents.length > 0) {
      const foundAgent = agents.find((a) => a.id === agentId)
      if (foundAgent) {
        setAgent(foundAgent)
        setName(foundAgent.name)
        setModel(foundAgent.model)
        setSystemPrompt(foundAgent.systemPrompt)
        setKnowledgeBaseId(foundAgent.knowledgeBaseId)
        setEnableWebSearch(foundAgent.enableWebSearch || false)
        setEnableFileUpload(foundAgent.enableFileUpload || false)
        setTemperature(foundAgent.temperature || 0.7)
      } else {
        toast({
          title: "Agent not found",
          description: "The requested agent could not be found.",
          variant: "destructive",
        })
        router.push("/agents")
      }
    }
  }, [agents, agentId, router, toast])

  const handleSave = () => {
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

    setIsSaving(true)

    updateAgent(agentId, {
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

    setTimeout(() => {
      setIsSaving(false)
      router.push("/agents")
    }, 500)
  }

  const handleCancel = () => {
    router.push("/agents")
  }

  if (!agent) {
    return (
      <div className="fixed inset-0 flex overflow-hidden">
        <SidebarNav />
        <main className="ml-64 flex flex-1 flex-col overflow-hidden">
          <div className="flex h-16 shrink-0 items-center border-b border-border bg-card px-8">
            <h2 className="text-xl font-semibold text-foreground">Loading...</h2>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 flex overflow-hidden">
      <SidebarNav />
      <main className="ml-64 flex flex-1 flex-col overflow-hidden">
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-card px-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={handleCancel}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h2 className="text-xl font-semibold text-foreground">Edit Agent</h2>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              <Save className="mr-2 h-4 w-4" />
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-7xl px-8 py-8">
            <div className="mb-8">
              <h3 className="mb-2 text-2xl font-bold text-foreground">Agent Configuration</h3>
              <p className="text-base text-muted-foreground">
                Customize your agent's behavior, model, and capabilities
              </p>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                  <CardDescription>Set the name and model for your agent</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="agent-name">Agent Name</Label>
                    <Input
                      id="agent-name"
                      placeholder="My AI Assistant"
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
                      Choose the OpenAI model that best fits your needs. Models are synced from your OpenAI account.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>System Prompt</CardTitle>
                  <CardDescription>
                    Define your agent's personality, behavior, and instructions. This is the core of your agent's
                    identity.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Label htmlFor="system-prompt" className="text-base">
                      Instructions
                    </Label>
                    <Textarea
                      id="system-prompt"
                      placeholder="You are a helpful AI assistant that..."
                      value={systemPrompt}
                      onChange={(e) => setSystemPrompt(e.target.value)}
                      rows={25}
                      className="font-mono text-sm resize-y min-h-[500px] w-full"
                    />
                    <p className="text-xs text-muted-foreground">
                      Write detailed instructions about how your agent should behave, what tone to use, what tasks it
                      can perform, and any specific guidelines it should follow.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Model Parameters</CardTitle>
                  <CardDescription>Fine-tune the AI model's behavior</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
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
                      Controls randomness in responses. Lower values (0.0-0.5) make output more focused and
                      deterministic. Higher values (1.0-2.0) make it more creative and diverse.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Knowledge & Capabilities</CardTitle>
                  <CardDescription>Connect knowledge bases and enable additional features</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
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
                      Attach a knowledge base to provide your agent with custom information and context.
                    </p>
                  </div>

                  <div className="space-y-4 rounded-lg border border-border p-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="enable-file-upload" className="text-base">
                          Enable File Upload
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Allow users to upload files in chat conversations (coming soon)
                        </p>
                      </div>
                      <Switch
                        id="enable-file-upload"
                        checked={enableFileUpload}
                        onCheckedChange={setEnableFileUpload}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="enable-web-search" className="text-base">
                          Enable Web Search
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Allow agent to search the web for real-time information (coming soon)
                        </p>
                      </div>
                      <Switch id="enable-web-search" checked={enableWebSearch} onCheckedChange={setEnableWebSearch} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="mt-8 flex justify-end gap-2">
              <Button variant="outline" onClick={handleCancel} size="lg">
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving} size="lg">
                <Save className="mr-2 h-4 w-4" />
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

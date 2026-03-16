"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, RefreshCw, Save, Sparkles } from "lucide-react"

import { AppShell } from "@/components/app-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { useOpenAIModels } from "@/hooks/use-openai-models"
import { useStore } from "@/lib/store"
import type { Agent } from "@/lib/types"

export default function EditAgentPage() {
  const router = useRouter()
  const params = useParams()
  const agentId = params?.id as string
  const { agents, updateAgent, knowledgeBases, loadFromStorage } = useStore()
  const { toast } = useToast()
  const {
    models: openaiModels,
    isLoading: modelsLoading,
    refresh: refreshModels,
  } = useOpenAIModels()

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
      const foundAgent = agents.find((item) => item.id === agentId)

      if (!foundAgent) {
        toast({
          title: "Assistant not found",
          description: "The requested assistant could not be found.",
          variant: "destructive",
        })
        router.push("/agents")
        return
      }

      setAgent(foundAgent)
      setName(foundAgent.name)
      setModel(foundAgent.model)
      setSystemPrompt(foundAgent.systemPrompt)
      setKnowledgeBaseId(foundAgent.knowledgeBaseId)
      setEnableWebSearch(foundAgent.enableWebSearch || false)
      setEnableFileUpload(foundAgent.enableFileUpload || false)
      setTemperature(foundAgent.temperature || 0.7)
    }
  }, [agents, agentId, router, toast])

  const handleSave = () => {
    if (!name.trim()) {
      toast({
        title: "Name required",
        description: "Please enter a name for your assistant.",
        variant: "destructive",
      })
      return
    }

    if (!systemPrompt.trim()) {
      toast({
        title: "Prompt required",
        description: "Please enter a system prompt for your assistant.",
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
      title: "Assistant updated",
      description: `${name} is ready with the latest configuration.`,
    })

    setTimeout(() => {
      setIsSaving(false)
      router.push("/agents")
    }, 450)
  }

  if (!agent) {
    return (
      <AppShell title="Edit assistant" description="Loading assistant details...">
        <div className="rounded-[2rem] border border-border/70 bg-card/80 p-8 backdrop-blur">
          <p className="text-sm text-muted-foreground">Loading assistant details...</p>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell
      title={`Edit ${agent.name}`}
      description="Refine the prompt, tools, and defaults that shape every reply."
      action={
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="rounded-2xl border-border/70 bg-background/60"
            onClick={() => router.push("/agents")}
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <Button
            className="rounded-2xl px-5"
            onClick={handleSave}
            disabled={isSaving}
          >
            <Save className="h-4 w-4" />
            {isSaving ? "Saving..." : "Save changes"}
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        <section className="rounded-[2rem] border border-border/70 bg-card/80 p-6 shadow-[0_20px_80px_-52px_rgba(0,0,0,0.65)] backdrop-blur md:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                <Sparkles className="h-3.5 w-3.5" />
                Assistant tuning
              </div>
              <h2 className="text-3xl font-semibold tracking-tight">
                Keep the assistant focused on one job.
              </h2>
              <p className="mt-3 text-base leading-7 text-muted-foreground">
                The clearer the instructions and boundaries, the more consistent
                the chat experience will feel.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <SummaryTile label="Model" value={model} />
              <SummaryTile
                label="Knowledge"
                value={knowledgeBaseId ? "Connected" : "None"}
              />
              <SummaryTile
                label="Temperature"
                value={temperature.toFixed(1)}
              />
            </div>
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
          <div className="space-y-6">
            <Card className="rounded-[2rem] border-border/70 bg-card/80 backdrop-blur">
              <CardHeader className="border-b border-border/70">
                <CardTitle>Basics</CardTitle>
                <CardDescription>
                  Name the assistant and choose which model powers it.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <div className="space-y-2">
                  <p className="text-sm font-medium">Assistant name</p>
                  <Input
                    placeholder="My AI assistant"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    className="h-12 rounded-2xl border-border/70 bg-background/60"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium">OpenAI model</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="rounded-xl"
                      onClick={() => refreshModels()}
                      disabled={modelsLoading}
                    >
                      <RefreshCw
                        className={`h-3.5 w-3.5 ${modelsLoading ? "animate-spin" : ""}`}
                      />
                      {modelsLoading ? "Syncing..." : "Refresh"}
                    </Button>
                  </div>
                  <Select
                    value={model}
                    onValueChange={setModel}
                    disabled={modelsLoading}
                  >
                    <SelectTrigger className="h-12 rounded-2xl border-border/70 bg-background/60">
                      <SelectValue
                        placeholder={modelsLoading ? "Loading models..." : "Select a model"}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {openaiModels.map((entry) => (
                        <SelectItem key={entry} value={entry}>
                          {entry}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-[2rem] border-border/70 bg-card/80 backdrop-blur">
              <CardHeader className="border-b border-border/70">
                <CardTitle>Capabilities</CardTitle>
                <CardDescription>
                  Add optional context and turn on extra tools.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <div className="space-y-2">
                  <p className="text-sm font-medium">Knowledge base</p>
                  <Select
                    value={knowledgeBaseId || "none"}
                    onValueChange={(value) =>
                      setKnowledgeBaseId(value === "none" ? null : value)
                    }
                  >
                    <SelectTrigger className="h-12 rounded-2xl border-border/70 bg-background/60">
                      <SelectValue placeholder="Select a knowledge base" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No knowledge base</SelectItem>
                      {knowledgeBases.map((knowledgeBase) => (
                        <SelectItem key={knowledgeBase.id} value={knowledgeBase.id}>
                          {knowledgeBase.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3 rounded-[1.5rem] border border-border/70 bg-background/60 p-4">
                  <ToolToggle
                    title="Enable file upload"
                    description="Prepare the assistant for attachment-aware chat workflows."
                    checked={enableFileUpload}
                    onCheckedChange={setEnableFileUpload}
                  />
                  <ToolToggle
                    title="Enable web search"
                    description="Let the assistant reach for fresh information during chat."
                    checked={enableWebSearch}
                    onCheckedChange={setEnableWebSearch}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-[2rem] border-border/70 bg-card/80 backdrop-blur">
              <CardHeader className="border-b border-border/70">
                <CardTitle>Response style</CardTitle>
                <CardDescription>
                  Lower temperatures stay tighter. Higher temperatures explore more.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <div className="flex items-center justify-between text-sm font-medium">
                  <span>Temperature</span>
                  <span>{temperature.toFixed(1)}</span>
                </div>
                <Slider
                  min={0}
                  max={2}
                  step={0.1}
                  value={[temperature]}
                  onValueChange={(values) => setTemperature(values[0])}
                />
              </CardContent>
            </Card>
          </div>

          <Card className="rounded-[2rem] border-border/70 bg-card/80 backdrop-blur">
            <CardHeader className="border-b border-border/70">
              <CardTitle>System prompt</CardTitle>
              <CardDescription>
                This prompt sets the assistant's voice, constraints, and default
                behavior in chat.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <Textarea
                value={systemPrompt}
                onChange={(event) => setSystemPrompt(event.target.value)}
                placeholder="You are a helpful assistant that..."
                rows={24}
                className="min-h-[520px] rounded-[1.5rem] border-border/70 bg-background/60 font-mono text-sm"
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  )
}

function SummaryTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.5rem] border border-border/70 bg-background/70 p-4">
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground/80">
        {label}
      </p>
      <p className="mt-2 text-lg font-semibold">{value}</p>
    </div>
  )
}

function ToolToggle({
  title,
  description,
  checked,
  onCheckedChange,
}: {
  title: string
  description: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="space-y-1">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  )
}

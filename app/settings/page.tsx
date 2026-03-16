"use client"

import { Suspense, useEffect, useState } from "react"
import { Check, Eye, EyeOff, Key, Lock, Sparkles } from "lucide-react"

import { AppShell } from "@/components/app-shell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useStore } from "@/lib/store"
import { useToast } from "@/hooks/use-toast"

function SettingsContent() {
  const { apiKeys, setApiKeys, loadFromStorage } = useStore()
  const { toast } = useToast()

  const [openaiKey, setOpenaiKey] = useState("")
  const [pineconeKey, setPineconeKey] = useState("")
  const [webSearchKey, setWebSearchKey] = useState("")

  const [showOpenaiKey, setShowOpenaiKey] = useState(false)
  const [showPineconeKey, setShowPineconeKey] = useState(false)
  const [showWebSearchKey, setShowWebSearchKey] = useState(false)

  useEffect(() => {
    loadFromStorage()
  }, [loadFromStorage])

  useEffect(() => {
    setOpenaiKey(apiKeys.openai || "")
    setPineconeKey(apiKeys.pinecone || "")
    setWebSearchKey(apiKeys.webSearch || "")
  }, [apiKeys])

  const handleSave = () => {
    setApiKeys({
      openai: openaiKey,
      pinecone: pineconeKey,
      webSearch: webSearchKey,
    })

    toast({
      title: "Settings saved",
      description: "Your workspace keys are updated and ready to use.",
    })
  }

  const configuredCount = [openaiKey, pineconeKey, webSearchKey].filter(Boolean)
    .length

  return (
    <AppShell
      title="Settings"
      description="Store the keys and defaults that power your workspace."
      action={
        <Button className="rounded-2xl px-5" onClick={handleSave}>
          Save changes
        </Button>
      }
    >
      <div className="space-y-6">
        <section className="rounded-[2rem] border border-border/70 bg-card/80 p-6 shadow-[0_20px_80px_-52px_rgba(0,0,0,0.65)] backdrop-blur md:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                <Sparkles className="h-3.5 w-3.5" />
                Workspace configuration
              </div>
              <h2 className="text-3xl font-semibold tracking-tight">
                Keep configuration simple and close to the chat experience.
              </h2>
              <p className="mt-3 text-base leading-7 text-muted-foreground">
                Keys are stored in the browser for this workspace, so setup stays
                local and fast while you iterate on assistants.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-[1.5rem] border border-border/70 bg-background/70 p-4">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground/80">
                  Configured
                </p>
                <p className="mt-2 text-2xl font-semibold">{configuredCount}</p>
                <p className="text-sm text-muted-foreground">Keys saved locally</p>
              </div>
              <div className="rounded-[1.5rem] border border-border/70 bg-background/70 p-4">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground/80">
                  Required
                </p>
                <p className="mt-2 text-2xl font-semibold">
                  {openaiKey ? "Ready" : "OpenAI"}
                </p>
                <p className="text-sm text-muted-foreground">
                  Needed for every chat
                </p>
              </div>
              <div className="rounded-[1.5rem] border border-border/70 bg-background/70 p-4">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground/80">
                  Security
                </p>
                <p className="mt-2 text-2xl font-semibold">Local</p>
                <p className="text-sm text-muted-foreground">
                  Stored in browser storage
                </p>
              </div>
            </div>
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-4">
            <KeyFieldCard
              title="OpenAI API key"
              description="Required for chat, model syncing, and assistant responses."
              href="https://platform.openai.com/api-keys"
              placeholder="sk-..."
              value={openaiKey}
              onChange={setOpenaiKey}
              showValue={showOpenaiKey}
              onToggleShow={() => setShowOpenaiKey((current) => !current)}
              isConfigured={Boolean(openaiKey)}
            />

            <KeyFieldCard
              title="Pinecone API key"
              description="Optional if you want an external vector database workflow."
              href="https://www.pinecone.io"
              placeholder="Enter Pinecone API key"
              value={pineconeKey}
              onChange={setPineconeKey}
              showValue={showPineconeKey}
              onToggleShow={() => setShowPineconeKey((current) => !current)}
              isConfigured={Boolean(pineconeKey)}
            />

            <KeyFieldCard
              title="Web search API key"
              description="Optional if you want a separate search provider in addition to OpenAI-backed browsing."
              placeholder="Enter web search API key"
              value={webSearchKey}
              onChange={setWebSearchKey}
              showValue={showWebSearchKey}
              onToggleShow={() => setShowWebSearchKey((current) => !current)}
              isConfigured={Boolean(webSearchKey)}
            />
          </div>

          <div className="space-y-4">
            <div className="rounded-[2rem] border border-border/70 bg-card/80 p-6 backdrop-blur">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Lock className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold">How this is stored</h3>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                Keys in this app are persisted in browser storage so the
                interface can stay responsive without a separate backend config
                flow.
              </p>
            </div>

            <div className="rounded-[2rem] border border-border/70 bg-card/80 p-6 backdrop-blur">
              <h3 className="text-lg font-semibold">Recommended order</h3>
              <div className="mt-4 space-y-3">
                <div className="rounded-[1.35rem] border border-border/70 bg-background/60 p-4">
                  <p className="font-medium">1. Add OpenAI first</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    This unlocks model syncing and every assistant response.
                  </p>
                </div>
                <div className="rounded-[1.35rem] border border-border/70 bg-background/60 p-4">
                  <p className="font-medium">2. Create an assistant</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Separate different workflows into dedicated prompts.
                  </p>
                </div>
                <div className="rounded-[1.35rem] border border-border/70 bg-background/60 p-4">
                  <p className="font-medium">3. Add knowledge when needed</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Bring in portfolio pieces, notes, or reference docs later.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  )
}

interface KeyFieldCardProps {
  title: string
  description: string
  href?: string
  placeholder: string
  value: string
  onChange: (value: string) => void
  showValue: boolean
  onToggleShow: () => void
  isConfigured: boolean
}

function KeyFieldCard({
  title,
  description,
  href,
  placeholder,
  value,
  onChange,
  showValue,
  onToggleShow,
  isConfigured,
}: KeyFieldCardProps) {
  return (
    <div className="rounded-[2rem] border border-border/70 bg-card/80 p-6 backdrop-blur">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Key className="h-5 w-5" />
          </div>
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
            {description}{" "}
            {href ? (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-primary hover:underline"
              >
                Learn more
              </a>
            ) : null}
          </p>
        </div>

        {isConfigured ? (
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <Check className="h-3.5 w-3.5" />
            Configured
          </div>
        ) : null}
      </div>

      <div className="mt-6 flex gap-3">
        <div className="relative flex-1">
          <Input
            type={showValue ? "text" : "password"}
            placeholder={placeholder}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            className="h-12 rounded-2xl border-border/70 bg-background/60 pr-12"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-2 top-1/2 h-8 w-8 -translate-y-1/2 rounded-xl"
            onClick={onToggleShow}
            aria-label={showValue ? "Hide key" : "Show key"}
          >
            {showValue ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function SettingsPage() {
  return (
    <Suspense fallback={null}>
      <SettingsContent />
    </Suspense>
  )
}

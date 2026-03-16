"use client"

import { useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowRight,
  Bot,
  Database,
  MessageSquare,
  Plus,
  Settings,
  Sparkles,
} from "lucide-react"

import { AppShell } from "@/components/app-shell"
import { CreateAgentDialog } from "@/components/agents/create-agent-dialog"
import { Button } from "@/components/ui/button"
import { useStore } from "@/lib/store"

export default function DashboardPage() {
  const router = useRouter()
  const {
    agents,
    knowledgeBases,
    chatSessions,
    loadFromStorage,
    setCurrentAgentId,
    setCurrentChatId,
  } = useStore()

  useEffect(() => {
    loadFromStorage()
  }, [loadFromStorage])

  const recentChats = [...chatSessions]
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    )
    .slice(0, 5)
  const activeKnowledgeConnections = agents.filter(
    (agent) => agent.knowledgeBaseId,
  ).length

  const openChat = (agentId: string, chatId?: string) => {
    setCurrentAgentId(agentId)
    if (chatId) {
      setCurrentChatId(chatId)
    }
    router.push("/chat")
  }

  return (
    <AppShell
      title="Dashboard"
      description="Start a conversation, jump back into recent work, or tune the assistants behind it."
      action={<CreateAgentDialog />}
    >
      <div className="space-y-6">
        <section className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
          <div className="overflow-hidden rounded-[2rem] border border-border/70 bg-card/80 p-6 shadow-[0_20px_80px_-48px_rgba(0,0,0,0.65)] backdrop-blur xl:p-8">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              Conversation-first workspace
            </div>

            <div className="max-w-3xl space-y-4">
              <h2 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
                Build a ChatGPT-style workspace around your own assistants.
              </h2>
              <p className="text-base leading-7 text-muted-foreground md:text-lg">
                Keep prompts, knowledge, and chat history in one place so it is
                easy to jump from setup into real conversations.
              </p>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Button
                size="lg"
                className="rounded-2xl px-5"
                onClick={() => {
                  if (agents.length > 0) {
                    openChat(agents[0].id)
                    return
                  }

                  router.push("/agents")
                }}
              >
                <MessageSquare className="h-4 w-4" />
                Start chatting
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="rounded-2xl border-border/70 bg-background/50 px-5"
                asChild
              >
                <Link href="/agents">
                  Manage assistants
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>

            <div className="mt-8 grid gap-3 md:grid-cols-3">
              <div className="rounded-[1.5rem] border border-border/70 bg-background/70 p-4">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Bot className="h-5 w-5" />
                </div>
                <p className="text-2xl font-semibold">{agents.length}</p>
                <p className="text-sm text-muted-foreground">Assistants ready</p>
              </div>

              <div className="rounded-[1.5rem] border border-border/70 bg-background/70 p-4">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <MessageSquare className="h-5 w-5" />
                </div>
                <p className="text-2xl font-semibold">{chatSessions.length}</p>
                <p className="text-sm text-muted-foreground">Conversations saved</p>
              </div>

              <div className="rounded-[1.5rem] border border-border/70 bg-background/70 p-4">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Database className="h-5 w-5" />
                </div>
                <p className="text-2xl font-semibold">
                  {activeKnowledgeConnections}
                </p>
                <p className="text-sm text-muted-foreground">
                  Assistants linked to knowledge
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-border/70 bg-card/80 p-6 shadow-[0_20px_70px_-52px_rgba(0,0,0,0.65)] backdrop-blur">
            <h3 className="text-lg font-semibold">Start faster</h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              These are the setup steps that most improve the chat experience.
            </p>

            <div className="mt-6 space-y-3">
              <Link
                href="/settings"
                className="flex items-start gap-3 rounded-[1.5rem] border border-border/70 bg-background/65 p-4 transition-colors hover:bg-background"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Settings className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium">Add your OpenAI key</p>
                  <p className="text-sm text-muted-foreground">
                    Sync models and unlock chat.
                  </p>
                </div>
              </Link>

              <Link
                href="/rag"
                className="flex items-start gap-3 rounded-[1.5rem] border border-border/70 bg-background/65 p-4 transition-colors hover:bg-background"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Database className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium">Load context into knowledge</p>
                  <p className="text-sm text-muted-foreground">
                    Keep portfolio, notes, and source material close.
                  </p>
                </div>
              </Link>

              <div className="flex items-start gap-3 rounded-[1.5rem] border border-border/70 bg-background/65 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Plus className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium">Create your next assistant</p>
                  <p className="text-sm text-muted-foreground">
                    Separate prompts by workflow, client type, or voice.
                  </p>
                </div>
                <CreateAgentDialog />
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-[2rem] border border-border/70 bg-card/80 p-6 backdrop-blur">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold">Recent conversations</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Resume work exactly where you left off.
                </p>
              </div>
              <Button
                variant="ghost"
                className="rounded-2xl"
                asChild
              >
                <Link href="/chat">Open chat</Link>
              </Button>
            </div>

            {recentChats.length > 0 ? (
              <div className="space-y-3">
                {recentChats.map((session) => {
                  const agent = agents.find((item) => item.id === session.agentId)

                  return (
                    <button
                      key={session.id}
                      type="button"
                      onClick={() => openChat(session.agentId, session.id)}
                      className="flex w-full items-start gap-3 rounded-[1.35rem] border border-border/70 bg-background/60 p-4 text-left transition-colors hover:bg-background"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                        <MessageSquare className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">
                          {session.title || "New chat"}
                        </p>
                        <p className="mt-1 truncate text-sm text-muted-foreground">
                          {agent?.name ?? "Assistant"} · {session.messages.length} messages
                        </p>
                      </div>
                    </button>
                  )
                })}
              </div>
            ) : (
              <div className="rounded-[1.5rem] border border-dashed border-border/80 bg-background/55 p-6 text-sm text-muted-foreground">
                Start a conversation and it will show up here for quick access.
              </div>
            )}
          </div>

          <div className="rounded-[2rem] border border-border/70 bg-card/80 p-6 backdrop-blur">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold">Your assistants</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Pick an assistant and drop into its latest conversation.
                </p>
              </div>
              <Button variant="ghost" className="rounded-2xl" asChild>
                <Link href="/agents">See all</Link>
              </Button>
            </div>

            {agents.length > 0 ? (
              <div className="space-y-3">
                {agents.slice(0, 5).map((agent) => (
                  <button
                    key={agent.id}
                    type="button"
                    onClick={() => openChat(agent.id)}
                    className="flex w-full items-start gap-3 rounded-[1.35rem] border border-border/70 bg-background/60 p-4 text-left transition-colors hover:bg-background"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <Bot className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{agent.name}</p>
                      <p className="mt-1 truncate text-sm text-muted-foreground">
                        {agent.model}
                      </p>
                    </div>
                    <ArrowRight className="mt-1 h-4 w-4 text-muted-foreground" />
                  </button>
                ))}
              </div>
            ) : (
              <div className="rounded-[1.5rem] border border-dashed border-border/80 bg-background/55 p-6 text-sm text-muted-foreground">
                No assistants yet. Create one to begin building a conversational workflow.
              </div>
            )}
          </div>
        </section>
      </div>
    </AppShell>
  )
}

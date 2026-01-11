"use client"

import { useEffect } from "react"
import { SidebarNav } from "@/components/sidebar-nav"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Bot, Database, MessageSquare, Plus } from "lucide-react"
import { useStore } from "@/lib/store"
import Link from "next/link"

export default function DashboardPage() {
  const { agents, knowledgeBases, chatSessions, loadFromStorage } = useStore()

  useEffect(() => {
    loadFromStorage()
  }, [loadFromStorage])

  const totalChats = chatSessions.length

  return (
    <div className="fixed inset-0 flex overflow-hidden">
      <SidebarNav />
      <main className="ml-64 flex flex-1 flex-col overflow-hidden">
        <div className="flex h-16 shrink-0 items-center border-b border-border bg-card px-8">
          <h2 className="text-xl font-semibold text-foreground">Dashboard</h2>
        </div>

        <div className="flex-1 overflow-y-auto p-8">
          <div className="mb-8">
            <h3 className="mb-2 text-2xl font-bold text-foreground">Welcome to AI Agent Builder</h3>
            <p className="text-base text-muted-foreground">
              Create and manage custom AI agents representing freelancers with their own expertise and knowledge bases
            </p>
          </div>

          <div className="mb-8 grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Bot className="h-5 w-5 text-primary" />
                  Agents
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">{agents.length}</div>
                <p className="text-sm text-muted-foreground">Active freelancer agents</p>
                <Link href="/agents">
                  <Button variant="outline" size="sm" className="mt-4 w-full bg-transparent">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Agent
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  Conversations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">{totalChats}</div>
                <p className="text-sm text-muted-foreground">Total chat sessions</p>
                <Link href="/agents">
                  <Button variant="outline" size="sm" className="mt-4 w-full bg-transparent">
                    Start Chatting
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Database className="h-5 w-5 text-primary" />
                  Knowledge Bases
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">{knowledgeBases.length}</div>
                <p className="text-sm text-muted-foreground">RAG databases</p>
                <Link href="/rag">
                  <Button variant="outline" size="sm" className="mt-4 w-full bg-transparent">
                    Manage RAG
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Getting Started</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-4">
                <li className="flex items-start gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                    1
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">Add your OpenAI API key</p>
                    <p className="text-sm text-muted-foreground">
                      Go to{" "}
                      <Link href="/settings" className="text-primary hover:underline">
                        Settings
                      </Link>{" "}
                      to configure your API keys
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                    2
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">Create knowledge bases (Optional)</p>
                    <p className="text-sm text-muted-foreground">
                      Add portfolio items, past work, and expertise to{" "}
                      <Link href="/rag" className="text-primary hover:underline">
                        RAG Pipeline
                      </Link>
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                    3
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">Create your first agent</p>
                    <p className="text-sm text-muted-foreground">
                      Go to{" "}
                      <Link href="/agents" className="text-primary hover:underline">
                        Agents
                      </Link>{" "}
                      and create a freelancer agent with custom expertise
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                    4
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">Start chatting</p>
                    <p className="text-sm text-muted-foreground">
                      Click on an agent to start a conversation and get help with Upwork bidding
                    </p>
                  </div>
                </li>
              </ol>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

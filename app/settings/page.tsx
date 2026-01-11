"use client"

import { useEffect, useState, Suspense } from "react"
import { SidebarNav } from "@/components/sidebar-nav"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useStore } from "@/lib/store"
import { useToast } from "@/hooks/use-toast"
import { Check, Eye, EyeOff, Key } from "lucide-react"

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
      title: "Settings saved!",
      description: "Your API keys have been updated successfully.",
    })
  }

  return (
    <div className="fixed inset-0 flex overflow-hidden">
      <SidebarNav />
      <main className="ml-64 flex flex-1 flex-col overflow-hidden">
        <div className="flex h-16 shrink-0 items-center border-b border-border bg-card px-8">
          <h2 className="text-xl font-semibold text-foreground">Settings</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-8">
          <div className="mx-auto max-w-3xl space-y-6">
            <div>
              <h3 className="mb-2 text-2xl font-bold text-foreground">API Configuration</h3>
              <p className="text-base text-muted-foreground">Manage your API keys for AI services</p>
            </div>
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Key className="h-5 w-5 text-primary" />
                  <CardTitle className="text-base md:text-lg">OpenAI API Key</CardTitle>
                </div>
                <CardDescription className="text-xs md:text-sm">
                  Required for all AI features. Get your API key from{" "}
                  <a
                    href="https://platform.openai.com/api-keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline"
                  >
                    OpenAI Platform
                  </a>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="openai-key">API Key</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        id="openai-key"
                        type={showOpenaiKey ? "text" : "password"}
                        placeholder="sk-..."
                        value={openaiKey}
                        onChange={(e) => setOpenaiKey(e.target.value)}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2"
                        onClick={() => setShowOpenaiKey(!showOpenaiKey)}
                      >
                        {showOpenaiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    {openaiKey && (
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10">
                        <Check className="h-5 w-5 text-primary" />
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Key className="h-5 w-5 text-primary" />
                  <CardTitle className="text-base md:text-lg">Pinecone API Key</CardTitle>
                </div>
                <CardDescription className="text-xs md:text-sm">
                  Optional. For vector database and RAG features. Sign up at{" "}
                  <a
                    href="https://www.pinecone.io"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline"
                  >
                    pinecone.io
                  </a>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="pinecone-key">API Key</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        id="pinecone-key"
                        type={showPineconeKey ? "text" : "password"}
                        placeholder="Enter Pinecone API key"
                        value={pineconeKey}
                        onChange={(e) => setPineconeKey(e.target.value)}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2"
                        onClick={() => setShowPineconeKey(!showPineconeKey)}
                      >
                        {showPineconeKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    {pineconeKey && (
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10">
                        <Check className="h-5 w-5 text-primary" />
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Key className="h-5 w-5 text-primary" />
                  <CardTitle className="text-base md:text-lg">Web Search API Key</CardTitle>
                </div>
                <CardDescription className="text-xs md:text-sm">
                  Optional. For web search features (coming soon)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="web-search-key">API Key</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        id="web-search-key"
                        type={showWebSearchKey ? "text" : "password"}
                        placeholder="Enter web search API key"
                        value={webSearchKey}
                        onChange={(e) => setWebSearchKey(e.target.value)}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2"
                        onClick={() => setShowWebSearchKey(!showWebSearchKey)}
                      >
                        {showWebSearchKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    {webSearchKey && (
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10">
                        <Check className="h-5 w-5 text-primary" />
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
            <div className="flex justify-end">
              <Button onClick={handleSave} size="lg" className="w-full md:w-auto">
                Save Settings
              </Button>
            </div>
          </div>
        </div>
      </main>
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

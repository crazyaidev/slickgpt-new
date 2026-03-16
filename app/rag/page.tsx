"use client"

import { Suspense, useEffect, useState } from "react"
import {
  Database,
  FileText,
  Globe,
  Loader2,
  Search,
  Sparkles,
} from "lucide-react"

import { AppShell } from "@/components/app-shell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { useStore } from "@/lib/store"
import { useToast } from "@/hooks/use-toast"
import { storage } from "@/lib/storage"
import type { VectorDocument } from "@/lib/types"

function RAGContent() {
  const { apiKeys, loadFromStorage } = useStore()
  const { toast } = useToast()
  const [documents, setDocuments] = useState<VectorDocument[]>([])

  const [url, setUrl] = useState("")
  const [isEmbeddingUrl, setIsEmbeddingUrl] = useState(false)

  const [fileContent, setFileContent] = useState("")
  const [fileName, setFileName] = useState("")
  const [isEmbeddingFile, setIsEmbeddingFile] = useState(false)

  const [query, setQuery] = useState("")
  const [queryResult, setQueryResult] = useState("")
  const [isQuerying, setIsQuerying] = useState(false)

  useEffect(() => {
    loadFromStorage()
    setDocuments(storage.getVectorDocuments())
  }, [loadFromStorage])

  const handleEmbedUrl = async () => {
    if (!url.trim()) {
      toast({
        title: "URL required",
        description: "Please enter a URL to embed.",
        variant: "destructive",
      })
      return
    }

    if (!apiKeys.openai) {
      toast({
        title: "API key missing",
        description: "Please add your OpenAI API key in Settings.",
        variant: "destructive",
      })
      return
    }

    setIsEmbeddingUrl(true)

    try {
      const response = await fetch(url)
      const text = await response.text()
      const cleanText = text
        .replace(/<[^>]*>/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 5000)

      const embeddingResponse = await fetch("https://api.openai.com/v1/embeddings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKeys.openai}`,
        },
        body: JSON.stringify({
          model: "text-embedding-ada-002",
          input: cleanText,
        }),
      })

      if (!embeddingResponse.ok) {
        throw new Error("Failed to create embedding")
      }

      const newDoc: VectorDocument = {
        id: Date.now().toString(),
        content: cleanText,
        metadata: {
          source: url,
          type: "url",
          createdAt: new Date().toISOString(),
        },
      }

      const updatedDocs = [...documents, newDoc]
      setDocuments(updatedDocs)
      storage.saveVectorDocuments(updatedDocs)

      toast({
        title: "URL embedded",
        description: "The page content has been added to your local knowledge store.",
      })

      setUrl("")
    } catch (error) {
      console.error("[Knowledge] Error embedding URL:", error)
      toast({
        title: "Error",
        description: "Failed to embed the URL. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsEmbeddingUrl(false)
    }
  }

  const handleEmbedFile = async () => {
    if (!fileContent.trim()) {
      toast({
        title: "Content required",
        description: "Please paste or upload file content to embed.",
        variant: "destructive",
      })
      return
    }

    if (!apiKeys.openai) {
      toast({
        title: "API key missing",
        description: "Please add your OpenAI API key in Settings.",
        variant: "destructive",
      })
      return
    }

    setIsEmbeddingFile(true)

    try {
      const embeddingResponse = await fetch("https://api.openai.com/v1/embeddings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKeys.openai}`,
        },
        body: JSON.stringify({
          model: "text-embedding-ada-002",
          input: fileContent.slice(0, 5000),
        }),
      })

      if (!embeddingResponse.ok) {
        throw new Error("Failed to create embedding")
      }

      const newDoc: VectorDocument = {
        id: Date.now().toString(),
        content: fileContent,
        metadata: {
          source: fileName || "Uploaded file",
          type: "file",
          createdAt: new Date().toISOString(),
        },
      }

      const updatedDocs = [...documents, newDoc]
      setDocuments(updatedDocs)
      storage.saveVectorDocuments(updatedDocs)

      toast({
        title: "File embedded",
        description: "The file content has been added to your local knowledge store.",
      })

      setFileContent("")
      setFileName("")
    } catch (error) {
      console.error("[Knowledge] Error embedding file:", error)
      toast({
        title: "Error",
        description: "Failed to embed the file. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsEmbeddingFile(false)
    }
  }

  const handleQuery = async () => {
    if (!query.trim()) {
      toast({
        title: "Query required",
        description: "Please enter a question to search your knowledge.",
        variant: "destructive",
      })
      return
    }

    if (!apiKeys.openai) {
      toast({
        title: "API key missing",
        description: "Please add your OpenAI API key in Settings.",
        variant: "destructive",
      })
      return
    }

    if (documents.length === 0) {
      toast({
        title: "No documents",
        description: "Embed a URL or file first so there is something to query.",
        variant: "destructive",
      })
      return
    }

    setIsQuerying(true)

    try {
      const relevantDocs = documents.slice(0, 3)
      const context = relevantDocs.map((doc) => doc.content).join("\n\n")

      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKeys.openai}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content:
                "You are a helpful assistant. Use the provided context to answer questions. If the context doesn't contain relevant information, say so.",
            },
            {
              role: "user",
              content: `Context:\n${context}\n\nQuestion: ${query}`,
            },
          ],
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to query")
      }

      const data = await response.json()
      setQueryResult(data.choices[0].message.content)

      toast({
        title: "Knowledge queried",
        description: "The answer below was generated from your embedded content.",
      })
    } catch (error) {
      console.error("[Knowledge] Error querying:", error)
      toast({
        title: "Error",
        description: "Failed to query the knowledge store. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsQuerying(false)
    }
  }

  return (
    <AppShell
      title="RAG Pipeline"
      description="Bring URLs and documents into the workspace so assistants can answer with more context."
    >
      <div className="space-y-6">
        <section className="rounded-[2rem] border border-border/70 bg-card/80 p-6 shadow-[0_20px_80px_-52px_rgba(0,0,0,0.65)] backdrop-blur md:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                <Sparkles className="h-3.5 w-3.5" />
                Retrieval workspace
              </div>
              <h2 className="text-3xl font-semibold tracking-tight">
                Load source material once, then reuse it in every chat.
              </h2>
              <p className="mt-3 text-base leading-7 text-muted-foreground">
                Save background context locally so proposal writing, research,
                and answer generation can start from better information.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <KnowledgeStatCard
                icon={Database}
                label="Documents"
                value={documents.length}
              />
              <KnowledgeStatCard
                icon={Globe}
                label="URLs"
                value={documents.filter((doc) => doc.metadata.type === "url").length}
              />
              <KnowledgeStatCard
                icon={FileText}
                label="Files"
                value={documents.filter((doc) => doc.metadata.type === "file").length}
              />
            </div>
          </div>
        </section>

        <Tabs defaultValue="url" className="space-y-5">
          <TabsList className="h-auto w-full flex-wrap justify-start gap-2 rounded-[1.75rem] border border-border/70 bg-card/70 p-2">
            <TabsTrigger value="url" className="h-10 rounded-2xl px-4">
              <Globe className="h-4 w-4" />
              Embed URL
            </TabsTrigger>
            <TabsTrigger value="file" className="h-10 rounded-2xl px-4">
              <FileText className="h-4 w-4" />
              Embed file
            </TabsTrigger>
            <TabsTrigger value="query" className="h-10 rounded-2xl px-4">
              <Search className="h-4 w-4" />
              Query
            </TabsTrigger>
            <TabsTrigger value="documents" className="h-10 rounded-2xl px-4">
              <Database className="h-4 w-4" />
              Documents
            </TabsTrigger>
          </TabsList>

          <TabsContent value="url">
            <KnowledgePanel
              title="Embed URL content"
              description="Fetch a page, strip it down to text, and store it locally for later retrieval."
            >
              <div className="space-y-4">
                <Input
                  type="url"
                  placeholder="https://example.com/article"
                  value={url}
                  onChange={(event) => setUrl(event.target.value)}
                  className="h-12 rounded-2xl border-border/70 bg-background/60"
                />
                <Button
                  onClick={handleEmbedUrl}
                  disabled={isEmbeddingUrl}
                  className="h-11 rounded-2xl px-5"
                >
                  {isEmbeddingUrl ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Globe className="h-4 w-4" />
                  )}
                  {isEmbeddingUrl ? "Embedding..." : "Embed URL"}
                </Button>
              </div>
            </KnowledgePanel>
          </TabsContent>

          <TabsContent value="file">
            <KnowledgePanel
              title="Embed file content"
              description="Paste notes, proposals, or source material and keep it in the workspace for later use."
            >
              <div className="space-y-4">
                <Input
                  placeholder="document.txt"
                  value={fileName}
                  onChange={(event) => setFileName(event.target.value)}
                  className="h-12 rounded-2xl border-border/70 bg-background/60"
                />
                <Textarea
                  placeholder="Paste your file content here..."
                  value={fileContent}
                  onChange={(event) => setFileContent(event.target.value)}
                  rows={10}
                  className="rounded-[1.5rem] border-border/70 bg-background/60"
                />
                <Button
                  onClick={handleEmbedFile}
                  disabled={isEmbeddingFile}
                  className="h-11 rounded-2xl px-5"
                >
                  {isEmbeddingFile ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <FileText className="h-4 w-4" />
                  )}
                  {isEmbeddingFile ? "Embedding..." : "Embed file"}
                </Button>
              </div>
            </KnowledgePanel>
          </TabsContent>

          <TabsContent value="query">
            <KnowledgePanel
              title="Query your knowledge"
              description="Ask a question and get an answer grounded in the embedded material above."
            >
              <div className="space-y-4">
                <Textarea
                  placeholder="Ask a question about your embedded documents..."
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  rows={4}
                  className="rounded-[1.5rem] border-border/70 bg-background/60"
                />
                <Button
                  onClick={handleQuery}
                  disabled={isQuerying}
                  className="h-11 rounded-2xl px-5"
                >
                  {isQuerying ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                  {isQuerying ? "Searching..." : "Query knowledge"}
                </Button>

                {queryResult ? (
                  <div className="rounded-[1.5rem] border border-border/70 bg-background/60 p-5">
                    <p className="mb-2 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground/80">
                      Answer
                    </p>
                    <p className="whitespace-pre-wrap text-sm leading-6 text-foreground">
                      {queryResult}
                    </p>
                  </div>
                ) : null}
              </div>
            </KnowledgePanel>
          </TabsContent>

          <TabsContent value="documents">
            <KnowledgePanel
              title="Embedded documents"
              description="Everything stored locally for retrieval and future assistant context."
            >
              {documents.length === 0 ? (
                <div className="rounded-[1.5rem] border border-dashed border-border/80 bg-background/55 p-6 text-sm text-muted-foreground">
                  No documents yet. Embed a URL or paste a file to start building
                  the workspace memory.
                </div>
              ) : (
                <div className="space-y-3">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="rounded-[1.5rem] border border-border/70 bg-background/60 p-4"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex min-w-0 items-start gap-3">
                          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                            {doc.metadata.type === "url" ? (
                              <Globe className="h-4 w-4" />
                            ) : (
                              <FileText className="h-4 w-4" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="break-all font-medium">
                              {doc.metadata.source}
                            </p>
                            <p className="mt-1 text-sm text-muted-foreground">
                              {new Date(doc.metadata.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                      <p className="mt-4 line-clamp-3 text-sm leading-6 text-muted-foreground">
                        {doc.content}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </KnowledgePanel>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  )
}

function KnowledgeStatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Database
  label: string
  value: number
}) {
  return (
    <div className="rounded-[1.5rem] border border-border/70 bg-background/70 p-4">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-2xl font-semibold">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  )
}

function KnowledgePanel({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-[2rem] border border-border/70 bg-card/80 p-6 backdrop-blur md:p-7">
      <h3 className="text-xl font-semibold">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        {description}
      </p>
      <div className="mt-6">{children}</div>
    </div>
  )
}

export default function RAGPage() {
  return (
    <Suspense fallback={null}>
      <RAGContent />
    </Suspense>
  )
}

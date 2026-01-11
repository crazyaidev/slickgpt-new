"use client"

import { useEffect, useState, Suspense } from "react"
import { SidebarNav } from "@/components/sidebar-nav"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useStore } from "@/lib/store"
import { useToast } from "@/hooks/use-toast"
import { Database, FileText, Globe, Loader2, Search } from "lucide-react"
import { storage } from "@/lib/storage"
import type { VectorDocument } from "@/lib/types"

function RAGContent() {
  const { apiKeys, loadFromStorage } = useStore()
  const { toast } = useToast()
  const [documents, setDocuments] = useState<VectorDocument[]>([])

  const [url, setUrl] = useState<string>("")
  const [isEmbeddingUrl, setIsEmbeddingUrl] = useState(false)

  const [fileContent, setFileContent] = useState<string>("")
  const [fileName, setFileName] = useState<string>("")
  const [isEmbeddingFile, setIsEmbeddingFile] = useState(false)

  const [query, setQuery] = useState<string>("")
  const [queryResult, setQueryResult] = useState<string>("")
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

      const embeddingData = await embeddingResponse.json()

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
        title: "URL embedded successfully!",
        description: "The URL content has been embedded and stored.",
      })

      setUrl("")
    } catch (error) {
      console.error("[v0] Error embedding URL:", error)
      toast({
        title: "Error",
        description: "Failed to embed URL. Please try again.",
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

      const embeddingData = await embeddingResponse.json()

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
        title: "File embedded successfully!",
        description: "The file content has been embedded and stored.",
      })

      setFileContent("")
      setFileName("")
    } catch (error) {
      console.error("[v0] Error embedding file:", error)
      toast({
        title: "Error",
        description: "Failed to embed file. Please try again.",
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
        description: "Please enter a query to search.",
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
        description: "Please embed some URLs or files first.",
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
          model: "gpt-3.5-turbo",
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
        title: "Query completed!",
        description: "Retrieved answer from your knowledge base.",
      })
    } catch (error) {
      console.error("[v0] Error querying RAG:", error)
      toast({
        title: "Error",
        description: "Failed to query. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsQuerying(false)
    }
  }

  return (
    <div className="fixed inset-0 flex overflow-hidden">
      <SidebarNav />
      <main className="ml-64 flex flex-1 flex-col overflow-hidden">
        <div className="flex h-16 shrink-0 items-center border-b border-border bg-card px-8">
          <h2 className="text-xl font-semibold text-foreground">RAG Pipeline</h2>
        </div>

        <div className="flex-1 overflow-y-auto p-8">
          <div className="mb-8">
            <h3 className="mb-2 text-2xl font-bold text-foreground">Retrieval-Augmented Generation</h3>
            <p className="text-base text-muted-foreground">
              Build a knowledge base by embedding URLs and files, then query them with your agents
            </p>
          </div>

          <div className="mb-8 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Database className="h-5 w-5 text-primary" />
                  Vector Database
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{documents.length}</div>
                <p className="text-sm text-muted-foreground">Documents embedded</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Globe className="h-5 w-5 text-primary" />
                  URL Sources
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {documents.filter((d) => d.metadata.type === "url").length}
                </div>
                <p className="text-sm text-muted-foreground">URLs embedded</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileText className="h-5 w-5 text-primary" />
                  File Sources
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {documents.filter((d) => d.metadata.type === "file").length}
                </div>
                <p className="text-sm text-muted-foreground">Files embedded</p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="url" className="space-y-6">
            <TabsList className="w-full justify-start overflow-x-auto">
              <TabsTrigger value="url">Embed URL</TabsTrigger>
              <TabsTrigger value="file">Embed File</TabsTrigger>
              <TabsTrigger value="query">Query RAG</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
            </TabsList>

            <TabsContent value="url">
              <Card>
                <CardHeader>
                  <CardTitle>Embed URL Content</CardTitle>
                  <CardDescription>
                    Fetch content from a URL, create embeddings, and add to your knowledge base
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="url">URL</Label>
                    <Input
                      id="url"
                      type="url"
                      placeholder="https://example.com/article"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                    />
                  </div>

                  <Button onClick={handleEmbedUrl} disabled={isEmbeddingUrl} className="w-full">
                    {isEmbeddingUrl && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isEmbeddingUrl ? "Embedding..." : "Embed URL"}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="file">
              <Card>
                <CardHeader>
                  <CardTitle>Embed File Content</CardTitle>
                  <CardDescription>
                    Paste or upload file content to create embeddings and add to your knowledge base
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="file-name">File Name (Optional)</Label>
                    <Input
                      id="file-name"
                      placeholder="document.txt"
                      value={fileName}
                      onChange={(e) => setFileName(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="file-content">File Content</Label>
                    <Textarea
                      id="file-content"
                      placeholder="Paste your file content here..."
                      value={fileContent}
                      onChange={(e) => setFileContent(e.target.value)}
                      rows={10}
                    />
                  </div>

                  <Button onClick={handleEmbedFile} disabled={isEmbeddingFile} className="w-full">
                    {isEmbeddingFile && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isEmbeddingFile ? "Embedding..." : "Embed File"}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="query">
              <Card>
                <CardHeader>
                  <CardTitle>Query Knowledge Base</CardTitle>
                  <CardDescription>Search your embedded documents and get AI-powered answers</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="query">Query</Label>
                    <Textarea
                      id="query"
                      placeholder="Ask a question about your embedded documents..."
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      rows={3}
                    />
                  </div>

                  <Button onClick={handleQuery} disabled={isQuerying} className="w-full">
                    {isQuerying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isQuerying ? "Searching..." : "Query"}
                    {!isQuerying && <Search className="ml-2 h-4 w-4" />}
                  </Button>

                  {queryResult && (
                    <div className="space-y-2">
                      <Label>Answer</Label>
                      <div className="rounded-lg border border-border bg-muted p-4">
                        <p className="whitespace-pre-wrap text-sm text-foreground">{queryResult}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="documents">
              <Card>
                <CardHeader>
                  <CardTitle>Embedded Documents</CardTitle>
                  <CardDescription>View all documents in your knowledge base</CardDescription>
                </CardHeader>
                <CardContent>
                  {documents.length === 0 ? (
                    <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
                      No documents embedded yet
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {documents.map((doc) => (
                        <div key={doc.id} className="rounded-lg border border-border p-4">
                          <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                            <div className="flex items-center gap-2">
                              {doc.metadata.type === "url" ? (
                                <Globe className="h-4 w-4 shrink-0 text-primary" />
                              ) : (
                                <FileText className="h-4 w-4 shrink-0 text-primary" />
                              )}
                              <span className="break-all font-medium text-foreground text-sm md:text-base">
                                {doc.metadata.source}
                              </span>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {new Date(doc.metadata.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="line-clamp-2 text-sm text-muted-foreground">{doc.content}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
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

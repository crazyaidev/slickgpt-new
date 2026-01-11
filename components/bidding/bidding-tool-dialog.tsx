"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Briefcase, FileText, Loader2, MessageSquare, Upload } from "lucide-react"
import { useStore } from "@/lib/store"
import { useToast } from "@/hooks/use-toast"
import { AgentSelector } from "../dashboard/agent-selector"
import type { Message } from "@/lib/types"

export function BiddingToolDialog() {
  const [open, setOpen] = useState(false)
  const { currentAgentId, agents, settings } = useStore()
  const { toast } = useToast()

  // Cover letter generation
  const [jobTitle, setJobTitle] = useState("")
  const [jobDescription, setJobDescription] = useState("")
  const [clientDetails, setClientDetails] = useState("")
  const [generatedCoverLetter, setGeneratedCoverLetter] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)

  // Proposal generation
  const [proposalJobDescription, setProposalJobDescription] = useState("")
  const [proposalBudget, setProposalBudget] = useState("")
  const [proposalTimeline, setProposalTimeline] = useState("")
  const [generatedProposal, setGeneratedProposal] = useState("")
  const [isGeneratingProposal, setIsGeneratingProposal] = useState(false)

  // Chat simulator
  const [chatMessages, setChatMessages] = useState<Message[]>([])
  const [chatInput, setChatInput] = useState("")
  const [isLoadingChat, setIsLoadingChat] = useState(false)

  // Image analysis
  const [imageAnalysis, setImageAnalysis] = useState("")
  const [imageDescription, setImageDescription] = useState("")
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false)

  const handleGenerateCoverLetter = async () => {
    if (!currentAgentId) {
      toast({
        title: "No agent selected",
        description: "Please select an agent first.",
        variant: "destructive",
      })
      return
    }

    if (!settings.openaiApiKey) {
      toast({
        title: "API key missing",
        description: "Please add your OpenAI API key in Settings.",
        variant: "destructive",
      })
      return
    }

    if (!jobDescription.trim()) {
      toast({
        title: "Job description required",
        description: "Please enter a job description.",
        variant: "destructive",
      })
      return
    }

    setIsGenerating(true)
    const agent = agents.find((a) => a.id === currentAgentId)
    const modelName = agent?.model || "gpt-3.5-turbo"
    const isReasoningModel = modelName.toLowerCase().includes('o1') || modelName.toLowerCase().includes('o3')

    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${settings.openaiApiKey}`,
        },
        body: JSON.stringify({
          model: modelName,
          messages: [
            {
              role: "system",
              content:
                agent?.systemPrompt ||
                "You are an expert at writing Upwork cover letters. Create professional, compelling cover letters.",
            },
            {
              role: "user",
              content: `Generate a cover letter for this Upwork job:

Job Title: ${jobTitle || "Not specified"}
Job Description: ${jobDescription}
Client Details: ${clientDetails || "Not provided"}

My Profile:
${settings.userProfile || "Not provided"}

Create a tailored, professional cover letter that highlights relevant experience and demonstrates value.`,
            },
          ],
          // Only add temperature for models that support it
          ...(isReasoningModel ? {} : { temperature: 0.7 }),
        }),
      })

      if (!response.ok) throw new Error("Failed to generate")

      const data = await response.json()
      setGeneratedCoverLetter(data.choices[0].message.content)

      toast({
        title: "Cover letter generated!",
        description: "Your cover letter is ready.",
      })
    } catch (error) {
      console.error("[v0] Error generating cover letter:", error)
      toast({
        title: "Error",
        description: "Failed to generate cover letter.",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleGenerateProposal = async () => {
    if (!currentAgentId) {
      toast({
        title: "No agent selected",
        description: "Please select an agent first.",
        variant: "destructive",
      })
      return
    }

    if (!settings.openaiApiKey) {
      toast({
        title: "API key missing",
        description: "Please add your OpenAI API key in Settings.",
        variant: "destructive",
      })
      return
    }

    if (!proposalJobDescription.trim()) {
      toast({
        title: "Job description required",
        description: "Please enter a job description.",
        variant: "destructive",
      })
      return
    }

    setIsGeneratingProposal(true)
    const agent = agents.find((a) => a.id === currentAgentId)
    const modelName = agent?.model || "gpt-3.5-turbo"
    const isReasoningModel = modelName.toLowerCase().includes('o1') || modelName.toLowerCase().includes('o3')

    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${settings.openaiApiKey}`,
        },
        body: JSON.stringify({
          model: modelName,
          messages: [
            {
              role: "system",
              content:
                "You are an expert at creating Upwork project proposals. Use multi-step reasoning: 1) Analyze requirements, 2) Draft solution approach, 3) Refine and optimize.",
            },
            {
              role: "user",
              content: `Create a detailed project proposal for:

Job Description: ${proposalJobDescription}
Proposed Budget: ${proposalBudget || "To be discussed"}
Timeline: ${proposalTimeline || "Flexible"}

My Profile:
${settings.userProfile || "Not provided"}

Create a comprehensive proposal with: understanding of requirements, proposed approach, timeline breakdown, and deliverables.`,
            },
          ],
          // Only add temperature for models that support it
          ...(isReasoningModel ? {} : { temperature: 0.7 }),
        }),
      })

      if (!response.ok) throw new Error("Failed to generate")

      const data = await response.json()
      setGeneratedProposal(data.choices[0].message.content)

      toast({
        title: "Proposal generated!",
        description: "Your project proposal is ready.",
      })
    } catch (error) {
      console.error("[v0] Error generating proposal:", error)
      toast({
        title: "Error",
        description: "Failed to generate proposal.",
        variant: "destructive",
      })
    } finally {
      setIsGeneratingProposal(false)
    }
  }

  const handleSendChatMessage = async () => {
    if (!currentAgentId) {
      toast({
        title: "No agent selected",
        description: "Please select an agent first.",
        variant: "destructive",
      })
      return
    }

    if (!settings.openaiApiKey) {
      toast({
        title: "API key missing",
        description: "Please add your OpenAI API key in Settings.",
        variant: "destructive",
      })
      return
    }

    if (!chatInput.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: chatInput,
      timestamp: new Date().toISOString(),
    }

    setChatMessages((prev) => [...prev, userMessage])
    setChatInput("")
    setIsLoadingChat(true)

    const agent = agents.find((a) => a.id === currentAgentId)

    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${settings.openaiApiKey}`,
        },
        body: JSON.stringify({
          model: agent?.model || "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content:
                "You are role-playing as a potential Upwork client. Ask clarifying questions, express concerns, and engage in realistic conversation about project requirements.",
            },
            ...chatMessages.map((m) => ({
              role: m.role,
              content: m.content,
            })),
            {
              role: "user",
              content: chatInput,
            },
          ],
        }),
      })

      if (!response.ok) throw new Error("Failed to get response")

      const data = await response.json()
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.choices[0].message.content,
        timestamp: new Date().toISOString(),
      }

      setChatMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.error("[v0] Chat error:", error)
      toast({
        title: "Error",
        description: "Failed to get response.",
        variant: "destructive",
      })
    } finally {
      setIsLoadingChat(false)
    }
  }

  const handleAnalyzeImage = async () => {
    if (!settings.openaiApiKey) {
      toast({
        title: "API key missing",
        description: "Please add your OpenAI API key in Settings.",
        variant: "destructive",
      })
      return
    }

    if (!imageDescription.trim()) {
      toast({
        title: "Description required",
        description: "Please describe the image or provide context.",
        variant: "destructive",
      })
      return
    }

    setIsAnalyzingImage(true)

    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${settings.openaiApiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4",
          messages: [
            {
              role: "system",
              content: "You are an expert at analyzing job requirements from descriptions and screenshots.",
            },
            {
              role: "user",
              content: `Analyze this job-related information and provide insights:

${imageDescription}

Provide analysis including: key requirements, potential challenges, recommended approach, and estimated effort.`,
            },
          ],
        }),
      })

      if (!response.ok) throw new Error("Failed to analyze")

      const data = await response.json()
      setImageAnalysis(data.choices[0].message.content)

      toast({
        title: "Analysis complete!",
        description: "Image analysis is ready.",
      })
    } catch (error) {
      console.error("[v0] Error analyzing image:", error)
      toast({
        title: "Error",
        description: "Failed to analyze image.",
        variant: "destructive",
      })
    } finally {
      setIsAnalyzingImage(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Briefcase className="mr-2 h-4 w-4" />
          Open Bidding Tool
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-5xl overflow-hidden">
        <DialogHeader>
          <DialogTitle>Upwork Bidding Tool</DialogTitle>
          <DialogDescription>
            Generate cover letters, proposals, practice client conversations, and analyze job details
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="cover-letter" className="h-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="cover-letter">Cover Letter</TabsTrigger>
            <TabsTrigger value="proposal">Proposal</TabsTrigger>
            <TabsTrigger value="chat">Client Chat</TabsTrigger>
            <TabsTrigger value="analysis">Job Analysis</TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[calc(90vh-200px)] pr-4">
            <TabsContent value="cover-letter" className="space-y-4">
              <div className="space-y-2">
                <Label>Select Agent</Label>
                <AgentSelector />
              </div>

              <div className="space-y-2">
                <Label htmlFor="job-title">Job Title</Label>
                <Input
                  id="job-title"
                  placeholder="e.g., Full-Stack Developer"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="job-desc">Job Description</Label>
                <Textarea
                  id="job-desc"
                  placeholder="Paste the job description here..."
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  rows={6}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="client-details">Client Details (Optional)</Label>
                <Textarea
                  id="client-details"
                  placeholder="Any information about the client..."
                  value={clientDetails}
                  onChange={(e) => setClientDetails(e.target.value)}
                  rows={3}
                />
              </div>

              <Button onClick={handleGenerateCoverLetter} disabled={isGenerating} className="w-full">
                {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isGenerating ? "Generating..." : "Generate Cover Letter"}
              </Button>

              {generatedCoverLetter && (
                <div className="space-y-2">
                  <Label>Generated Cover Letter</Label>
                  <Textarea value={generatedCoverLetter} readOnly rows={15} />
                  <Button
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(generatedCoverLetter)
                      toast({ title: "Copied!", description: "Cover letter copied to clipboard." })
                    }}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Copy to Clipboard
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="proposal" className="space-y-4">
              <div className="space-y-2">
                <Label>Select Agent</Label>
                <AgentSelector />
              </div>

              <div className="space-y-2">
                <Label htmlFor="proposal-desc">Job Description</Label>
                <Textarea
                  id="proposal-desc"
                  placeholder="Paste the project description..."
                  value={proposalJobDescription}
                  onChange={(e) => setProposalJobDescription(e.target.value)}
                  rows={8}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="budget">Proposed Budget</Label>
                  <Input
                    id="budget"
                    placeholder="e.g., $2000-$3000"
                    value={proposalBudget}
                    onChange={(e) => setProposalBudget(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timeline">Timeline</Label>
                  <Input
                    id="timeline"
                    placeholder="e.g., 2-3 weeks"
                    value={proposalTimeline}
                    onChange={(e) => setProposalTimeline(e.target.value)}
                  />
                </div>
              </div>

              <Button onClick={handleGenerateProposal} disabled={isGeneratingProposal} className="w-full">
                {isGeneratingProposal && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isGeneratingProposal ? "Generating..." : "Generate Proposal"}
              </Button>

              {generatedProposal && (
                <div className="space-y-2">
                  <Label>Generated Proposal</Label>
                  <Textarea value={generatedProposal} readOnly rows={15} />
                  <Button
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(generatedProposal)
                      toast({ title: "Copied!", description: "Proposal copied to clipboard." })
                    }}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Copy to Clipboard
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="chat" className="space-y-4">
              <div className="space-y-2">
                <Label>Select Agent</Label>
                <AgentSelector />
              </div>

              <div className="rounded-lg border border-border bg-muted/50 p-4">
                <p className="text-sm text-muted-foreground">
                  Practice your client communication. The AI will role-play as a potential client asking questions about
                  your services.
                </p>
              </div>

              <div className="space-y-4">
                <ScrollArea className="h-[300px] rounded-lg border border-border p-4">
                  {chatMessages.length === 0 && (
                    <p className="text-center text-sm text-muted-foreground">Start a conversation with a client...</p>
                  )}
                  {chatMessages.map((message) => (
                    <div
                      key={message.id}
                      className={`mb-4 flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg px-4 py-2 ${
                          message.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary text-secondary-foreground"
                        }`}
                      >
                        <p className="whitespace-pre-wrap text-sm">{message.content}</p>
                      </div>
                    </div>
                  ))}
                </ScrollArea>

                <div className="flex gap-2">
                  <Input
                    placeholder="Type your message..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault()
                        handleSendChatMessage()
                      }
                    }}
                    disabled={isLoadingChat}
                  />
                  <Button onClick={handleSendChatMessage} disabled={isLoadingChat}>
                    {isLoadingChat ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <MessageSquare className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="analysis" className="space-y-4">
              <div className="rounded-lg border border-border bg-muted/50 p-4">
                <p className="text-sm text-muted-foreground">
                  Describe a job posting or provide details from a screenshot to get AI-powered analysis and insights.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="image-desc">Job Details / Description</Label>
                <Textarea
                  id="image-desc"
                  placeholder="Describe the job requirements, paste details, or explain what you see in a screenshot..."
                  value={imageDescription}
                  onChange={(e) => setImageDescription(e.target.value)}
                  rows={8}
                />
              </div>

              <Button onClick={handleAnalyzeImage} disabled={isAnalyzingImage} className="w-full">
                {isAnalyzingImage && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isAnalyzingImage ? "Analyzing..." : "Analyze Job"}
                {!isAnalyzingImage && <Upload className="ml-2 h-4 w-4" />}
              </Button>

              {imageAnalysis && (
                <div className="space-y-2">
                  <Label>Analysis Results</Label>
                  <div className="rounded-lg border border-border bg-muted p-4">
                    <p className="whitespace-pre-wrap text-sm text-foreground">{imageAnalysis}</p>
                  </div>
                </div>
              )}
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

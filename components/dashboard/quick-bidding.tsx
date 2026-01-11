"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Loader2 } from "lucide-react"
import { useStore } from "@/lib/store"
import { useToast } from "@/hooks/use-toast"
import { AgentSelector } from "./agent-selector"
import { BiddingToolDialog } from "../bidding/bidding-tool-dialog"

export function QuickBidding() {
  const [jobDescription, setJobDescription] = useState("")
  const [generatedCoverLetter, setGeneratedCoverLetter] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const { currentAgentId, agents, settings } = useStore()
  const { toast } = useToast()

  const handleGenerate = async () => {
    if (!currentAgentId) {
      toast({
        title: "No agent selected",
        description: "Please select an agent to generate a cover letter.",
        variant: "destructive",
      })
      return
    }

    if (!settings.openaiApiKey) {
      toast({
        title: "OpenAI API key missing",
        description: "Please add your OpenAI API key in Settings.",
        variant: "destructive",
      })
      return
    }

    if (!jobDescription.trim()) {
      toast({
        title: "Job description required",
        description: "Please enter a job description to generate a cover letter.",
        variant: "destructive",
      })
      return
    }

    setIsGenerating(true)
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
                agent?.systemPrompt ||
                "You are an expert at writing Upwork cover letters. Generate a professional, tailored cover letter based on the job description provided.",
            },
            {
              role: "user",
              content: `Generate a cover letter for this Upwork job:\n\n${jobDescription}\n\nUser Profile:\n${settings.userProfile || "No profile provided"}`,
            },
          ],
          // Only add temperature for models that support it (not o1/o3 reasoning models)
          ...(!((agent?.model || "gpt-3.5-turbo").toLowerCase().includes('o1') || 
                (agent?.model || "gpt-3.5-turbo").toLowerCase().includes('o3'))
            ? { temperature: 0.7 }
            : {}),
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to generate cover letter")
      }

      const data = await response.json()
      const coverLetter = data.choices[0].message.content
      setGeneratedCoverLetter(coverLetter)

      toast({
        title: "Cover letter generated!",
        description: "Your cover letter has been generated successfully.",
      })
    } catch (error) {
      console.error("[v0] Error generating cover letter:", error)
      toast({
        title: "Error",
        description: "Failed to generate cover letter. Please check your API key and try again.",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Bidding Tool</CardTitle>
        <CardDescription>Generate a cover letter for an Upwork job</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Select Agent</Label>
          <AgentSelector />
        </div>

        <div className="space-y-2">
          <Label htmlFor="job-description">Job Description</Label>
          <Textarea
            id="job-description"
            placeholder="Paste the Upwork job description here..."
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            rows={6}
          />
        </div>

        <div className="flex gap-2">
          <Button onClick={handleGenerate} disabled={isGenerating} className="flex-1">
            {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isGenerating ? "Generating..." : "Generate Cover Letter"}
          </Button>
          <BiddingToolDialog />
        </div>

        {generatedCoverLetter && (
          <div className="space-y-2">
            <Label>Generated Cover Letter</Label>
            <Textarea value={generatedCoverLetter} readOnly rows={12} />
            <Button
              variant="outline"
              onClick={() => {
                navigator.clipboard.writeText(generatedCoverLetter)
                toast({ title: "Copied!", description: "Cover letter copied to clipboard." })
              }}
            >
              Copy to Clipboard
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

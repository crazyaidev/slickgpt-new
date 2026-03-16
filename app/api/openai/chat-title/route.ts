import { NextRequest, NextResponse } from "next/server"

import {
  CHAT_TITLE_MODEL,
  DEFAULT_CHAT_TITLE,
  getFallbackChatTitleFromPrompt,
  sanitizeGeneratedChatTitle,
} from "@/lib/chat-titles"

interface ChatTitleRequestBody {
  userPrompt?: string
  assistantReply?: string | null
}

interface ResponsesAPIResponse {
  output_text?: string
  output?: Array<{
    type?: string
    content?: Array<{
      type?: string
      text?: string
    }>
  }>
}

interface ChatCompletionsResponse {
  choices?: Array<{
    message?: {
      content?: string | Array<{ type?: string; text?: string }>
    }
  }>
}

const TITLE_INSTRUCTIONS = [
  "You generate navigation labels for saved chats.",
  "Read the user's initial request and the assistant's first complete reply.",
  "Return the shortest simple title that still identifies the topic and outcome.",
  "Use 2 to 4 words when possible.",
  "Do not copy the user's prompt verbatim unless it is already a short plain topic.",
  "Prefer a distilled topic label with a tiny outcome hint.",
  "Avoid punctuation, quotes, filler words, and sentence fragments.",
  "Return only the title text.",
].join(" ")

const extractResponseText = (payload: ResponsesAPIResponse) => {
  if (payload.output_text?.trim()) {
    return payload.output_text.trim()
  }

  for (const item of payload.output ?? []) {
    for (const content of item.content ?? []) {
      if (content.type === "output_text" && content.text?.trim()) {
        return content.text.trim()
      }
    }
  }

  return DEFAULT_CHAT_TITLE
}

const buildRequestInput = (userPrompt: string, assistantReply: string) =>
  [
    "Initial user request:",
    userPrompt,
    "",
    "Initial assistant reply:",
    assistantReply,
  ].join("\n")

const buildRequestBodies = (userPrompt: string, assistantReply: string) => {
  const basePayload = {
    model: CHAT_TITLE_MODEL,
    instructions: TITLE_INSTRUCTIONS,
    input: buildRequestInput(userPrompt, assistantReply),
    max_output_tokens: 16,
  }

  return [
    {
      ...basePayload,
      reasoning: { effort: "minimal" as const },
      text: { verbosity: "low" as const },
    },
    basePayload,
  ]
}

const buildChatCompletionsBody = (userPrompt: string, assistantReply: string) => ({
  model: CHAT_TITLE_MODEL,
  messages: [
    {
      role: "developer",
      content: TITLE_INSTRUCTIONS,
    },
    {
      role: "user",
      content: buildRequestInput(userPrompt, assistantReply),
    },
  ],
  max_completion_tokens: 16,
})

const parseErrorMessage = async (response: Response) => {
  const rawText = await response.text()

  if (!rawText) {
    return `OpenAI API error: ${response.status} ${response.statusText}`
  }

  try {
    const parsed = JSON.parse(rawText) as {
      error?: {
        message?: string
      }
    }

    return (
      parsed.error?.message ||
      `OpenAI API error: ${response.status} ${response.statusText}`
    )
  } catch {
    return rawText
  }
}

const requestOpenAIChatTitle = async (
  apiKey: string,
  userPrompt: string,
  assistantReply: string,
) => {
  let lastErrorMessage = ""
  const requestBodies = buildRequestBodies(userPrompt, assistantReply)

  for (let index = 0; index < requestBodies.length; index += 1) {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBodies[index]),
      cache: "no-store",
    })

    if (response.ok) {
      const data: ResponsesAPIResponse = await response.json()
      return extractResponseText(data)
    }

    const errorMessage = await parseErrorMessage(response)
    lastErrorMessage = errorMessage

    if (response.status === 400 && index < requestBodies.length - 1) {
      console.warn("[OpenAI Chat Title] Retrying title request with basic payload:", errorMessage)
      continue
    }
    break
  }

  console.warn(
    "[OpenAI Chat Title] Responses API failed, trying Chat Completions fallback:",
    lastErrorMessage || "Unknown error",
  )

  const chatCompletionsResponse = await fetch(
    "https://api.openai.com/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(buildChatCompletionsBody(userPrompt, assistantReply)),
      cache: "no-store",
    },
  )

  if (!chatCompletionsResponse.ok) {
    const errorMessage = await parseErrorMessage(chatCompletionsResponse)

    console.warn(
      "[OpenAI Chat Title] Chat Completions fallback failed, using heuristic title:",
      errorMessage,
    )

    return null
  }

  const data: ChatCompletionsResponse = await chatCompletionsResponse.json()
  const messageContent = data.choices?.[0]?.message?.content

  if (typeof messageContent === "string" && messageContent.trim()) {
    return messageContent.trim()
  }

  if (Array.isArray(messageContent)) {
    const text = messageContent
      .map((part) => part.text || "")
      .join(" ")
      .trim()

    if (text) {
      return text
    }
  }

  return null
}

export async function POST(request: NextRequest) {
  let fallbackTitle = DEFAULT_CHAT_TITLE

  try {
    const apiKey = request.headers.get("x-api-key")

    if (!apiKey || !apiKey.startsWith("sk-")) {
      return NextResponse.json(
        { error: "Invalid or missing API key" },
        { status: 401 },
      )
    }

    const body = (await request.json()) as ChatTitleRequestBody
    const userPrompt =
      typeof body.userPrompt === "string" ? body.userPrompt.trim() : ""
    const assistantReply =
      typeof body.assistantReply === "string" ? body.assistantReply.trim() : ""
    fallbackTitle = getFallbackChatTitleFromPrompt(userPrompt)

    if (!userPrompt || !assistantReply) {
      return NextResponse.json(
        { error: "Both the initial user prompt and assistant reply are required." },
        { status: 400 },
      )
    }

    const generatedTitle = await requestOpenAIChatTitle(
      apiKey,
      userPrompt,
      assistantReply,
    )
    const title = generatedTitle
      ? sanitizeGeneratedChatTitle(generatedTitle)
      : fallbackTitle

    return NextResponse.json({
      title: title || fallbackTitle || DEFAULT_CHAT_TITLE,
      model: CHAT_TITLE_MODEL,
    })
  } catch (error) {
    console.warn(
      "[OpenAI Chat Title Route] Falling back after unexpected error:",
      error instanceof Error ? error.message : String(error),
    )

    return NextResponse.json(
      {
        title: fallbackTitle || DEFAULT_CHAT_TITLE,
        model: CHAT_TITLE_MODEL,
      },
    )
  }
}

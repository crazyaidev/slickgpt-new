/**
 * Next.js API Route for fetching OpenAI models
 * Acts as a proxy to avoid CORS issues and keep API keys secure
 */

import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    // Get API key from request headers
    const apiKey = request.headers.get("x-api-key")

    if (!apiKey || !apiKey.startsWith("sk-")) {
      return NextResponse.json(
        { error: "Invalid or missing API key" },
        { status: 401 }
      )
    }

    // Fetch models from OpenAI API
    const response = await fetch("https://api.openai.com/v1/models", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[OpenAI API] Error:", response.status, errorText)
      return NextResponse.json(
        { error: `OpenAI API error: ${response.status} ${response.statusText}` },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("[OpenAI API Route] Error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch models" },
      { status: 500 }
    )
  }
}

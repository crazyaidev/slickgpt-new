/**
 * OpenAI Models API utility
 * Fetches available models from OpenAI API and provides filtering utilities
 */

export interface OpenAIModel {
  id: string
  object: string
  created: number
  owned_by: string
}

export interface OpenAIModelsResponse {
  object: string
  data: OpenAIModel[]
}

// Default models fallback if API call fails
export const DEFAULT_MODELS = [
  "gpt-5",
  "gpt-5.2",
  "gpt-5.2-pro",
  "gpt-5.1",
  "gpt-5-mini",
  "gpt-4.1",
  "gpt-4.1-mini",
  "gpt-4o",
  "gpt-4o-mini",
  "o3",
  "o3-mini",
  "o1-preview",
  "o1-mini",
  "gpt-4-turbo",
  "gpt-4",
  "gpt-3.5-turbo",
]

// Models to exclude from the list (deprecated, embeddings, etc.)
// Note: We're conservative here - only exclude clearly non-chat models
const EXCLUDED_MODELS = [
  "text-embedding",
  "embedding", // Pure embedding models
  "text-search",
  "code-search",
  "ada",
  "babbage",
  "curie",
  "davinci",
  "whisper",
  "dall-e",
  "moderations",
  "moderation",
]

/**
 * Fetches available models from OpenAI API via Next.js API route
 * @param apiKey OpenAI API key
 * @returns Promise with array of model IDs
 */
export async function fetchOpenAIModels(apiKey: string): Promise<string[]> {
  if (!apiKey || !apiKey.startsWith("sk-")) {
    console.warn("[OpenAI Models] Invalid or missing API key")
    return DEFAULT_MODELS
  }

  try {
    // Use Next.js API route to avoid CORS issues
    const response = await fetch("/api/openai/models", {
      method: "GET",
      headers: {
        "x-api-key": apiKey,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`)
    }

    const data: OpenAIModelsResponse = await response.json()

    // Filter models to only include chat/completion models
    const chatModels = data.data
      .map((model) => model.id)
      .filter((id) => {
        const lowerId = id.toLowerCase()

        // Include GPT models (all variants: gpt-5, gpt-4, gpt-3, etc.)
        const isGptModel = /^gpt/i.test(id) || lowerId.includes("gpt")

        // Include O-series reasoning models (o1, o3, o4, etc.)
        const isOModel = /^o\d/i.test(id) || /-o\d/i.test(id) || lowerId.match(/^o[1-9]/)

        // Include ChatGPT models
        const isChatGptModel = lowerId.startsWith("chatgpt")

        // Check if it's a chat/completion model
        const isChatModel = isGptModel || isOModel || isChatGptModel

        if (!isChatModel) {
          return false
        }

        // Exclude embedding, moderation, and other clearly non-chat models
        const isExcluded = EXCLUDED_MODELS.some((excluded) => {
          // Only exclude if it's not part of a GPT model name
          // e.g., exclude "text-embedding-3" but not "gpt-4o" (even if it contains "o")
          const excludedLower = excluded.toLowerCase()
          if (lowerId.includes(excludedLower)) {
            // Double-check: if it's a GPT model and the excluded term is just "o", don't exclude
            if (excludedLower === "o" && lowerId.includes("gpt")) {
              return false
            }
            return true
          }
          return false
        })

        // Exclude pure image/embedding/audio models (but allow chat models that might have these capabilities)
        const isPureNonChatModel =
          (lowerId.includes("embedding") && !lowerId.includes("gpt")) ||
          (lowerId.includes("moderation") && !lowerId.includes("gpt")) ||
          lowerId.includes("whisper") ||
          (lowerId.includes("dall-e") && !lowerId.includes("gpt")) ||
          (lowerId.includes("tts") && !lowerId.includes("gpt")) ||
          (lowerId.includes("image") && !lowerId.includes("gpt") && !lowerId.includes("chatgpt"))

        return !isExcluded && !isPureNonChatModel
      })
      .sort((a, b) => {
        const lowerA = a.toLowerCase()
        const lowerB = b.toLowerCase()

        // Sort by priority: GPT-5 > O3 > O1 > GPT-4.1 > GPT-4o > GPT-4 > GPT-3.5
        const getPriority = (id: string) => {
          const lowerId = id.toLowerCase()
          // GPT-5 family (highest priority)
          if (lowerId.includes("gpt-5")) {
            if (lowerId.includes("5.2")) return 0
            if (lowerId.includes("5.1")) return 1
            if (lowerId === "gpt-5" || lowerId.startsWith("gpt-5")) return 2
            return 3
          }
          // O-series reasoning models
          if (lowerId.includes("o3")) return 4
          if (lowerId.includes("o1")) return 5
          // GPT-4.1 family
          if (lowerId.includes("gpt-4.1")) return 6
          // GPT-4o family
          if (lowerId.includes("gpt-4o")) return 7
          // GPT-4 Turbo
          if (lowerId.includes("gpt-4-turbo")) return 8
          // Other GPT-4
          if (lowerId.includes("gpt-4")) return 9
          // GPT-3.5
          if (lowerId.includes("gpt-3.5")) return 10
          // Other GPT models
          if (lowerId.includes("gpt")) return 11
          // Other models
          return 12
        }

        const priorityDiff = getPriority(a) - getPriority(b)
        if (priorityDiff !== 0) return priorityDiff

        // Secondary sort: For same priority, sort by version number (descending) then by variant
        // This ensures gpt-5.2-pro comes before gpt-5.2, gpt-5.2 before gpt-5.1, etc.
        const extractVersion = (id: string) => {
          const match = id.match(/(\d+)\.(\d+)/) || id.match(/(\d+)/)
          if (match) {
            return parseFloat(match[0])
          }
          return 0
        }

        const getVariantPriority = (id: string) => {
          const lowerId = id.toLowerCase()
          // Pro/max variants first
          if (lowerId.includes("-pro") || lowerId.includes("-max") || lowerId.includes("codex-max")) return 0
          // Standard versions
          if (!lowerId.includes("-mini") && !lowerId.includes("-nano")) return 1
          // Mini versions
          if (lowerId.includes("-mini")) return 2
          // Nano versions
          if (lowerId.includes("-nano")) return 3
          return 1
        }

        const versionA = extractVersion(a)
        const versionB = extractVersion(b)

        if (versionA !== versionB) {
          return versionB - versionA // Descending: higher versions first
        }

        // If same version, sort by variant (pro > standard > mini > nano)
        const variantA = getVariantPriority(a)
        const variantB = getVariantPriority(b)

        if (variantA !== variantB) {
          return variantA - variantB
        }

        // If same version and variant, sort alphabetically
        return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" })
      })

    // Remove duplicates
    const uniqueModels = Array.from(new Set(chatModels))

    // If we have valid models, return them; otherwise fallback to defaults
    return uniqueModels.length > 0 ? uniqueModels : DEFAULT_MODELS
  } catch (error) {
    console.error("[OpenAI Models] Failed to fetch models:", error)
    return DEFAULT_MODELS
  }
}

/**
 * Cache for models to avoid frequent API calls
 */
let modelsCache: {
  models: string[]
  timestamp: number
  apiKey: string
} | null = null

const CACHE_DURATION = 1000 * 60 * 60 // 1 hour

/**
 * Get cached models or fetch fresh ones
 * @param apiKey OpenAI API key
 * @param forceRefresh Force refresh even if cache is valid
 * @returns Promise with array of model IDs
 */
export async function getOpenAIModels(
  apiKey: string,
  forceRefresh = false
): Promise<string[]> {
  const now = Date.now()

  // Check cache validity
  if (
    !forceRefresh &&
    modelsCache &&
    modelsCache.apiKey === apiKey &&
    now - modelsCache.timestamp < CACHE_DURATION
  ) {
    return modelsCache.models
  }

  // Fetch fresh models
  const models = await fetchOpenAIModels(apiKey)

  // Update cache
  modelsCache = {
    models,
    timestamp: now,
    apiKey,
  }

  return models
}

/**
 * Clear the models cache (useful when API key changes)
 */
export function clearModelsCache() {
  modelsCache = null
}

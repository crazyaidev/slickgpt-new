import { useEffect, useState, useCallback } from "react"
import { useStore } from "@/lib/store"
import { getOpenAIModels, clearModelsCache, DEFAULT_MODELS } from "@/lib/openai-models"

interface UseOpenAIModelsReturn {
  models: string[]
  isLoading: boolean
  error: string | null
  refresh: () => Promise<void>
}

/**
 * Custom hook to fetch and manage OpenAI models
 * Automatically syncs with the API key from the store
 */
export function useOpenAIModels(): UseOpenAIModelsReturn {
  const { apiKeys } = useStore()
  const [models, setModels] = useState<string[]>(DEFAULT_MODELS)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchModels = useCallback(
    async (forceRefresh = false) => {
      if (!apiKeys.openai || !apiKeys.openai.startsWith("sk-")) {
        // If no API key, use default models
        setModels(DEFAULT_MODELS)
        setError(null)
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        const fetchedModels = await getOpenAIModels(apiKeys.openai, forceRefresh)
        setModels(fetchedModels)
      } catch (err) {
        console.error("[useOpenAIModels] Error fetching models:", err)
        setError(err instanceof Error ? err.message : "Failed to fetch models")
        // Fallback to default models on error
        setModels(DEFAULT_MODELS)
      } finally {
        setIsLoading(false)
      }
    },
    [apiKeys.openai]
  )

  // Fetch models on mount and when API key changes
  useEffect(() => {
    // Clear cache when API key changes
    clearModelsCache()
    fetchModels()
  }, [fetchModels])

  const refresh = useCallback(async () => {
    await fetchModels(true)
  }, [fetchModels])

  return {
    models,
    isLoading,
    error,
    refresh,
  }
}

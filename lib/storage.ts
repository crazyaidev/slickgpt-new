import type { Agent, ChatSession, KnowledgeBase, VectorDocument } from "./types"

interface ChatUIState {
  currentAgentId: string | null
  currentChatIdsByAgent: Record<string, string>
}

const STORAGE_KEYS = {
  AGENTS: "ai-agent-builder-agents",
  API_KEYS: "ai-agent-builder-api-keys",
  CHAT_SESSIONS: "ai-agent-builder-chats",
  CHAT_UI_STATE: "ai-agent-builder-chat-ui-state",
  KNOWLEDGE_BASES: "ai-agent-builder-knowledge-bases",
  VECTOR_DOCUMENTS: "ai-agent-builder-vector-documents",
}

const getDefaultChatUIState = (): ChatUIState => ({
  currentAgentId: null,
  currentChatIdsByAgent: {},
})

export const storage = {
  // Agents
  getAgents: (): Agent[] => {
    if (typeof window === "undefined") return []
    const data = localStorage.getItem(STORAGE_KEYS.AGENTS)
    return data ? JSON.parse(data) : []
  },

  saveAgents: (agents: Agent[]) => {
    if (typeof window === "undefined") return
    localStorage.setItem(STORAGE_KEYS.AGENTS, JSON.stringify(agents))
  },

  // API Keys
  getApiKeys: () => {
    if (typeof window === "undefined")
      return {
        openai: "",
        pinecone: "",
        webSearch: "",
      }
    const data = localStorage.getItem(STORAGE_KEYS.API_KEYS)
    return data
      ? JSON.parse(data)
      : {
          openai: "",
          pinecone: "",
          webSearch: "",
        }
  },

  saveApiKeys: (keys: { openai: string; pinecone: string; webSearch: string }) => {
    if (typeof window === "undefined") return
    localStorage.setItem(STORAGE_KEYS.API_KEYS, JSON.stringify(keys))
  },

  // Chat Sessions
  getChatSessions: (): ChatSession[] => {
    if (typeof window === "undefined") return []
    const data = localStorage.getItem(STORAGE_KEYS.CHAT_SESSIONS)
    return data ? JSON.parse(data) : []
  },

  saveChatSessions: (sessions: ChatSession[]) => {
    if (typeof window === "undefined") return
    localStorage.setItem(STORAGE_KEYS.CHAT_SESSIONS, JSON.stringify(sessions))
  },

  getChatUIState: (): ChatUIState => {
    if (typeof window === "undefined") return getDefaultChatUIState()

    const data = localStorage.getItem(STORAGE_KEYS.CHAT_UI_STATE)
    if (!data) {
      return getDefaultChatUIState()
    }

    try {
      const parsed = JSON.parse(data) as Partial<ChatUIState>

      return {
        currentAgentId:
          typeof parsed.currentAgentId === "string" ? parsed.currentAgentId : null,
        currentChatIdsByAgent:
          parsed.currentChatIdsByAgent &&
          typeof parsed.currentChatIdsByAgent === "object"
            ? parsed.currentChatIdsByAgent
            : {},
      }
    } catch {
      return getDefaultChatUIState()
    }
  },

  saveChatUIState: (chatUIState: ChatUIState) => {
    if (typeof window === "undefined") return
    localStorage.setItem(
      STORAGE_KEYS.CHAT_UI_STATE,
      JSON.stringify(chatUIState),
    )
  },

  // Knowledge Bases
  getKnowledgeBases: (): KnowledgeBase[] => {
    if (typeof window === "undefined") return []
    const data = localStorage.getItem(STORAGE_KEYS.KNOWLEDGE_BASES)
    return data ? JSON.parse(data) : []
  },

  saveKnowledgeBases: (bases: KnowledgeBase[]) => {
    if (typeof window === "undefined") return
    localStorage.setItem(STORAGE_KEYS.KNOWLEDGE_BASES, JSON.stringify(bases))
  },

  // Vector Documents (for RAG)
  getVectorDocuments: (): VectorDocument[] => {
    if (typeof window === "undefined") return []
    const data = localStorage.getItem(STORAGE_KEYS.VECTOR_DOCUMENTS)
    return data ? JSON.parse(data) : []
  },

  saveVectorDocuments: (documents: VectorDocument[]) => {
    if (typeof window === "undefined") return
    localStorage.setItem(STORAGE_KEYS.VECTOR_DOCUMENTS, JSON.stringify(documents))
  },
}

import type { Agent, ChatSession, KnowledgeBase, VectorDocument } from "./types"

const STORAGE_KEYS = {
  AGENTS: "ai-agent-builder-agents",
  API_KEYS: "ai-agent-builder-api-keys",
  CHAT_SESSIONS: "ai-agent-builder-chats",
  KNOWLEDGE_BASES: "ai-agent-builder-knowledge-bases",
  VECTOR_DOCUMENTS: "ai-agent-builder-vector-documents",
}

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

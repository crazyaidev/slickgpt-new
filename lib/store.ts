import { create } from "zustand"
import type { Agent, ChatSession, KnowledgeBase, Message } from "./types"
import { storage } from "./storage"

interface AppState {
  agents: Agent[]
  apiKeys: {
    openai: string
    pinecone: string
    webSearch: string
  }
  chatSessions: ChatSession[]
  knowledgeBases: KnowledgeBase[]
  currentAgentId: string | null
  currentChatId: string | null

  // Actions
  setAgents: (agents: Agent[]) => void
  addAgent: (agent: Agent) => void
  updateAgent: (id: string, agent: Partial<Agent>) => void
  deleteAgent: (id: string) => void

  setApiKeys: (keys: Partial<AppState["apiKeys"]>) => void

  createNewChat: (agentId: string) => string
  addMessage: (chatId: string, message: Partial<Message>) => Message
  updateMessage: (chatId: string, messageId: string, content: string) => void
  editMessage: (chatId: string, messageId: string, content: string) => void
  deleteMessage: (chatId: string, messageId: string) => void
  deleteChatSession: (id: string) => void
  setCurrentChatId: (id: string | null) => void

  setKnowledgeBases: (bases: KnowledgeBase[]) => void
  addKnowledgeBase: (base: KnowledgeBase) => void
  updateKnowledgeBase: (id: string, base: Partial<KnowledgeBase>) => void
  deleteKnowledgeBase: (id: string) => void

  setCurrentAgentId: (id: string | null) => void

  loadFromStorage: () => void
}

export const useStore = create<AppState>((set, get) => ({
  agents: [],
  apiKeys: {
    openai: "",
    pinecone: "",
    webSearch: "",
  },
  chatSessions: [],
  knowledgeBases: [],
  currentAgentId: null,
  currentChatId: null,

  setAgents: (agents) => {
    set({ agents })
    storage.saveAgents(agents)
  },

  addAgent: (agent) => {
    const agents = [...get().agents, agent]
    set({ agents })
    storage.saveAgents(agents)
  },

  updateAgent: (id, updatedAgent) => {
    const agents = get().agents.map((agent) =>
      agent.id === id ? { ...agent, ...updatedAgent, updatedAt: new Date().toISOString() } : agent,
    )
    set({ agents })
    storage.saveAgents(agents)
  },

  deleteAgent: (id) => {
    const agents = get().agents.filter((agent) => agent.id !== id)
    set({ agents })
    storage.saveAgents(agents)
    const chatSessions = get().chatSessions.filter((session) => session.agentId !== id)
    set({ chatSessions })
    storage.saveChatSessions(chatSessions)
  },

  setApiKeys: (keys) => {
    const apiKeys = { ...get().apiKeys, ...keys }
    set({ apiKeys })
    storage.saveApiKeys(apiKeys)
  },

  createNewChat: (agentId) => {
    const chatId = crypto.randomUUID()
    const newChat: ChatSession = {
      id: chatId,
      agentId,
      title: "New Chat",
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    const chatSessions = [...get().chatSessions, newChat]
    set({ chatSessions, currentChatId: chatId })
    storage.saveChatSessions(chatSessions)
    return chatId
  },

  addMessage: (chatId, messageData) => {
    const message: Message = {
      id: messageData.id || crypto.randomUUID(),
      role: messageData.role!,
      content: messageData.content || "",
      timestamp: new Date().toISOString(),
      webSearchUsed: messageData.webSearchUsed,
    }

    const chatSessions = get().chatSessions.map((session) => {
      if (session.id === chatId) {
        const updatedMessages = [...session.messages, message]
        // Update title based on first user message
        const title = updatedMessages.find((m) => m.role === "user")?.content.slice(0, 50) || "New Chat"
        return {
          ...session,
          messages: updatedMessages,
          title,
          updatedAt: new Date().toISOString(),
        }
      }
      return session
    })

    set({ chatSessions })
    storage.saveChatSessions(chatSessions)
    return message
  },

  updateMessage: (chatId, messageId, content) => {
    const chatSessions = get().chatSessions.map((session) => {
      if (session.id === chatId) {
        return {
          ...session,
          messages: session.messages.map((msg) => (msg.id === messageId ? { ...msg, content } : msg)),
          updatedAt: new Date().toISOString(),
        }
      }
      return session
    })
    set({ chatSessions })
    storage.saveChatSessions(chatSessions)
  },

  editMessage: (chatId, messageId, content) => {
    const chatSessions = get().chatSessions.map((session) => {
      if (session.id === chatId) {
        const messageIndex = session.messages.findIndex((msg) => msg.id === messageId)
        if (messageIndex === -1) return session

        // Truncate messages after the edited message
        const truncatedMessages = session.messages.slice(0, messageIndex + 1)
        // Update the edited message content
        truncatedMessages[messageIndex] = {
          ...truncatedMessages[messageIndex],
          content,
        }

        return {
          ...session,
          messages: truncatedMessages,
          updatedAt: new Date().toISOString(),
        }
      }
      return session
    })
    set({ chatSessions })
    storage.saveChatSessions(chatSessions)
  },

  deleteMessage: (chatId, messageId) => {
    const chatSessions = get().chatSessions.map((session) => {
      if (session.id === chatId) {
        return {
          ...session,
          messages: session.messages.filter((msg) => msg.id !== messageId),
          updatedAt: new Date().toISOString(),
        }
      }
      return session
    })
    set({ chatSessions })
    storage.saveChatSessions(chatSessions)
  },

  deleteChatSession: (id) => {
    const chatSessions = get().chatSessions.filter((session) => session.id !== id)
    set({ chatSessions })
    storage.saveChatSessions(chatSessions)
    // If deleting current chat, clear selection
    if (get().currentChatId === id) {
      set({ currentChatId: null })
    }
  },

  setCurrentChatId: (id) => {
    set({ currentChatId: id })
  },

  setKnowledgeBases: (knowledgeBases) => {
    set({ knowledgeBases })
    storage.saveKnowledgeBases(knowledgeBases)
  },

  addKnowledgeBase: (base) => {
    const knowledgeBases = [...get().knowledgeBases, base]
    set({ knowledgeBases })
    storage.saveKnowledgeBases(knowledgeBases)
  },

  updateKnowledgeBase: (id, updatedBase) => {
    const knowledgeBases = get().knowledgeBases.map((base) =>
      base.id === id ? { ...base, ...updatedBase, updatedAt: new Date().toISOString() } : base,
    )
    set({ knowledgeBases })
    storage.saveKnowledgeBases(knowledgeBases)
  },

  deleteKnowledgeBase: (id) => {
    const knowledgeBases = get().knowledgeBases.filter((base) => base.id !== id)
    set({ knowledgeBases })
    storage.saveKnowledgeBases(knowledgeBases)
  },

  setCurrentAgentId: (id) => {
    set({ currentAgentId: id })
    if (id) {
      const agentChats = get().chatSessions.filter((s) => s.agentId === id)
      if (agentChats.length === 0) {
        get().createNewChat(id)
      } else {
        set({ currentChatId: agentChats[agentChats.length - 1].id })
      }
    }
  },

  loadFromStorage: () => {
    const agents = storage.getAgents()
    const apiKeys = storage.getApiKeys()
    const chatSessions = storage.getChatSessions()
    const knowledgeBases = storage.getKnowledgeBases()
    set({ agents, apiKeys, chatSessions, knowledgeBases })
  },
}))

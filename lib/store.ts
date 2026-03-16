import { create } from "zustand"
import type { Agent, ChatSession, KnowledgeBase, Message } from "./types"
import {
  DEFAULT_CHAT_TITLE,
  getChatTitleContext,
  getChatTitleContextKey,
  getFallbackChatTitle,
  requestGeneratedChatTitle,
} from "./chat-titles"
import { storage } from "./storage"

const sortChatsByUpdatedAt = (sessions: ChatSession[]) =>
  [...sessions].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  )

const getStoredTitleContextKey = (session: ChatSession) =>
  typeof session.titleContextKey === "string"
    ? session.titleContextKey
    : getChatTitleContextKey(session.messages)

const getPendingTitleState = (titleContextKey: string | null) => ({
  title: DEFAULT_CHAT_TITLE,
  titleStatus: "pending" as const,
  titleContextKey,
})

const getStoredTitleStatus = (session: ChatSession) => {
  const titleContext = getChatTitleContext(session.messages)

  if (!titleContext?.assistantReply) {
    return "pending" as const
  }

  if (session.titleStatus) {
    return session.titleStatus
  }

  const fallbackTitle = getFallbackChatTitle(session.messages)
  const normalizedTitle = session.title.trim()

  if (
    normalizedTitle &&
    normalizedTitle !== DEFAULT_CHAT_TITLE &&
    normalizedTitle !== fallbackTitle
  ) {
    return "generated" as const
  }

  return "fallback" as const
}

const resolveChatTitleState = (session: ChatSession, messages: Message[]) => {
  const nextTitleContext = getChatTitleContext(messages)
  const nextTitleContextKey = getChatTitleContextKey(messages)
  const currentTitleStatus = getStoredTitleStatus(session)
  const currentTitleContextKey = getStoredTitleContextKey(session)

  if (
    currentTitleContextKey === nextTitleContextKey &&
    (currentTitleStatus === "generated" || currentTitleStatus === "fallback") &&
    Boolean(session.title.trim())
  ) {
    return {
      title: session.title.trim(),
      titleStatus: currentTitleStatus,
      titleContextKey: nextTitleContextKey,
    }
  }

  if (
    currentTitleContextKey === nextTitleContextKey &&
    currentTitleStatus === "pending"
  ) {
    return getPendingTitleState(nextTitleContextKey)
  }

  if (!nextTitleContext?.assistantReply) {
    return getPendingTitleState(nextTitleContextKey)
  }

  return getPendingTitleState(nextTitleContextKey)
}

const hydrateStoredChatTitle = (session: ChatSession) => {
  const titleContext = getChatTitleContext(session.messages)
  const titleContextKey = getChatTitleContextKey(session.messages)
  const fallbackTitle = getFallbackChatTitle(session.messages)
  const normalizedTitle = session.title.trim()
  const titleStatus = getStoredTitleStatus(session)

  const nextTitleState = !titleContext?.assistantReply
    ? getPendingTitleState(titleContextKey)
    : titleStatus === "generated" && normalizedTitle
      ? {
          title: normalizedTitle,
          titleStatus: "generated" as const,
          titleContextKey,
        }
      : {
          title: fallbackTitle,
          titleStatus: "fallback" as const,
          titleContextKey,
        }

  if (
    session.title === nextTitleState.title &&
    session.titleStatus === nextTitleState.titleStatus &&
    session.titleContextKey === nextTitleState.titleContextKey
  ) {
    return session
  }

  return {
    ...session,
    ...nextTitleState,
  }
}

const updatePersistedChatTitle = (
  sessions: ChatSession[],
  chatId: string,
  title: string,
  titleStatus: "pending" | "fallback" | "generated",
  titleContextKey: string | null,
) => {
  let didChange = false

  const nextSessions = sessions.map((session) => {
    if (session.id !== chatId) {
      return session
    }

    if (
      session.title === title &&
      session.titleStatus === titleStatus &&
      session.titleContextKey === titleContextKey
    ) {
      return session
    }

    didChange = true

    return {
      ...session,
      title,
      titleStatus,
      titleContextKey,
    }
  })

  return didChange ? nextSessions : sessions
}

const getAgentChats = (sessions: ChatSession[], agentId: string) =>
  sortChatsByUpdatedAt(
    sessions.filter((session) => session.agentId === agentId),
  )

const isValidChatSelection = (
  sessions: ChatSession[],
  agentId: string,
  chatId: string,
) =>
  sessions.some(
    (session) => session.id === chatId && session.agentId === agentId,
  )

const sanitizeChatIdsByAgent = (
  agents: Agent[],
  sessions: ChatSession[],
  currentChatIdsByAgent: Record<string, string>,
) => {
  const validAgentIds = new Set(agents.map((agent) => agent.id))

  return Object.fromEntries(
    Object.entries(currentChatIdsByAgent).filter(
      ([agentId, chatId]) =>
        validAgentIds.has(agentId) &&
        isValidChatSelection(sessions, agentId, chatId),
    ),
  )
}

const resolveCurrentChatId = (
  sessions: ChatSession[],
  agentId: string,
  currentChatIdsByAgent: Record<string, string>,
) => {
  const preferredChatId = currentChatIdsByAgent[agentId]

  if (
    preferredChatId &&
    isValidChatSelection(sessions, agentId, preferredChatId)
  ) {
    return preferredChatId
  }

  return getAgentChats(sessions, agentId)[0]?.id ?? null
}

const saveChatUIState = (
  currentAgentId: string | null,
  currentChatIdsByAgent: Record<string, string>,
) => {
  storage.saveChatUIState({
    currentAgentId,
    currentChatIdsByAgent,
  })
}

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
  currentChatIdsByAgent: Record<string, string>

  // Actions
  setAgents: (agents: Agent[]) => void
  addAgent: (agent: Agent) => void
  updateAgent: (id: string, agent: Partial<Agent>) => void
  deleteAgent: (id: string) => void

  setApiKeys: (keys: Partial<AppState["apiKeys"]>) => void

  createNewChat: (agentId: string) => string
  addMessage: (chatId: string, message: Partial<Message>) => Message
  updateMessage: (chatId: string, messageId: string, content: string) => void
  setMessageMetadata: (
    chatId: string,
    messageId: string,
    metadata: Partial<Message>,
  ) => void
  editMessage: (chatId: string, messageId: string, content: string) => void
  deleteMessage: (chatId: string, messageId: string) => void
  truncateChatFromMessage: (chatId: string, messageId: string) => void
  refreshChatTitle: (chatId: string) => Promise<string>
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
  currentChatIdsByAgent: {},

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
      agent.id === id
        ? { ...agent, ...updatedAgent, updatedAt: new Date().toISOString() }
        : agent,
    )
    set({ agents })
    storage.saveAgents(agents)
  },

  deleteAgent: (id) => {
    const agents = get().agents.filter((agent) => agent.id !== id)
    const chatSessions = get().chatSessions.filter(
      (session) => session.agentId !== id,
    )
    const currentChatIdsByAgent = { ...get().currentChatIdsByAgent }
    delete currentChatIdsByAgent[id]

    const currentAgentId = get().currentAgentId === id ? null : get().currentAgentId
    const currentChatId = currentAgentId
      ? resolveCurrentChatId(chatSessions, currentAgentId, currentChatIdsByAgent)
      : null

    set({
      agents,
      chatSessions,
      currentAgentId,
      currentChatId,
      currentChatIdsByAgent,
    })

    storage.saveAgents(agents)
    storage.saveChatSessions(chatSessions)
    saveChatUIState(currentAgentId, currentChatIdsByAgent)
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
      title: DEFAULT_CHAT_TITLE,
      titleStatus: "pending",
      titleContextKey: null,
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const chatSessions = [...get().chatSessions, newChat]
    const currentChatIdsByAgent = {
      ...get().currentChatIdsByAgent,
      [agentId]: chatId,
    }

    set({
      chatSessions,
      currentAgentId: agentId,
      currentChatId: chatId,
      currentChatIdsByAgent,
    })

    storage.saveChatSessions(chatSessions)
    saveChatUIState(agentId, currentChatIdsByAgent)

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
        const titleState = resolveChatTitleState(session, updatedMessages)

        return {
          ...session,
          messages: updatedMessages,
          ...titleState,
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
        const updatedMessages = session.messages.map((message) =>
          message.id === messageId ? { ...message, content } : message,
        )
        const titleState = resolveChatTitleState(session, updatedMessages)

        return {
          ...session,
          messages: updatedMessages,
          ...titleState,
          updatedAt: new Date().toISOString(),
        }
      }

      return session
    })

    set({ chatSessions })
    storage.saveChatSessions(chatSessions)
  },

  setMessageMetadata: (chatId, messageId, metadata) => {
    const chatSessions = get().chatSessions.map((session) => {
      if (session.id === chatId) {
        return {
          ...session,
          messages: session.messages.map((message) =>
            message.id === messageId ? { ...message, ...metadata } : message,
          ),
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
        const messageIndex = session.messages.findIndex(
          (message) => message.id === messageId,
        )

        if (messageIndex === -1) return session

        const truncatedMessages = session.messages.slice(0, messageIndex + 1)
        truncatedMessages[messageIndex] = {
          ...truncatedMessages[messageIndex],
          content,
        }
        const titleState = resolveChatTitleState(session, truncatedMessages)

        return {
          ...session,
          messages: truncatedMessages,
          ...titleState,
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
        const messages = session.messages.filter(
          (message) => message.id !== messageId,
        )
        const titleState = resolveChatTitleState(session, messages)

        return {
          ...session,
          messages,
          ...titleState,
          updatedAt: new Date().toISOString(),
        }
      }

      return session
    })

    set({ chatSessions })
    storage.saveChatSessions(chatSessions)
  },

  truncateChatFromMessage: (chatId, messageId) => {
    const chatSessions = get().chatSessions.map((session) => {
      if (session.id !== chatId) {
        return session
      }

      const messageIndex = session.messages.findIndex(
        (message) => message.id === messageId,
      )

      if (messageIndex === -1) {
        return session
      }

      const messages = session.messages.slice(0, messageIndex)
      const titleState = resolveChatTitleState(session, messages)

      return {
        ...session,
        messages,
        ...titleState,
        updatedAt: new Date().toISOString(),
      }
    })

    set({ chatSessions })
    storage.saveChatSessions(chatSessions)
  },

  refreshChatTitle: async (chatId) => {
    const session = get().chatSessions.find((entry) => entry.id === chatId)

    if (!session) {
      return DEFAULT_CHAT_TITLE
    }

    const titleContext = getChatTitleContext(session.messages)
    const titleContextKey = getChatTitleContextKey(session.messages)
    const fallbackTitle = getFallbackChatTitle(session.messages)
    const currentTitleStatus = getStoredTitleStatus(session)
    const currentTitleContextKey = getStoredTitleContextKey(session)

    if (!titleContext?.assistantReply) {
      const chatSessions = updatePersistedChatTitle(
        get().chatSessions,
        chatId,
        DEFAULT_CHAT_TITLE,
        "pending",
        titleContextKey,
      )

      if (chatSessions !== get().chatSessions) {
        set({ chatSessions })
        storage.saveChatSessions(chatSessions)
      }

      return DEFAULT_CHAT_TITLE
    }

    if (
      (currentTitleStatus === "generated" || currentTitleStatus === "fallback") &&
      currentTitleContextKey === titleContextKey &&
      Boolean(session.title.trim())
    ) {
      return session.title.trim()
    }

    const nextTitle = await requestGeneratedChatTitle(
      get().apiKeys.openai,
      session.messages,
    )
    const latestSession = get().chatSessions.find((entry) => entry.id === chatId)

    if (!latestSession) {
      return nextTitle
    }

    const latestTitleContext = getChatTitleContext(latestSession.messages)
    const latestTitleContextKey = getChatTitleContextKey(latestSession.messages)

    if (!latestTitleContext?.assistantReply) {
      const chatSessions = updatePersistedChatTitle(
        get().chatSessions,
        chatId,
        DEFAULT_CHAT_TITLE,
        "pending",
        latestTitleContextKey,
      )

      if (chatSessions !== get().chatSessions) {
        set({ chatSessions })
        storage.saveChatSessions(chatSessions)
      }

      return DEFAULT_CHAT_TITLE
    }

    if (latestTitleContextKey !== titleContextKey) {
      return latestSession.title
    }

    const nextTitleStatus =
      nextTitle !== fallbackTitle ? "generated" : "fallback"
    const chatSessions = updatePersistedChatTitle(
      get().chatSessions,
      chatId,
      nextTitle,
      nextTitleStatus,
      latestTitleContextKey,
    )

    if (chatSessions !== get().chatSessions) {
      set({ chatSessions })
      storage.saveChatSessions(chatSessions)
    }

    return nextTitle
  },

  deleteChatSession: (id) => {
    const sessionToDelete = get().chatSessions.find((session) => session.id === id)
    const chatSessions = get().chatSessions.filter((session) => session.id !== id)
    const currentChatIdsByAgent = { ...get().currentChatIdsByAgent }

    if (
      sessionToDelete &&
      currentChatIdsByAgent[sessionToDelete.agentId] === sessionToDelete.id
    ) {
      const fallbackChatId = getAgentChats(
        chatSessions,
        sessionToDelete.agentId,
      )[0]?.id

      if (fallbackChatId) {
        currentChatIdsByAgent[sessionToDelete.agentId] = fallbackChatId
      } else {
        delete currentChatIdsByAgent[sessionToDelete.agentId]
      }
    }

    const currentAgentId = get().currentAgentId
    const currentChatId = currentAgentId
      ? resolveCurrentChatId(chatSessions, currentAgentId, currentChatIdsByAgent)
      : null

    set({
      chatSessions,
      currentChatId,
      currentChatIdsByAgent,
    })

    storage.saveChatSessions(chatSessions)
    saveChatUIState(currentAgentId, currentChatIdsByAgent)
  },

  setCurrentChatId: (id) => {
    if (!id) {
      set({ currentChatId: null })
      saveChatUIState(get().currentAgentId, get().currentChatIdsByAgent)
      return
    }

    const session = get().chatSessions.find((entry) => entry.id === id)
    if (!session) {
      return
    }

    const currentChatIdsByAgent = {
      ...get().currentChatIdsByAgent,
      [session.agentId]: id,
    }

    set({
      currentAgentId: session.agentId,
      currentChatId: id,
      currentChatIdsByAgent,
    })

    saveChatUIState(session.agentId, currentChatIdsByAgent)
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
      base.id === id
        ? { ...base, ...updatedBase, updatedAt: new Date().toISOString() }
        : base,
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
    if (!id) {
      set({
        currentAgentId: null,
        currentChatId: null,
      })
      saveChatUIState(null, get().currentChatIdsByAgent)
      return
    }

    const currentChatIdsByAgent = { ...get().currentChatIdsByAgent }
    const currentChatId = resolveCurrentChatId(
      get().chatSessions,
      id,
      currentChatIdsByAgent,
    )

    if (currentChatId) {
      currentChatIdsByAgent[id] = currentChatId

      set({
        currentAgentId: id,
        currentChatId,
        currentChatIdsByAgent,
      })

      saveChatUIState(id, currentChatIdsByAgent)
      return
    }

    set({
      currentAgentId: id,
      currentChatId: null,
      currentChatIdsByAgent,
    })

    saveChatUIState(id, currentChatIdsByAgent)
    get().createNewChat(id)
  },

  loadFromStorage: () => {
    const agents = storage.getAgents()
    const apiKeys = storage.getApiKeys()
    const storedChatSessions = storage.getChatSessions()
    const chatSessions = storedChatSessions.map((session) =>
      hydrateStoredChatTitle(session),
    )
    const knowledgeBases = storage.getKnowledgeBases()
    const chatUIState = storage.getChatUIState()

    const currentChatIdsByAgent = sanitizeChatIdsByAgent(
      agents,
      chatSessions,
      chatUIState.currentChatIdsByAgent,
    )
    const currentAgentId = agents.some(
      (agent) => agent.id === chatUIState.currentAgentId,
    )
      ? chatUIState.currentAgentId
      : null
    const currentChatId = currentAgentId
      ? resolveCurrentChatId(chatSessions, currentAgentId, currentChatIdsByAgent)
      : null

    set({
      agents,
      apiKeys,
      chatSessions,
      knowledgeBases,
      currentAgentId,
      currentChatId,
      currentChatIdsByAgent,
    })

    if (chatSessions.some((session, index) => session !== storedChatSessions[index])) {
      storage.saveChatSessions(chatSessions)
    }

    saveChatUIState(currentAgentId, currentChatIdsByAgent)
  },
}))

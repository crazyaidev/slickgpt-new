export interface Agent {
  id: string
  name: string
  model: string
  systemPrompt: string
  knowledgeBaseId: string | null
  enableFileUpload?: boolean
  enableWebSearch?: boolean
  temperature: number
  createdAt: string
  updatedAt: string
}

export interface URLCitation {
  type: "url_citation"
  start_index: number
  end_index: number
  url: string
  title: string
}

export interface WebSearchSource {
  url: string
  title?: string
}

export interface Message {
  id: string
  role: "user" | "assistant" | "system"
  content: string
  timestamp: string
  webSearchUsed?: boolean
  citations?: URLCitation[]
  sources?: WebSearchSource[]
}

export interface ChatSession {
  id: string
  agentId: string
  title: string
  titleStatus?: "pending" | "fallback" | "generated"
  titleContextKey?: string | null
  messages: Message[]
  createdAt: string
  updatedAt: string
}

export interface Settings {
  openaiApiKey: string
  webSearchApiKey: string
}

export interface KnowledgeBase {
  id: string
  name: string
  description: string
  documents: VectorDocument[]
  createdAt: string
  updatedAt: string
}

export interface VectorDocument {
  id: string
  content: string
  embedding?: number[]
  metadata: {
    source: string
    type: "url" | "file"
    createdAt: string
  }
}

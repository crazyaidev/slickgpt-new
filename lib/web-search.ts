import type { URLCitation, WebSearchSource } from './types';

/**
 * Determines if a model is a reasoning model that requires the Responses API
 */
export function isReasoningModel(modelName: string): boolean {
  const lowerModel = modelName.toLowerCase();
  return (
    lowerModel.includes('o1') ||
    lowerModel.includes('o3') ||
    lowerModel.includes('o4') ||
    lowerModel.includes('gpt-5') ||
    lowerModel.includes('chatgpt-4o-latest')
  );
}

/**
 * Maps a model to its search-enabled variant if available
 */
export function getSearchModel(modelName: string): string {
  const lowerModel = modelName.toLowerCase();

  // If already a search model, return as is
  if (lowerModel.includes('-search') || lowerModel.includes('search-api')) {
    return modelName;
  }

  // Map to search variants
  if (lowerModel.includes('gpt-4o-mini')) {
    return 'gpt-4o-mini-search-preview';
  } else if (lowerModel.includes('gpt-4o')) {
    return 'gpt-4o-search-preview';
  } else if (lowerModel.includes('gpt-5')) {
    return 'gpt-5-search-api';
  }

  // Return original model if no search variant
  return modelName;
}

interface ResponsesAPIMessage {
  type: 'message';
  role: 'system' | 'user' | 'assistant';
  content: Array<{ type: 'input_text' | 'output_text'; text: string }>;
}

/**
 * Converts standard messages to Responses API format
 */
export function convertToResponsesAPIFormat(
  systemPrompt: string,
  messages: Array<{ role: string; content: string }>,
): ResponsesAPIMessage[] {
  const conversationItems: ResponsesAPIMessage[] = [];

  // Add system message
  conversationItems.push({
    type: 'message',
    role: 'system',
    content: [{ type: 'input_text', text: systemPrompt }],
  });

  // Add conversation history
  messages.forEach((msg) => {
    conversationItems.push({
      type: 'message',
      role: msg.role as 'user' | 'assistant',
      content: [
        {
          type: msg.role === 'user' ? 'input_text' : 'output_text',
          text: msg.content,
        },
      ],
    });
  });

  return conversationItems;
}

interface ResponsesAPIRequest {
  model: string;
  messages: ResponsesAPIMessage[];
  reasoning?: { effort: 'low' | 'medium' | 'high' };
  stream: boolean;
  include?: string[];
}

/**
 * Creates a Responses API request body
 */
export function createResponsesAPIRequest(
  model: string,
  systemPrompt: string,
  messages: Array<{ role: string; content: string }>,
  enableWebSearch: boolean,
): ResponsesAPIRequest {
  const requestBody: ResponsesAPIRequest = {
    model,
    messages: convertToResponsesAPIFormat(systemPrompt, messages),
    stream: true,
    include: ['web_search_call.action.sources'],
  };

  // Add reasoning effort for GPT-5 (web search is built-in for reasoning models)
  if (model.toLowerCase().includes('gpt-5')) {
    requestBody.reasoning = { effort: 'medium' };
  }

  return requestBody;
}

interface ChatCompletionsRequest {
  model: string;
  messages: Array<{ role: string; content: string }>;
  stream: boolean;
}

/**
 * Creates a Chat Completions API request body
 */
export function createChatCompletionsRequest(
  model: string,
  systemPrompt: string,
  messages: Array<{ role: string; content: string }>,
  enableWebSearch: boolean,
): ChatCompletionsRequest {
  // Use search model variant if web search is enabled
  const actualModel = enableWebSearch ? getSearchModel(model) : model;

  const requestBody: ChatCompletionsRequest = {
    model: actualModel,
    messages: [{ role: 'system', content: systemPrompt }, ...messages],
    stream: true,
  };

  // Note: Search-enabled models (gpt-4o-search-preview, etc.) have built-in web search
  // and don't require a tools array. The search functionality is automatic.

  return requestBody;
}

interface StreamChunk {
  type?: string;
  text?: string;
  delta?: {
    content?: Array<{ text?: string }>;
  };
  choices?: Array<{
    delta?: {
      content?: string;
    };
  }>;
  action?: {
    sources?: Array<{ url: string; title?: string }>;
  };
}

/**
 * Parses streaming response chunks and extracts content
 */
export function parseStreamChunk(chunk: string): {
  content: string;
  sources?: WebSearchSource[];
} {
  try {
    const parsed: StreamChunk = JSON.parse(chunk);

    // Handle Responses API format
    if (parsed.type === 'response.output_text.delta') {
      return { content: parsed.text || '' };
    }

    if (parsed.type === 'response.output_item.delta') {
      const text = parsed.delta?.content?.[0]?.text || '';
      return { content: text };
    }

    // Handle web search sources
    if (parsed.type === 'web_search_call.completed') {
      const sources = parsed.action?.sources;
      return { content: '', sources };
    }

    // Handle Chat Completions format
    if (parsed.choices?.[0]?.delta?.content) {
      return { content: parsed.choices[0].delta.content };
    }

    return { content: '' };
  } catch (error) {
    return { content: '' };
  }
}

/**
 * Extracts citations from assistant message content
 * This is a placeholder - actual citations would come from the API response
 */
export function extractCitations(content: string): URLCitation[] {
  const citations: URLCitation[] = [];
  // URL pattern matching
  const urlPattern = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
  let match;

  while ((match = urlPattern.exec(content)) !== null) {
    citations.push({
      type: 'url_citation',
      start_index: match.index,
      end_index: match.index + match[0].length,
      url: match[2],
      title: match[1],
    });
  }

  return citations;
}

/**
 * Makes a web search API call
 */
export async function makeWebSearchAPICall(
  apiKey: string,
  model: string,
  systemPrompt: string,
  messages: Array<{ role: string; content: string }>,
  enableWebSearch: boolean,
  onChunk: (content: string, sources?: WebSearchSource[]) => void,
): Promise<{
  content: string;
  sources: WebSearchSource[];
  citations: URLCitation[];
}> {
  const useResponsesAPI = enableWebSearch && isReasoningModel(model);
  const endpoint = useResponsesAPI
    ? 'https://api.openai.com/v1/responses'
    : 'https://api.openai.com/v1/chat/completions';

  const requestBody = useResponsesAPI
    ? createResponsesAPIRequest(model, systemPrompt, messages, enableWebSearch)
    : createChatCompletionsRequest(
        model,
        systemPrompt,
        messages,
        enableWebSearch,
      );

  console.log(
    `[Web Search] Using ${
      useResponsesAPI ? 'Responses' : 'Chat Completions'
    } API`,
  );
  console.log('[Web Search] Request:', JSON.stringify(requestBody, null, 2));

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[Web Search] API Error:', errorText);
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('No response body reader available');
  }

  const decoder = new TextDecoder();
  let accumulatedContent = '';
  const allSources: WebSearchSource[] = [];

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n').filter((line) => line.trim() !== '');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') continue;

          const { content, sources } = parseStreamChunk(data);

          if (content) {
            accumulatedContent += content;
            onChunk(content);
          }

          if (sources && sources.length > 0) {
            allSources.push(...sources);
            onChunk('', sources);
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }

  const citations = extractCitations(accumulatedContent);

  return {
    content: accumulatedContent,
    sources: allSources,
    citations,
  };
}

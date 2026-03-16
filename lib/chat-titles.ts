import type { Message } from './types';

export const DEFAULT_CHAT_TITLE = 'New Chat';
export const CHAT_TITLE_MODEL = 'gpt-4.1-mini';

const FALLBACK_CHAT_TITLE_MAX_WORDS = 9;
const FALLBACK_CHAT_TITLE_MAX_LENGTH = 60;
const GENERATED_CHAT_TITLE_MAX_WORDS = 4;
const GENERATED_CHAT_TITLE_MAX_LENGTH = 32;

export interface ChatTitleContext {
  userPrompt: string;
  assistantReply: string | null;
}

const normalizeTitleSource = (value: string) =>
  value
    .replace(/\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/[`*_>#-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const trimTitle = (
  value: string,
  maxLength: number,
  shouldEllipsize: boolean,
) => {
  const trimmed = value
    .slice(0, maxLength)
    .replace(/[,:;.!?-]+$/, '')
    .trim();

  if (!trimmed) {
    return DEFAULT_CHAT_TITLE;
  }

  return shouldEllipsize ? `${trimmed}...` : trimmed;
};

const summarizeFallbackTitle = (content: string) => {
  const normalized = normalizeTitleSource(content);

  if (!normalized) {
    return DEFAULT_CHAT_TITLE;
  }

  const withoutPreface = normalized
    .replace(/^(please\s+)?(?:can|could|would|will)\s+you\s+/i, '')
    .replace(/^(please\s+)?help\s+me\s+(?:to\s+)?/i, '')
    .replace(/^(please\s+)?i\s+need\s+(?:you\s+to\s+)?/i, '')
    .replace(/^(please\s+)?let'?s\s+/i, '')
    .trim();

  const baseText = withoutPreface || normalized;
  const firstClause =
    baseText.split(/(?:[.!?](?:\s|$)|\s-\s|\s\|\s)/)[0]?.trim() || baseText;
  const words = firstClause.split(' ').filter(Boolean);
  const wordLimited = words.slice(0, FALLBACK_CHAT_TITLE_MAX_WORDS).join(' ');
  const candidateTitle = wordLimited || firstClause;
  const shouldEllipsize =
    words.length > FALLBACK_CHAT_TITLE_MAX_WORDS ||
    firstClause.length > wordLimited.length ||
    candidateTitle.length > FALLBACK_CHAT_TITLE_MAX_LENGTH;

  return trimTitle(
    candidateTitle,
    FALLBACK_CHAT_TITLE_MAX_LENGTH,
    shouldEllipsize,
  );
};

export function getFallbackChatTitleFromPrompt(prompt: string): string {
  return summarizeFallbackTitle(prompt);
}

const getFirstMeaningfulAssistantReply = (
  messages: Message[],
  startIndex: number,
) => {
  for (let index = startIndex + 1; index < messages.length; index += 1) {
    const message = messages[index];

    if (message.role !== 'assistant') {
      continue;
    }

    const normalizedContent = normalizeTitleSource(message.content);
    if (!normalizedContent) {
      continue;
    }

    return {
      id: message.id,
      content: normalizedContent,
    };
  }

  return null;
};

export function getChatTitleContext(
  messages: Message[],
): ChatTitleContext | null {
  for (let index = 0; index < messages.length; index += 1) {
    const message = messages[index];

    if (message.role !== 'user') {
      continue;
    }

    const normalizedPrompt = normalizeTitleSource(message.content);
    if (!normalizedPrompt) {
      continue;
    }

    const firstAssistantReply = getFirstMeaningfulAssistantReply(
      messages,
      index,
    );

    return {
      userPrompt: normalizedPrompt,
      assistantReply: firstAssistantReply?.content ?? null,
    };
  }

  return null;
}

export function getChatTitleContextKey(messages: Message[]): string | null {
  const context = getChatTitleContext(messages);

  if (!context) {
    return null;
  }

  return JSON.stringify(context);
}

export function getFallbackChatTitle(messages: Message[]): string {
  const context = getChatTitleContext(messages);

  if (!context) {
    return DEFAULT_CHAT_TITLE;
  }

  return summarizeFallbackTitle(context.userPrompt);
}

export function sanitizeGeneratedChatTitle(value: string): string {
  const normalized = normalizeTitleSource(value.split(/\r?\n/u)[0] ?? value)
    .replace(/^["'`]+|["'`]+$/g, '')
    .replace(/^[\s,:;.!?-]+|[\s,:;.!?-]+$/g, '')
    .trim();

  if (!normalized) {
    return DEFAULT_CHAT_TITLE;
  }

  const words = normalized.split(' ').filter(Boolean);
  const candidateTitle = words
    .slice(0, GENERATED_CHAT_TITLE_MAX_WORDS)
    .join(' ')
    .slice(0, GENERATED_CHAT_TITLE_MAX_LENGTH)
    .replace(/[,:;.!?-]+$/, '')
    .trim();

  return candidateTitle || DEFAULT_CHAT_TITLE;
}

interface ChatTitleResponse {
  title?: string;
}

export async function requestGeneratedChatTitle(
  apiKey: string,
  messages: Message[],
): Promise<string> {
  const context = getChatTitleContext(messages);
  const fallbackTitle = getFallbackChatTitle(messages);

  if (!context?.assistantReply) {
    return fallbackTitle;
  }

  if (!apiKey || !apiKey.startsWith('sk-')) {
    return fallbackTitle;
  }

  try {
    const response = await fetch('/api/openai/chat-title', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify(context),
    });

    if (!response.ok) {
      throw new Error(
        `OpenAI title API error: ${response.status} ${response.statusText}`,
      );
    }

    const data: ChatTitleResponse = await response.json();
    const generatedTitle = sanitizeGeneratedChatTitle(data.title || '');

    return generatedTitle === DEFAULT_CHAT_TITLE
      ? fallbackTitle
      : generatedTitle;
  } catch (error) {
    console.warn('[Chat Titles] Falling back to heuristic title.', error);
    return fallbackTitle;
  }
}

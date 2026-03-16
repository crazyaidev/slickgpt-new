'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Bot,
  Database,
  Globe,
  Menu,
  Settings2,
  Sparkles,
} from 'lucide-react';

import { CreateAgentDialog } from '@/components/agents/create-agent-dialog';
import { ChatHistorySidebar } from '@/components/chat/chat-history-sidebar';
import { ChatInput } from '@/components/chat/chat-input';
import { ChatMessage } from '@/components/chat/chat-message';
import { SystemPromptSidebar } from '@/components/chat/system-prompt-sidebar';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useOpenAIModels } from '@/hooks/use-openai-models';
import { useStore } from '@/lib/store';
import { cn } from '@/lib/utils';

const waitForNextPaint = () =>
  new Promise<void>((resolve) => {
    if (typeof window === 'undefined') {
      resolve();
      return;
    }

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => resolve());
    });
  });

export default function ChatPage() {
  const {
    currentAgentId,
    currentChatId,
    agents,
    chatSessions,
    addMessage,
    updateMessage,
    setMessageMetadata,
    editMessage,
    deleteMessage,
    truncateChatFromMessage,
    refreshChatTitle,
    updateAgent,
    loadFromStorage,
    apiKeys,
    createNewChat,
    setCurrentAgentId,
    setCurrentChatId,
  } = useStore();
  const { toast } = useToast();
  const { models: openaiModels, isLoading: modelsLoading } = useOpenAIModels();

  const [isLoading, setIsLoading] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [systemPromptSidebarOpen, setSystemPromptSidebarOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  const currentAgent = agents.find((agent) => agent.id === currentAgentId);
  const agentChats = currentAgentId
    ? [...chatSessions]
        .filter((session) => session.agentId === currentAgentId)
        .sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
        )
    : [];
  const currentChat =
    currentAgentId && currentChatId
      ? chatSessions.find(
          (session) =>
            session.id === currentChatId && session.agentId === currentAgentId,
        ) ?? null
      : null;
  const resolvedChat = currentChat ?? agentChats[0] ?? null;
  const resolvedChatId = resolvedChat?.id ?? null;

  useEffect(() => {
    if (!currentAgentId) {
      return;
    }

    if (!resolvedChatId) {
      createNewChat(currentAgentId);
      return;
    }

    if (resolvedChatId !== currentChatId) {
      setCurrentChatId(resolvedChatId);
    }
  }, [
    createNewChat,
    currentAgentId,
    currentChatId,
    resolvedChatId,
    setCurrentChatId,
  ]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [resolvedChatId, resolvedChat?.messages.length]);

  const handleModelChange = (newModel: string) => {
    if (!currentAgentId || !currentAgent) {
      return;
    }

    updateAgent(currentAgentId, { model: newModel });
    toast({
      title: 'Model updated',
      description: `The agent will now use ${newModel}.`,
    });
  };

  const makeAssistantResponse = async (
    chatId: string,
    webSearchEnabled?: boolean,
  ) => {
    if (!currentAgent) {
      return;
    }

    if (!apiKeys.openai) {
      toast({
        title: 'API key missing',
        description: 'Please add your OpenAI API key in Settings.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    let assistantMessageId = '';

    try {
      assistantMessageId = crypto.randomUUID();

      addMessage(chatId, {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        webSearchUsed: webSearchEnabled,
      });

      const { makeWebSearchAPICall } = await import('@/lib/web-search');

      const freshChatSessions = useStore.getState().chatSessions;
      const currentChatSession = freshChatSessions.find(
        (session) => session.id === chatId,
      );

      if (!currentChatSession) {
        throw new Error('Could not find the active chat session.');
      }

      const titleContextKeyBeforeResponse = currentChatSession.titleContextKey;

      const apiMessages = currentChatSession.messages.map((message) => ({
        role: message.role,
        content: message.content,
      }));

      let accumulatedContent = '';

      const { sources, citations } = await makeWebSearchAPICall(
        apiKeys.openai,
        currentAgent.model,
        currentAgent.systemPrompt,
        apiMessages,
        (webSearchEnabled && currentAgent.enableWebSearch) || false,
        (chunk) => {
          if (!chunk) {
            return;
          }

          accumulatedContent += chunk;
          updateMessage(chatId, assistantMessageId, accumulatedContent);
        },
      );

      setMessageMetadata(chatId, assistantMessageId, {
        citations: citations.length > 0 ? citations : undefined,
        sources: sources.length > 0 ? sources : undefined,
        webSearchUsed:
          Boolean(webSearchEnabled) &&
          Boolean(currentAgent.enableWebSearch) &&
          (sources.length > 0 || citations.length > 0),
      });

      const latestChatSession = useStore
        .getState()
        .chatSessions.find((session) => session.id === chatId);

      if (
        latestChatSession &&
        latestChatSession.titleContextKey !== titleContextKeyBeforeResponse
      ) {
        await waitForNextPaint();
        void refreshChatTitle(chatId);
      }
    } catch (error) {
      console.error('Error sending message:', error);

      deleteMessage(chatId, assistantMessageId);

      toast({
        title: 'Error',
        description:
          error instanceof Error
            ? error.message
            : 'Failed to get a response. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (
    content: string,
    webSearchEnabled?: boolean,
  ) => {
    if (!currentAgent) {
      return;
    }

    const chatId = resolvedChatId ?? createNewChat(currentAgent.id);

    addMessage(chatId, {
      role: 'user',
      content,
      webSearchUsed: webSearchEnabled,
    });

    await makeAssistantResponse(chatId, webSearchEnabled);
  };

  const handleEditMessage = async (messageId: string, content: string) => {
    if (!resolvedChatId || !currentAgent) {
      return;
    }

    const currentChatSession = chatSessions.find(
      (session) => session.id === resolvedChatId,
    );
    const messageToEdit = currentChatSession?.messages.find(
      (message) => message.id === messageId,
    );

    if (!messageToEdit) {
      return;
    }

    if (messageToEdit.role === 'user') {
      const webSearchUsed = messageToEdit.webSearchUsed;

      editMessage(resolvedChatId, messageId, content);
      await makeAssistantResponse(resolvedChatId, webSearchUsed);
      return;
    }

    updateMessage(resolvedChatId, messageId, content);
    void refreshChatTitle(resolvedChatId);
  };

  const handleDeleteMessage = (messageId: string) => {
    if (!resolvedChatId) {
      return;
    }

    const currentChatSession = chatSessions.find(
      (session) => session.id === resolvedChatId,
    );
    const messageToDelete = currentChatSession?.messages.find(
      (message) => message.id === messageId,
    );

    if (!messageToDelete || !currentChatSession) {
      return;
    }

    if (messageToDelete.role === 'user') {
      if (
        confirm(
          'Delete this message and everything that came after it in the conversation?',
        )
      ) {
        truncateChatFromMessage(resolvedChatId, messageId);
        void refreshChatTitle(resolvedChatId);
        setIsLoading(false);
      }

      return;
    }

    if (confirm('Delete this assistant reply?')) {
      deleteMessage(resolvedChatId, messageId);
      void refreshChatTitle(resolvedChatId);
      setIsLoading(false);
    }
  };

  if (!currentAgent) {
    return (
      <div className="fixed inset-0 overflow-hidden bg-background text-foreground">
        <main className="flex h-full items-center justify-center overflow-y-auto px-6 py-12">
          <div className="mx-auto w-full max-w-3xl text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Sparkles className="h-7 w-7" />
            </div>
            <h1 className="mt-6 text-3xl font-semibold tracking-tight">
              Choose an agent to start chatting
            </h1>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Each agent keeps its own conversation history, so you can switch
              between workflows without mixing context.
            </p>

            {agents.length > 0 ? (
              <div className="mt-8 grid gap-3 md:grid-cols-2">
                {agents.slice(0, 6).map((agent) => (
                  <button
                    key={agent.id}
                    type="button"
                    onClick={() => setCurrentAgentId(agent.id)}
                    className="rounded-[1.5rem] border border-border bg-card p-5 text-left transition-colors hover:bg-accent/40"
                  >
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <Bot className="h-5 w-5" />
                    </div>
                    <p className="font-medium">{agent.name}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {agent.model}
                    </p>
                  </button>
                ))}
              </div>
            ) : (
              <div className="mt-8 flex justify-center">
                <CreateAgentDialog />
              </div>
            )}
          </div>
        </main>
      </div>
    );
  }

  const starterPrompts = [
    {
      title: 'Draft a proposal',
      description: 'Turn a project brief into a concise, confident pitch.',
      prompt:
        'Help me draft a concise proposal for this project. Start by asking for the job post if needed.',
      webSearch: false,
    },
    {
      title: 'Summarize the brief',
      description: 'Pull out goals, risks, and the best next step.',
      prompt:
        'Summarize the project brief into client goals, likely risks, and a suggested response strategy.',
      webSearch: false,
    },
    {
      title: 'Polish rough notes',
      description: 'Rewrite my thoughts into a cleaner client-facing response.',
      prompt:
        'Turn my rough notes into a polished client-facing message with a clear structure.',
      webSearch: false,
    },
    {
      title: currentAgent.enableWebSearch ? 'Research live context' : 'Plan next steps',
      description: currentAgent.enableWebSearch
        ? 'Use web search to gather fresh context before answering.'
        : 'Break the work into a practical action plan.',
      prompt: currentAgent.enableWebSearch
        ? 'Research this company or client and give me a concise brief with useful talking points.'
        : 'Create a short execution plan for this task with milestones and deliverables.',
      webSearch: currentAgent.enableWebSearch,
    },
  ];

  return (
    <div className="fixed inset-0 overflow-hidden bg-background text-foreground">
      <div className="relative flex h-full min-w-0 overflow-hidden">
        {historyOpen ? (
          <button
            type="button"
            aria-label="Close chat history"
            className="absolute inset-0 z-20 bg-black/35 md:hidden"
            onClick={() => setHistoryOpen(false)}
          />
        ) : null}

        <div
          className={cn(
            'absolute inset-y-0 left-0 z-30 transition-transform md:relative md:translate-x-0',
            historyOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
          )}
        >
          <ChatHistorySidebar onClose={() => setHistoryOpen(false)} />
        </div>

        <div className="flex min-w-0 flex-1 flex-col bg-background">
          <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-border bg-background/95 px-4 md:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <Button
                size="icon"
                variant="ghost"
                className="h-9 w-9 rounded-full md:hidden"
                onClick={() => setHistoryOpen(true)}
                aria-label="Open chat history"
              >
                <Menu className="h-4 w-4" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-full"
                asChild
              >
                <Link href="/agents" aria-label="Back to agents">
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>

              <div className="min-w-0">
                <h1 className="truncate text-sm font-semibold md:text-base">
                  {currentAgent.name}
                </h1>
                <p className="truncate text-xs text-muted-foreground">
                  {resolvedChat?.title && resolvedChat.title !== 'New Chat'
                    ? resolvedChat.title
                    : currentAgent.model}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Select
                value={currentAgent.model}
                onValueChange={handleModelChange}
                disabled={modelsLoading}
              >
                <SelectTrigger className="h-9 w-[150px] rounded-full border-border bg-card md:w-[180px]">
                  <SelectValue
                    placeholder={modelsLoading ? 'Loading...' : 'Select model'}
                  />
                </SelectTrigger>
                <SelectContent>
                  {openaiModels.map((model) => (
                    <SelectItem key={model} value={model}>
                      {model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 rounded-full border-border bg-card"
                onClick={() => setSystemPromptSidebarOpen(true)}
              >
                <Settings2 className="h-4 w-4" />
              </Button>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto">
            <div className="mx-auto flex min-h-full w-full max-w-4xl flex-col px-4 pb-6 pt-6 md:px-8">
              <div className="mb-6 flex flex-wrap gap-2">
                <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  {currentAgent.model}
                </div>
                {currentAgent.enableWebSearch ? (
                  <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
                    <Globe className="h-3.5 w-3.5 text-primary" />
                    Web search available
                  </div>
                ) : null}
                {currentAgent.knowledgeBaseId ? (
                  <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
                    <Database className="h-3.5 w-3.5 text-primary" />
                    Knowledge connected
                  </div>
                ) : null}
              </div>

              {resolvedChat && resolvedChat.messages.length > 0 ? (
                <div className="flex-1">
                  {resolvedChat.messages.map((message) => (
                    <ChatMessage
                      key={message.id}
                      message={message}
                      onEdit={handleEditMessage}
                      onDelete={handleDeleteMessage}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-1 flex-col items-center justify-center py-12 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Bot className="h-7 w-7" />
                  </div>
                  <h2 className="mt-6 text-4xl font-semibold tracking-tight">
                    How can {currentAgent.name} help?
                  </h2>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                    {currentAgent.systemPrompt}
                  </p>

                  <div className="mt-8 grid w-full max-w-3xl gap-3 md:grid-cols-2">
                    {starterPrompts.map((starter) => (
                      <button
                        key={starter.title}
                        type="button"
                        onClick={() =>
                          handleSendMessage(starter.prompt, starter.webSearch)
                        }
                        className="rounded-[1.5rem] border border-border bg-card p-5 text-left transition-colors hover:bg-accent/40"
                      >
                        <p className="font-medium">{starter.title}</p>
                        <p className="mt-2 text-sm leading-6 text-muted-foreground">
                          {starter.description}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} className="h-2 shrink-0" />
            </div>
          </div>

          <div className="shrink-0 border-t border-border bg-background/95 px-4 py-4 md:px-6">
            <ChatInput onSend={handleSendMessage} isLoading={isLoading} />
            <p className="mt-3 text-center text-xs text-muted-foreground">
              Responses are generated from this agent&apos;s prompt, chat history,
              and any tools you enable here.
            </p>
          </div>
        </div>
      </div>

      <SystemPromptSidebar
        isOpen={systemPromptSidebarOpen}
        onClose={() => setSystemPromptSidebarOpen(false)}
      />
    </div>
  );
}

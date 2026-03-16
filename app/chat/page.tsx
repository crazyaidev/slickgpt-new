'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { storage } from '@/lib/storage';
import { ChatHistorySidebar } from '@/components/chat/chat-history-sidebar';
import { SystemPromptSidebar } from '@/components/chat/system-prompt-sidebar';
import { ChatMessage } from '@/components/chat/chat-message';
import { ChatInput } from '@/components/chat/chat-input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useOpenAIModels } from '@/hooks/use-openai-models';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Menu, Settings } from 'lucide-react';
import Link from 'next/link';

export default function ChatPage() {
  const router = useRouter();
  const {
    currentAgentId,
    currentChatId,
    agents,
    chatSessions,
    addMessage,
    updateMessage,
    editMessage,
    deleteMessage,
    updateAgent,
    loadFromStorage,
    apiKeys,
  } = useStore();
  const { toast } = useToast();
  const { models: openaiModels, isLoading: modelsLoading } = useOpenAIModels();

  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [systemPromptSidebarOpen, setSystemPromptSidebarOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  useEffect(() => {
    if (!currentAgentId) {
      router.push('/agents');
    }
  }, [currentAgentId, router]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatSessions, currentChatId]);

  const currentAgent = agents.find((a) => a.id === currentAgentId);
  const currentChat = chatSessions.find((s) => s.id === currentChatId);

  const handleModelChange = (newModel: string) => {
    if (!currentAgentId || !currentAgent) return;

    updateAgent(currentAgentId, { model: newModel });
    toast({
      title: 'Model updated',
      description: `Model changed to ${newModel}. This change will be reflected in the agent editor.`,
    });
  };

  // Core function to make API call without adding user message
  const makeAssistantResponse = async (
    webSearchEnabled?: boolean,
  ) => {
    if (!currentAgent || !currentChatId) return;

    if (!apiKeys.openai) {
      toast({
        title: 'API Key Missing',
        description: 'Please add your OpenAI API key in Settings.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    let assistantMessageId = '';

    try {
      assistantMessageId = crypto.randomUUID();
      addMessage(currentChatId, {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        webSearchUsed: webSearchEnabled,
      });

      // Import web search utilities
      const { makeWebSearchAPICall } = await import('@/lib/web-search');

      // Build messages array for API from current chat messages
      // Get fresh state from store to ensure we have the latest messages after editing
      const freshChatSessions = useStore.getState().chatSessions;
      const currentChatSession = freshChatSessions.find((s) => s.id === currentChatId);
      const apiMessages = currentChatSession!.messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      // Accumulate content for streaming
      let accumulatedContent = '';

      // Make API call with web search support
      const {
        content: responseContent,
        sources,
        citations,
      } = await makeWebSearchAPICall(
        apiKeys.openai,
        currentAgent.model,
        currentAgent.systemPrompt,
        apiMessages,
        (webSearchEnabled && currentAgent.enableWebSearch) || false,
        (chunk) => {
          if (chunk) {
            accumulatedContent += chunk;
            updateMessage(
              currentChatId,
              assistantMessageId,
              accumulatedContent,
            );
          }
        },
      );

      // Update the message with final content and metadata
      // Get fresh state again to ensure we have the latest messages
      const finalChatSessions = useStore.getState().chatSessions;
      const updatedChatSession = finalChatSessions.find(
        (s) => s.id === currentChatId,
      );
      if (updatedChatSession) {
        const finalMessage = updatedChatSession.messages.find(
          (m) => m.id === assistantMessageId,
        );

        if (finalMessage) {
          finalMessage.citations = citations.length > 0 ? citations : undefined;
          finalMessage.sources = sources.length > 0 ? sources : undefined;
          finalMessage.webSearchUsed =
            webSearchEnabled &&
            currentAgent.enableWebSearch &&
            (sources.length > 0 || citations.length > 0);
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);

      // Remove the empty assistant message that was created
      deleteMessage(currentChatId, assistantMessageId);

      toast({
        title: 'Error',
        description:
          error instanceof Error
            ? error.message
            : 'Failed to get response. Please check your API key and try again.',
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
    if (!currentAgent || !currentChatId) return;

    // Add user message
    const userMessage = addMessage(currentChatId, {
      role: 'user',
      content,
      webSearchUsed: webSearchEnabled,
    });

    // Get assistant response
    await makeAssistantResponse(webSearchEnabled);
  };

  const handleEditMessage = async (messageId: string, content: string) => {
    if (!currentChatId || !currentAgent) return;

    // Find the message to check its role
    const currentChatSession = chatSessions.find((s) => s.id === currentChatId);
    const messageToEdit = currentChatSession?.messages.find(
      (m) => m.id === messageId,
    );

    if (!messageToEdit) return;

    // Different behavior based on message role
    if (messageToEdit.role === 'user') {
      // Store the webSearchUsed flag before editing
      const webSearchUsed = messageToEdit.webSearchUsed;

      // For user messages: edit and truncate messages after it
      editMessage(currentChatId, messageId, content);

      // Trigger a new API call without creating a new user message
      await makeAssistantResponse(webSearchUsed);
    } else {
      // For assistant messages: just update the content without truncating
      updateMessage(currentChatId, messageId, content);
    }
  };

  const handleDeleteMessage = (messageId: string) => {
    if (!currentChatId) return;

    const currentChatSession = chatSessions.find((s) => s.id === currentChatId);
    const messageToDelete = currentChatSession?.messages.find(
      (m) => m.id === messageId,
    );

    if (!messageToDelete) return;

    // If it's a user message, delete it and all following messages
    if (messageToDelete.role === 'user') {
      if (
        confirm(
          'Are you sure you want to delete this message and all following messages?',
        )
      ) {
        // Find the index of the message to delete
        const messageIndex = currentChatSession?.messages.findIndex(
          (m) => m.id === messageId,
        );
        if (
          messageIndex !== undefined &&
          messageIndex !== -1 &&
          currentChatSession
        ) {
          // Delete all messages from this index onward
          const messagesToKeep = currentChatSession.messages.slice(
            0,
            messageIndex,
          );

          // Update the chat session with only the messages to keep
          const updatedChatSessions = chatSessions.map((session) => {
            if (session.id === currentChatId) {
              return {
                ...session,
                messages: messagesToKeep,
                updatedAt: new Date().toISOString(),
              };
            }
            return session;
          });

          // Update the store directly
          useStore.setState({ chatSessions: updatedChatSessions });
          storage.saveChatSessions(updatedChatSessions);
        }
        setIsLoading(false);
      }
    } else {
      // For assistant messages, just delete that message
      if (confirm('Are you sure you want to delete this message?')) {
        deleteMessage(currentChatId, messageId);
        setIsLoading(false);
      }
    }
  };

  if (!currentAgent || !currentChat) {
    return (
      <div className="flex h-screen items-center justify-center p-4">
        <div className="text-center">
          <p className="text-muted-foreground">No agent selected</p>
          <Link href="/agents">
            <Button className="mt-4">Select an Agent</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex min-h-0 min-w-0 flex-col overflow-hidden md:flex-row">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Left Sidebar - Chat History */}
      <div
        className={`${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } fixed inset-y-0 left-0 z-50 w-64 transition-transform md:relative md:shrink-0 md:translate-x-0`}>
        <ChatHistorySidebar onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Main chat area */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        {/* Fixed Header */}
        <div className="flex h-14 shrink-0 items-center gap-2 border-b border-border bg-background px-3 md:px-4">
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 md:hidden"
            onClick={() => setSidebarOpen(true)}>
            <Menu className="h-4 w-4" />
          </Button>
          <Link href="/agents">
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 md:h-9 md:w-9">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-sm font-semibold text-foreground md:text-base">
              {currentAgent.name}
            </h1>
            <p className="truncate text-xs text-muted-foreground">
              {currentAgent.model}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            <Select
              value={currentAgent.model}
              onValueChange={handleModelChange}
              disabled={modelsLoading}>
              <SelectTrigger
                className="h-8 w-[120px] max-w-[42vw] sm:w-[140px] md:h-9 md:w-[160px]"
                size="sm">
                <SelectValue
                  placeholder={modelsLoading ? 'Loading...' : 'Select model'}
                />
              </SelectTrigger>
              <SelectContent>
                {openaiModels.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 md:h-9 md:w-9"
              onClick={() =>
                setSystemPromptSidebarOpen(!systemPromptSidebarOpen)
              }>
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Scrollable Messages Area */}
        <div className="flex min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain">
          <div className="mx-auto flex min-h-full w-full max-w-3xl flex-col px-3 md:px-4">
            {currentChat.messages.length === 0 ? (
              <div className="flex min-h-[300px] flex-1 items-center justify-center py-10">
                <div className="text-center">
                  <h3 className="mb-2 text-lg font-semibold">
                    Start a conversation
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Send a message to begin chatting with {currentAgent.name}
                  </p>
                </div>
              </div>
            ) : (
              currentChat.messages.map((message) => (
                <ChatMessage
                  key={message.id}
                  message={message}
                  onEdit={handleEditMessage}
                  onDelete={handleDeleteMessage}
                />
              ))
            )}
            <div ref={messagesEndRef} className="h-4 shrink-0" />
          </div>
        </div>

        {/* Fixed Input Area */}
        <div className="shrink-0 border-t border-border bg-background">
          <ChatInput onSend={handleSendMessage} isLoading={isLoading} />
        </div>
      </div>

      {/* Right Sidebar - System Prompt */}
      <SystemPromptSidebar
        isOpen={systemPromptSidebarOpen}
        onClose={() => setSystemPromptSidebarOpen(false)}
      />
    </div>
  );
}

'use client';

import type React from 'react';

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { MessageSquare, PenSquare, Search, Trash2, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useStore } from '@/lib/store';
import { cn } from '@/lib/utils';

interface ChatHistorySidebarProps {
  onClose?: () => void;
}

export function ChatHistorySidebar({ onClose }: ChatHistorySidebarProps) {
  const {
    currentAgentId,
    agents,
    chatSessions,
    currentChatId,
    setCurrentChatId,
    createNewChat,
    deleteChatSession,
  } = useStore();
  const [query, setQuery] = useState('');

  if (!currentAgentId) {
    return null;
  }

  const currentAgent = agents.find((agent) => agent.id === currentAgentId);
  if (!currentAgent) {
    return null;
  }

  const agentChats = [...chatSessions]
    .filter((session) => session.agentId === currentAgentId)
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );

  const normalizedQuery = query.trim().toLowerCase();
  const filteredChats = normalizedQuery
    ? agentChats.filter((session) => {
        const matchesTitle = session.title.toLowerCase().includes(normalizedQuery);
        const matchesMessage = session.messages.some((message) =>
          message.content.toLowerCase().includes(normalizedQuery),
        );

        return matchesTitle || matchesMessage;
      })
    : agentChats;

  const handleNewChat = () => {
    createNewChat(currentAgentId);
    onClose?.();
  };

  const handleDeleteChat = (chatId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    deleteChatSession(chatId);
  };

  const handleSelectChat = (chatId: string) => {
    setCurrentChatId(chatId);
    onClose?.();
  };

  const renderRelativeTime = (value: string) => {
    const timestamp = new Date(value);

    if (Number.isNaN(timestamp.getTime())) {
      return 'Recently';
    }

    return formatDistanceToNow(timestamp, { addSuffix: true });
  };

  const getDisplayTitle = (value: string) => {
    const normalizedTitle = value.trim().replace(/\s+/g, ' ') || 'New chat';

    if (normalizedTitle.length <= 40) {
      return normalizedTitle;
    }

    return `${normalizedTitle.slice(0, 37).trimEnd()}...`;
  };

  return (
    <aside className="flex h-full min-h-0 w-80 max-w-full flex-col border-r border-border bg-sidebar">
      <div className="border-b border-border px-4 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Chat history
            </p>
            <h2 className="mt-1 truncate text-sm font-semibold text-sidebar-foreground">
              {currentAgent.name}
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {agentChats.length} saved chats
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="icon"
              variant="outline"
              className="h-9 w-9 rounded-full border-border bg-background"
              onClick={handleNewChat}
              aria-label="Start a new chat"
            >
              <PenSquare className="h-4 w-4" />
            </Button>
            {onClose ? (
              <Button
                size="icon"
                variant="ghost"
                className="h-9 w-9 rounded-full md:hidden"
                onClick={onClose}
                aria-label="Close chat history"
              >
                <X className="h-4 w-4" />
              </Button>
            ) : null}
          </div>
        </div>

        <div className="relative mt-4">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search chats"
            className="h-10 rounded-full border-border bg-background pl-9"
          />
        </div>
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <div className="space-y-2 p-3">
          {filteredChats.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-background/60 px-4 py-6 text-sm text-muted-foreground">
              {normalizedQuery
                ? 'No chats match your search.'
                : 'Start a conversation and it will appear here for this agent.'}
            </div>
          ) : (
            filteredChats.map((session) => {
              const isActive = currentChatId === session.id;
              const chatTitle = session.title || 'New chat';
              const displayTitle = getDisplayTitle(chatTitle);

              return (
                <div
                  key={session.id}
                  className={cn(
                    'group grid grid-cols-[minmax(0,1fr)_auto] items-start gap-1 rounded-2xl border transition-colors',
                    isActive
                      ? 'border-primary/20 bg-sidebar-accent'
                      : 'border-transparent hover:bg-sidebar-accent/60',
                  )}
                >
                  <button
                    type="button"
                    onClick={() => handleSelectChat(session.id)}
                    className="flex min-w-0 w-full items-start gap-3 overflow-hidden px-3 py-3 text-left"
                  >
                    <div
                      className={cn(
                        'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl',
                        isActive
                          ? 'bg-primary/10 text-primary'
                          : 'bg-background text-muted-foreground',
                      )}
                    >
                      <MessageSquare className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1 overflow-hidden">
                      <p
                        className="truncate pr-1 text-sm font-medium text-sidebar-foreground"
                        title={chatTitle}
                      >
                        {displayTitle}
                      </p>
                      <p className="mt-1 truncate text-xs text-muted-foreground">
                        {renderRelativeTime(session.updatedAt)} / {session.messages.length}{' '}
                        messages
                      </p>
                    </div>
                  </button>

                  <div className="shrink-0 pr-2 pt-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 rounded-full opacity-100 transition-opacity hover:text-destructive md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100"
                      onClick={(event) => handleDeleteChat(session.id, event)}
                      aria-label={`Delete ${chatTitle}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>
    </aside>
  );
}

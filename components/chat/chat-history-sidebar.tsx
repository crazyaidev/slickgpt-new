'use client';

import type React from 'react';

import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useStore } from '@/lib/store';
import { MessageSquare, Plus, Trash2, X } from 'lucide-react';
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

  const currentAgent = agents.find((a) => a.id === currentAgentId);
  const agentChats = chatSessions.filter(
    (session) => session.agentId === currentAgentId,
  );

  if (!currentAgent) return null;

  const handleNewChat = () => {
    createNewChat(currentAgentId!);
    onClose?.();
  };

  const handleDeleteChat = (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteChatSession(chatId);
  };

  const handleSelectChat = (chatId: string) => {
    setCurrentChatId(chatId);
    onClose?.();
  };

  const truncateTitle = (title: string, maxLength: number = 20): string => {
    if (title.length <= maxLength) {
      return title;
    }
    return title.substring(0, maxLength - 4) + '...?';
  };

  return (
    <div className="flex h-full w-full flex-col border-r border-border bg-sidebar md:w-64">
      {/* Header */}
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-border px-3 md:px-4">
        <h2 className="truncate text-sm font-semibold text-sidebar-foreground">
          {currentAgent.name}
        </h2>
        <div className="flex items-center gap-1">
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            onClick={handleNewChat}>
            <Plus className="h-4 w-4" />
          </Button>
          {onClose && (
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 md:hidden"
              onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Chat List */}
      <ScrollArea className="flex-1">
        <div className="space-y-1 p-2">
          {agentChats.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              No chat history
            </div>
          ) : (
            agentChats.map((session) => (
              <div
                key={session.id}
                className={cn(
                  'group flex w-full items-center rounded-lg text-sm transition-colors overflow-hidden',
                  currentChatId === session.id
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent/50',
                )}>
                <button
                  onClick={() => handleSelectChat(session.id)}
                  className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden text-left px-3 py-2 pr-1">
                  <MessageSquare className="h-4 w-4 shrink-0" />
                  <span className="min-w-0 truncate">
                    {truncateTitle(session.title)}
                  </span>
                </button>
                <div className="flex items-center shrink-0 pr-2">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6 opacity-50 transition-opacity hover:bg-accent hover:text-destructive hover:opacity-100 group-hover:opacity-100 focus:opacity-100"
                    onClick={(e) => handleDeleteChat(session.id, e)}
                    aria-label="Delete chat">
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

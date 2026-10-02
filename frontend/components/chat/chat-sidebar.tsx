"use client";

import { formatDistanceToNow } from "date-fns";
import { Plus, RotateCcw, PanelLeftClose, Network, Trash2 } from "lucide-react";
import Link from "next/link";

import { IndexStatusBadge } from "@/components/dashboard/repo-status";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useChatSessions,
  useCreateChatSession,
  useDeleteChatSession,
} from "@/hooks/use-chat";
import { useStartIndexing } from "@/hooks/use-repos";
import type { Repository } from "@/lib/api";
import { cn } from "@/lib/utils";

export function ChatSidebar({
  repo,
  sessionId,
  onSelectSession,
  onClose,
  clearIndex,
}: {
  repo: Repository;
  sessionId: string | null;
  onSelectSession: (id: string) => void;
  onClose?: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  clearIndex: any;
}) {
  const ready = repo.indexStatus === "READY";
  const sessionsQuery = useChatSessions(repo.id, ready);
  const createSession = useCreateChatSession(repo.id);
  const deleteSession = useDeleteChatSession(repo.id);
  const reindex = useStartIndexing();

  return (
    <aside className="flex w-full flex-col border-b md:w-72 md:border-r md:border-b-0">
      <div className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1 min-w-0">
            <p className="truncate text-sm font-medium">{repo.fullName}</p>
            <div className="flex flex-wrap items-center gap-2">
              <IndexStatusBadge status={repo.indexStatus} />
              {repo.isPrivate && (
                <span className="text-xs text-muted-foreground">Private</span>
              )}
            </div>
          </div>
          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
              onClick={onClose}
              aria-label="Close chat history"
            >
              <PanelLeftClose className="size-4" />
            </Button>
          )}
        </div>

        <div className="flex gap-2">
          <Button
            size="sm"
            className="flex-1"
            disabled={!ready || createSession.isPending}
            onClick={() =>
              createSession.mutate("New chat", {
                onSuccess: (session) => onSelectSession(session.id),
              })
            }
          >
            <Plus data-icon="inline-start" />
            New chat
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={reindex.isPending || repo.indexStatus === "INDEXING"}
            onClick={() => reindex.mutate(repo.id)}
            aria-label="Re-index repository"
          >
            <RotateCcw />
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={repo.indexStatus === "PENDING" || clearIndex.isPending}
            onClick={() => {
              if (window.confirm("Are you sure you want to delete all indexed data, visuals, and chat history for this repository?")) {
                clearIndex.mutate(repo.id, {
                  onSuccess: () => {
                    // Navigate away from specific chat session if we were in one
                    if (sessionId) {
                      onSelectSession("");
                    }
                  }
                });
              }
            }}
            aria-label="Clear index data"
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 />
          </Button>
        </div>
        
        <Button
          render={<Link href={`/chat/${repo.id}/visualizations`} />}
          nativeButton={false}
          variant="secondary"
          size="sm"
          className="w-full"
          disabled={!ready}
        >
          <Network data-icon="inline-start" className="mr-2 size-4" />
          View Visualizations
        </Button>
      </div>

      <Separator />

      <div className="px-4 py-2 text-xs font-medium text-muted-foreground">
        Sessions
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-1 px-2 pb-4">
          {!ready && (
            <p className="px-2 text-xs text-muted-foreground">
              Sessions unlock after indexing completes.
            </p>
          )}

          {sessionsQuery.isLoading &&
            Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-12 rounded-xl" />
            ))}

          {sessionsQuery.data?.map((session) => (
            <div
              key={session.id}
              className={cn(
                "group relative flex w-full items-center justify-between rounded-xl px-3 py-2.5 transition-colors hover:bg-muted",
                sessionId === session.id && "bg-muted"
              )}
            >
              <button
                type="button"
                onClick={() => onSelectSession(session.id)}
                className="flex-1 text-left min-w-0 pr-2"
              >
                <p className="truncate text-sm font-medium">{session.title}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(session.createdAt), {
                    addSuffix: true,
                  })}
                </p>
              </button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive shrink-0"
                onClick={(e) => {
                  e.stopPropagation();
                  if (window.confirm("Are you sure you want to delete this chat session?")) {
                    deleteSession.mutate(session.id, {
                      onSuccess: () => {
                        if (sessionId === session.id) {
                          onSelectSession("");
                        }
                      }
                    });
                  }
                }}
                disabled={deleteSession.isPending}
                aria-label="Delete chat session"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}

          {ready && sessionsQuery.isSuccess && sessionsQuery.data.length === 0 && (
            <p className="px-2 text-xs text-muted-foreground">
              No chats yet. Start one to begin.
            </p>
          )}
        </div>
      </ScrollArea>
    </aside>
  );
}

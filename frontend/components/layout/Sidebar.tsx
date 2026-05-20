"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  Download,
  Folder,
  MoreHorizontal,
  PencilLine,
  Pin,
  Plus,
  Settings2,
  Trash2
} from "lucide-react";
import { ScrollArea } from "../ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "../ui/dropdown-menu";
import { getCurrentConversation, useChatStore } from "../../lib/store";
import { cn } from "../../lib/utils";

export function Sidebar({
  collapsed,
  onToggle
}: {
  collapsed: boolean;
  onToggle: () => void;
}) {
  const {
    conversations,
    currentConversationId,
    selectConversation,
    startNewChat,
    setConversationTitle,
    togglePin,
    deleteConversation
  } = useChatStore();
  const conversation = useChatStore(getCurrentConversation);
  const router = useRouter();
  const itemClass =
    "sidebar-item";
  const sortedConversations = [...conversations].sort((a, b) => {
    const pinScore = Number(Boolean(b.pinned)) - Number(Boolean(a.pinned));
    if (pinScore !== 0) return pinScore;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  const formatUpdatedAt = (value: string) => {
    const time = new Date(value);
    if (Number.isNaN(time.getTime())) return "";
    return time.toLocaleString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "short"
    });
  };

  return (
    <div className="sidebar-content flex h-full flex-col gap-3 overflow-hidden px-2 py-2 text-sm">
      <div className="flex items-center justify-between px-3">
        {!collapsed && (
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Image
              src="/gigachat.png"
              alt="GigaChat"
              width={16}
              height={16}
              className="logo-glow"
            />
            <span className="logo-text">GigaChat</span>
          </div>
        )}
        <button
          onClick={onToggle}
          className="icon-ghost flex h-7 w-7 items-center justify-center rounded-md"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <Image src="/gigachat.png" alt="Open sidebar" width={16} height={16} />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>

      <button
        onClick={() => {
          startNewChat();
          router.push("/chat");
        }}
        className={cn(
          itemClass,
          "sidebar-primary",
          collapsed && "sidebar-icon-only justify-center px-0"
        )}
      >
        <Plus className="sidebar-icon h-4 w-4" />
        {!collapsed && "New consultation"}
      </button>

      <div className="flex min-h-0 flex-1 flex-col">
        {!collapsed && (
          <>
            <p className="mt-2 px-3 text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
              Recent consultations
            </p>
            <ScrollArea className="mt-2 flex-1">
              <div className="space-y-1">
                {sortedConversations.map((conv) => (
                  <div
                    key={conv.id}
                    className={cn(
                      "group",
                      itemClass,
                      conv.id === currentConversationId ? "sidebar-item-active" : ""
                    )}
                  >
                    <button
                      onClick={() => {
                        selectConversation(conv.id);
                        router.push("/chat");
                      }}
                      className={cn(
                        "min-w-0 flex-1 text-left",
                        conv.id === currentConversationId
                          ? "text-foreground"
                          : "text-muted-foreground group-hover:text-foreground"
                      )}
                    >
                      <div className="flex items-center gap-1 truncate text-sm">
                        <span className="truncate">{conv.title}</span>
                        {conv.pinned && <Pin className="h-3.5 w-3.5 text-primary" />}
                      </div>
                      <div className="text-[10px] text-muted-foreground/70">
                        {formatUpdatedAt(conv.updatedAt)}
                      </div>
                    </button>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          className="icon-ghost flex h-7 w-7 items-center justify-center rounded-md opacity-60 transition group-hover:opacity-100"
                          aria-label="Chat options"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            const next = window.prompt("Rename consultation", conv.title);
                            if (!next) return;
                            const trimmed = next.trim();
                            if (!trimmed) return;
                            setConversationTitle(conv.id, trimmed);
                          }}
                        >
                          <PencilLine className="h-4 w-4" /> Rename
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => togglePin(conv.id)}>
                          <Pin className="h-4 w-4" /> {conv.pinned ? "Unpin" : "Pin chat"}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => deleteConversation(conv.id)}
                          className="text-red-300 focus:text-red-200"
                        >
                          <Trash2 className="h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </>
        )}
      </div>

      {!collapsed && <div className="mx-2 my-3 h-px bg-white/10" />}

      <div className={cn("space-y-1", collapsed ? "flex flex-col items-center gap-1 px-0 pt-1" : "px-2")}
      >
        <Link
          href="/knowledge"
          className={cn(
            itemClass,
            collapsed
              ? "sidebar-icon-only justify-center px-0"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Folder className="sidebar-icon sidebar-icon-strong h-4 w-4 flex-shrink-0" />
          {!collapsed && "Plant Knowledge"}
        </Link>
        <Link
          href="/settings"
          className={cn(
            itemClass,
            collapsed
              ? "sidebar-icon-only justify-center px-0"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Settings2 className="sidebar-icon sidebar-icon-strong h-4 w-4 flex-shrink-0" />
          {!collapsed && "Settings"}
        </Link>
        <button
          onClick={() => {
            const blob = new Blob([JSON.stringify(conversation, null, 2)], {
              type: "application/json"
            });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `conversation-${conversation.id}.json`;
            link.click();
            URL.revokeObjectURL(url);
          }}
          className={cn(
            itemClass,
            collapsed
              ? "sidebar-icon-only justify-center px-0"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Download className="sidebar-icon sidebar-icon-strong h-4 w-4 flex-shrink-0" />
          {!collapsed && "Export consultation"}
        </button>
      </div>
    </div>
  );
}

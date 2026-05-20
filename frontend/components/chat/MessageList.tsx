"use client";

import { useMemo } from "react";
import type { ChatMessage } from "../../lib/types";
import { MessageItem } from "./MessageItem";

export function MessageList({
  messages,
  onRegenerate,
  onEdit
}: {
  messages: ChatMessage[];
  onRegenerate: () => void;
  onEdit: (id: string, content: string) => void;
}) {
  const lastUser = useMemo(
    () => messages.filter((msg) => msg.role === "user").slice(-1)[0],
    [messages]
  );

  return (
    <div className="space-y-5">
      {messages.map((message) => (
        <MessageItem
          key={message.id}
          message={message}
          onCopy={() => navigator.clipboard.writeText(message.content)}
          onRegenerate={
            message.role === "assistant" && message.id === messages.at(-1)?.id
              ? onRegenerate
              : undefined
          }
          onEdit={
            message.role === "user" && message.id === lastUser?.id
              ? () => onEdit(message.id, message.content)
              : undefined
          }
        />
      ))}
    </div>
  );
}

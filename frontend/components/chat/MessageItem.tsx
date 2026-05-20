"use client";

import { ClipboardCopy, RotateCcw, Pencil } from "lucide-react";
import { motion } from "framer-motion";
import { MarkdownRenderer } from "../markdown/MarkdownRenderer";
import type { ChatMessage } from "../../lib/types";
import { cn } from "../../lib/utils";

export function MessageItem({
  message,
  onCopy,
  onRegenerate,
  onEdit
}: {
  message: ChatMessage;
  onCopy: () => void;
  onRegenerate?: () => void;
  onEdit?: () => void;
}) {
  if (message.role === "assistant" && message.content.trim().length === 0) {
    return null;
  }

  return (
    <motion.div
      className={cn(
        "flex w-full",
        message.role === "user" ? "justify-end" : "justify-start"
      )}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div className="group max-w-[92%] md:max-w-[78%]">
        <div
          className={cn(
            "rounded-2xl px-4 py-3",
            message.role === "user"
              ? "bg-message-user"
              : "bg-message-assistant"
          )}
        >
          <MarkdownRenderer content={message.content} />
        </div>
        <div className="mt-1 flex gap-3 text-[11px] text-muted-foreground opacity-0 transition group-hover:opacity-100">
          <button onClick={onCopy} className="flex items-center gap-1">
            <ClipboardCopy className="h-3 w-3" /> Copy
          </button>
          {onRegenerate && (
            <button onClick={onRegenerate} className="flex items-center gap-1">
              <RotateCcw className="h-3 w-3" /> Regenerate
            </button>
          )}
          {onEdit && (
            <button onClick={onEdit} className="flex items-center gap-1">
              <Pencil className="h-3 w-3" /> Edit
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

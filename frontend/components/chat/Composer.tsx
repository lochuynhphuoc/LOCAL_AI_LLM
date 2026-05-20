"use client";

import { useRef } from "react";
import { ArrowUp, Paperclip, StopCircle } from "lucide-react";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import { useAutosizeTextarea } from "../../hooks/use-autosize-textarea";

export function Composer({
  value,
  onChange,
  onSend,
  onStop,
  isStreaming,
  onUploadClick
}: {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onStop: () => void;
  isStreaming: boolean;
  onUploadClick: () => void;
}) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  useAutosizeTextarea(textareaRef.current, value);

  return (
    <div className="composer-shell">
      <Button
        variant="ghost"
        size="sm"
        onClick={onUploadClick}
        className="icon-ghost h-9 w-9 rounded-full"
      >
        <Paperclip className="h-4 w-4" />
      </Button>
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Ask about crops, seeds, plant diseases, farming..."
        rows={1}
        className="min-h-[40px] flex-1 resize-none border-none bg-transparent px-2 py-2 text-sm placeholder:text-muted-foreground/70 focus:ring-0"
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            onSend();
          }
        }}
      />
      {isStreaming ? (
        <Button
          variant="secondary"
          onClick={onStop}
          size="sm"
          className="stop-fab h-9 w-9 rounded-full p-0"
        >
          <StopCircle className="h-4 w-4" />
        </Button>
      ) : (
        <Button
          onClick={onSend}
          size="sm"
          className="send-fab h-9 w-9 rounded-full p-0"
        >
          <ArrowUp className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

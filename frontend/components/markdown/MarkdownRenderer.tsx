"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Copy } from "lucide-react";

export function MarkdownRenderer({ content }: { content: string }) {
  return (
    <div className="markdown">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ className, children }) {
            const match = /language-(\w+)/.exec(className || "");
            const codeText = String(children).replace(/\n$/, "");

            if (!match) {
              return <code>{codeText}</code>;
            }

            return (
              <div className="group relative">
                <button
                  className="absolute right-3 top-3 rounded-md border border-border bg-input px-2 py-1 text-[11px] text-muted-foreground opacity-0 transition group-hover:opacity-100"
                  onClick={() => navigator.clipboard.writeText(codeText)}
                >
                  <Copy className="h-3 w-3" />
                </button>
                <SyntaxHighlighter
                  style={oneDark}
                  language={match[1]}
                  PreTag="div"
                  customStyle={{ margin: 0, background: "transparent", fontSize: "13px" }}
                  className="rounded-xl border border-border bg-[hsl(var(--code-bg))] p-4"
                >
                  {codeText}
                </SyntaxHighlighter>
              </div>
            );
          }
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

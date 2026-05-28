"use client";

import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Copy } from "lucide-react";

const linkifyCitations = (content: string) =>
  content.replace(
    /\[Source:\s*(.*?)\s*\|\s*Chunk:\s*(\d+)\]/g,
    (_match, filename: string, chunk: string) => {
      const params = new URLSearchParams({ filename, chunk });
      return `[Source: ${filename} | Chunk: ${chunk}](/knowledge/source?${params.toString()})`;
    }
  );

export function MarkdownRenderer({ content }: { content: string }) {
  const renderedContent = linkifyCitations(content);

  return (
    <div className="markdown">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a({ href, children }) {
            if (!href) {
              return <a>{children}</a>;
            }

            const isInternal = href.startsWith("/");
            const className =
              "citation-link inline-flex items-center rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2 py-0.5 text-[11px] font-medium text-emerald-100 transition hover:border-emerald-300/70 hover:bg-emerald-300/20 hover:text-white";

            if (isInternal) {
              return (
                <Link href={href} className={className}>
                  {children}
                </Link>
              );
            }

            return (
              <a href={href} className={className} target="_blank" rel="noreferrer">
                {children}
              </a>
            );
          },
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
        {renderedContent}
      </ReactMarkdown>
    </div>
  );
}

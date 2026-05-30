"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AppShell } from "../../../components/layout/AppShell";
import { cn } from "../../../lib/utils";

type SourceDocumentResponse = {
  filename: string;
  text: string;
  chunks: string[];
  chunk_index: number;
  chunk_text: string;
  page_texts?: string[] | null;
  page_index?: number | null;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "/api";

const PdfSourceViewer = dynamic(
  () => import("../../../components/knowledge/PdfSourceViewer").then((mod) => mod.PdfSourceViewer),
  {
    ssr: false,
    loading: () => (
      <div className="rounded-2xl border border-border bg-card/60 p-4 text-sm text-muted-foreground">
        Loading PDF preview...
      </div>
    )
  }
);

export default function SourceDocumentPage() {
  const searchParams = useSearchParams();
  const filename = searchParams.get("filename") || "";
  const chunkParam = Number(searchParams.get("chunk") || "0");
  const [data, setData] = useState<SourceDocumentResponse | null>(null);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const isPdf = filename.toLowerCase().endsWith(".pdf");

  const fileUrl = useMemo(() => {
    if (!filename) return "";
    const params = new URLSearchParams({ filename });
    return `${API_URL}/documents/file?${params.toString()}`;
  }, [filename]);

  useEffect(() => {
    if (!filename) {
      setError("Missing filename in citation link.");
      return;
    }

    const controller = new AbortController();
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const params = new URLSearchParams({
          filename,
          chunk: Number.isFinite(chunkParam) ? String(chunkParam) : "0"
        });
        const response = await fetch(`${API_URL}/documents/source?${params.toString()}`, {
          signal: controller.signal
        });
        if (!response.ok) {
          throw new Error(`load_failed_${response.status}`);
        }
        const payload = (await response.json()) as SourceDocumentResponse;
        setData(payload);
      } catch {
        setError("Could not load the source document.");
      } finally {
        setLoading(false);
      }
    };

    load();
    return () => controller.abort();
  }, [chunkParam, filename]);

  return (
    <AppShell title="Source Viewer">
      <div className="mx-auto w-full max-w-5xl px-4 py-8">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-lg font-semibold text-foreground">Source viewer</h1>
            <p className="text-sm text-muted-foreground">
              The highlighted content matches the text used by RAG in chat.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {fileUrl && (
              <a
                href={fileUrl}
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-border bg-input px-4 py-2 text-sm text-foreground transition hover:border-primary/50 hover:bg-hover"
              >
                Open original file
              </a>
            )}
            <Link
              href="/chat"
              className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm text-emerald-100 transition hover:border-emerald-300/70 hover:bg-emerald-300/20 hover:text-white"
            >
              Close review
            </Link>
          </div>
        </div>

        {loading && (
          <div className="rounded-2xl border border-border bg-card/60 p-6 text-sm text-muted-foreground">
            Loading source content...
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-sm text-red-200">
            {error}
          </div>
        )}

        {data && (
          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <section className="space-y-5">
              <div className="rounded-3xl border border-border bg-card/70 p-5 shadow-lg shadow-black/20">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
                      Source file
                    </div>
                    <h2 className="mt-1 text-xl font-semibold text-foreground">
                      {data.filename}
                    </h2>
                  </div>
                  <div className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-100">
                    Chunk {data.chunk_index}
                  </div>
                </div>

                {isPdf && data.page_texts ? (
                  <PdfSourceViewer
                    fileUrl={fileUrl}
                    chunkText={data.chunk_text}
                    pageIndex={data.page_index ?? null}
                  />
                ) : (
                  <div className="space-y-4">
                    {data.chunks.map((chunk, index) => (
                      <article
                        key={`${data.filename}-${index}`}
                        className={cn(
                          "rounded-2xl border p-4 text-sm leading-6 transition",
                          index === data.chunk_index
                            ? "border-emerald-400/50 bg-emerald-400/10 shadow-[0_0_0_1px_rgba(110,255,150,0.18)]"
                            : "border-border bg-input/40"
                        )}
                      >
                        <div className="mb-2 flex items-center justify-between gap-3 text-xs text-muted-foreground">
                          <span>Chunk {index}</span>
                          {index === data.chunk_index && (
                            <span className="rounded-full bg-emerald-400/15 px-2 py-0.5 text-emerald-100">
                              Matched by RAG
                            </span>
                          )}
                        </div>
                        <pre className="whitespace-pre-wrap break-words font-sans text-foreground">
                          {chunk}
                        </pre>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            </section>

            <aside className="space-y-4">
              <div className="rounded-3xl border border-border bg-card/70 p-5 shadow-lg shadow-black/20">
                <h3 className="text-sm font-semibold text-foreground">
                  RAG match preview
                </h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  This is the exact chunk highlighted by RAG. If the PDF page highlight matches this text, retrieval is working.
                </p>
                <div className="mt-4 rounded-2xl border border-emerald-400/40 bg-emerald-400/10 p-4 text-sm leading-6 text-foreground">
                  {data.chunk_text}
                </div>
              </div>

              <div className="rounded-3xl border border-border bg-card/70 p-5 shadow-lg shadow-black/20">
                <h3 className="text-sm font-semibold text-foreground">
                  Debug note
                </h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Use this page to verify that the citation, the source document, and the highlighted page all point to the same content.
                </p>
              </div>
            </aside>
          </div>
        )}
      </div>
    </AppShell>
  );
}

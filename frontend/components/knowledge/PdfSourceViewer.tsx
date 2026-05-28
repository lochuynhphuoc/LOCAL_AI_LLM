"use client";

import { useEffect, useMemo, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { cn } from "../../lib/utils";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

type PdfSourceViewerProps = {
  fileUrl: string;
  chunkText: string;
  pageIndex: number | null;
};

const normalizeText = (value: string) => value.replace(/\s+/g, " ").trim().toLowerCase();

const escapeHtml = (value: string) =>
  value
    .split("&").join("&amp;")
    .split("<").join("&lt;")
    .split(">").join("&gt;")
    .split('"').join("&quot;")
    .split("'").join("&#39;");

const getHighlightTerms = (chunkText: string) => {
  const uniqueTerms = new Set<string>();
  for (const rawTerm of chunkText.split(/\s+/)) {
    const term = rawTerm.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, "");
    if (term.length >= 4 || /\d/.test(term)) {
      uniqueTerms.add(term.toLowerCase());
    }
  }
  return Array.from(uniqueTerms).slice(0, 24);
};

export function PdfSourceViewer({ fileUrl, chunkText, pageIndex }: PdfSourceViewerProps) {
  const [numPages, setNumPages] = useState(0);
  const [pdfData, setPdfData] = useState<Uint8Array | null>(null);
  const [pdfError, setPdfError] = useState<string>("");
  const terms = useMemo(() => getHighlightTerms(chunkText), [chunkText]);

  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      setPdfError("");
      setPdfData(null);
      try {
        const response = await fetch(fileUrl, { signal: controller.signal });
        if (!response.ok) {
          throw new Error(`pdf_fetch_${response.status}`);
        }
        const bytes = await response.arrayBuffer();
        setPdfData(new Uint8Array(bytes));
      } catch (error) {
        if (!controller.signal.aborted) {
          setPdfError(error instanceof Error ? error.message : "pdf_fetch_failed");
        }
      }
    };

    load();
    return () => controller.abort();
  }, [fileUrl]);

  return (
    <div className="space-y-5">
      <div className="rounded-3xl border border-border bg-card/70 p-4 shadow-lg shadow-black/20">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-foreground">PDF preview</h3>
            <p className="text-xs text-muted-foreground">
              The matching page is highlighted in yellow on the text layer.
            </p>
          </div>
          {pageIndex !== null && (
            <div className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-100">
              Page {pageIndex + 1}
            </div>
          )}
        </div>

        <Document
          file={pdfData || undefined}
          onLoadSuccess={({ numPages: totalPages }) => setNumPages(totalPages)}
          loading={<div className="text-sm text-muted-foreground">Loading PDF...</div>}
          error={<div className="text-sm text-red-200">Could not render the PDF.</div>}
          className="space-y-6"
        >
          {Array.from({ length: numPages }, (_, index) => {
            const isMatchPage = pageIndex === index;
            return (
              <div
                key={`pdf-page-${index}`}
                className={cn(
                  "overflow-hidden rounded-2xl border bg-background/40",
                  isMatchPage ? "border-emerald-400/60 shadow-[0_0_0_1px_rgba(110,255,150,0.2)]" : "border-border"
                )}
              >
                <div className="flex items-center justify-between border-b border-border bg-input/60 px-4 py-2 text-xs text-muted-foreground">
                  <span>Page {index + 1}</span>
                  {isMatchPage && <span className="text-emerald-100">Matched by RAG</span>}
                </div>
                <div className="bg-white/5 p-3">
                  <Page
                    pageNumber={index + 1}
                    width={860}
                    renderAnnotationLayer={false}
                    renderTextLayer
                    customTextRenderer={({ str }) => {
                      if (!isMatchPage || !terms.length) {
                        return str;
                      }

                      const normalized = normalizeText(str);
                      const shouldHighlight = terms.some((term) => normalized.includes(term));
                      if (!shouldHighlight) {
                        return str;
                      }

                      return `<mark style="background: rgba(250, 204, 21, 0.72); color: #0b0f09; padding: 0 2px; border-radius: 3px; box-shadow: 0 0 0 1px rgba(250,204,21,0.24);">${escapeHtml(
                        str
                      )}</mark>`;
                    }}
                  />
                </div>
              </div>
            );
          })}
        </Document>

        {pdfError && (
          <div className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-xs text-red-200">
            PDF load error: {pdfError}
          </div>
        )}
      </div>
    </div>
  );
}

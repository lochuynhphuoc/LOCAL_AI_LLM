"use client";

import { useState } from "react";
import { AppShell } from "../../components/layout/AppShell";
import { UploadZone } from "../../components/knowledge/UploadZone";
import type { UploadResult } from "../../lib/types";

export default function KnowledgePage() {
  const [uploads, setUploads] = useState<UploadResult[]>([]);

  return (
    <AppShell title="Plant Knowledge">
      <div className="mx-auto w-full max-w-3xl px-4 py-8">
        <div className="mb-6 space-y-1">
          <h1 className="text-lg font-semibold text-foreground">
            Plant knowledge base
          </h1>
          <p className="text-sm text-muted-foreground">
            Upload files to help GigaChat answer with agricultural context.
          </p>
        </div>

        <div className="space-y-6">
          <UploadZone
            onUploaded={(files) => setUploads((prev) => [...files, ...prev])}
          />
          <div className="text-xs text-muted-foreground">
            Supported: PDF, DOCX, TXT, MD, CSV, XLSX, JSON, XML, PPTX, code files, images.
          </div>

          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-foreground">
              Upload history
            </h2>
            {uploads.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No files yet. Upload documents to enable RAG.
              </p>
            ) : (
              <div className="space-y-2">
                {uploads.map((file) => (
                  <div
                    key={file.filename}
                    className="flex items-center justify-between rounded-lg border border-border bg-input px-4 py-2"
                  >
                    <span className="text-sm text-foreground">
                      {file.filename}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {file.chunks} chunks
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

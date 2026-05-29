"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Trash2, AlertTriangle } from "lucide-react";
import { useChatStore } from "../../lib/store";
import { AppShell } from "../../components/layout/AppShell";
import { UploadZone } from "../../components/knowledge/UploadZone";
import type { UploadResult } from "../../lib/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "/api";

export default function KnowledgePage() {
  const uploads = useChatStore((state) => state.uploadHistory);
  const replaceUploadHistory = useChatStore((state) => state.replaceUploadHistory);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [pendingDelete, setPendingDelete] = useState<UploadResult | null>(null);

  const uploadCountLabel = useMemo(() => {
    if (loading) return "Đang đồng bộ danh sách...";
    return `${uploads.length} file`;
  }, [loading, uploads.length]);

  const refreshUploads = async () => {
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`${API_URL}/documents/uploads`);
      if (!response.ok) {
        throw new Error(`load_failed_${response.status}`);
      }
      const payload = (await response.json()) as { files?: UploadResult[] };
      replaceUploadHistory(payload.files ?? []);
    } catch {
      setError("Không thể tải danh sách file upload từ server.");
    } finally {
      setBusy(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUploads();
  }, []);

  const handleDelete = async (file: UploadResult) => {
    setBusy(true);
    setError("");
    try {
      const params = new URLSearchParams({ filename: file.filename });
      const response = await fetch(`${API_URL}/documents/file?${params.toString()}`, {
        method: "DELETE"
      });
      if (!response.ok) {
        throw new Error(`delete_failed_${response.status}`);
      }
      setPendingDelete(null);
      await refreshUploads();
    } catch {
      setError(`Không thể xóa file "${file.filename}". Hãy thử lại.`);
      setBusy(false);
    }
  };

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
            onUploaded={() => refreshUploads()}
          />
          <div className="text-xs text-muted-foreground">
            Supported: PDF, DOCX, TXT, MD, CSV, XLSX, JSON, XML, PPTX, code files, images.
          </div>

          {error && (
            <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
              {error}
            </div>
          )}

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold text-foreground">
                Upload history
              </h2>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{uploadCountLabel}</span>
                <button
                  type="button"
                  onClick={refreshUploads}
                  disabled={busy}
                  className="rounded-full border border-border bg-input px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-hover disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Refresh
                </button>
              </div>
            </div>
            {loading ? (
              <div className="rounded-2xl border border-border bg-card/60 p-4 text-sm text-muted-foreground">
                Đang tải danh sách upload...
              </div>
            ) : uploads.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No files yet. Upload documents to enable RAG.
              </p>
            ) : (
              <div className="space-y-2">
                {uploads.map((file) => (
                  <div
                    key={file.filename}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-input px-4 py-3"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm text-foreground">
                        {file.filename}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {file.chunks} chunks
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => setPendingDelete(file)}
                      className="inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-200 transition hover:border-red-400/60 hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Xóa
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {pendingDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-6 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-2xl shadow-black/40">
            <div className="mb-4 flex items-start gap-3">
              <div className="rounded-full bg-red-500/10 p-2 text-red-300">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-semibold text-foreground">
                  Xác nhận xóa file
                </h3>
                <p className="text-sm text-muted-foreground">
                  File <span className="font-medium text-foreground">{pendingDelete.filename}</span> sẽ bị xóa khỏi thư mục upload và biến mất khỏi Upload history.
                </p>
              </div>
            </div>

            <div className="mb-5 rounded-2xl border border-border bg-input px-4 py-3 text-sm text-muted-foreground">
              Hành động này không thể hoàn tác.
            </div>

            <div className="flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={() => setPendingDelete(null)}
                className="rounded-full border border-border bg-input px-4 py-2 text-sm text-foreground transition hover:bg-hover"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => handleDelete(pendingDelete)}
                className="inline-flex items-center gap-2 rounded-full bg-red-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Xóa file
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}

"use client";

import { useRef, useState } from "react";
import { Upload, Loader2 } from "lucide-react";
import type { UploadResult } from "../../lib/types";

export function UploadZone({
  onUploaded
}: {
  onUploaded: (files: UploadResult[]) => void;
}) {
  const [status, setStatus] = useState("");
  const [error, setError] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setStatus("Đang tải lên và lập chỉ mục...");
    setError(false);
    setUploading(true);

    try {
      const formData = new FormData();
      Array.from(files).forEach((file) => formData.append("files", file));

      const response = await fetch("/api/documents/upload", {
        method: "POST",
        body: formData
      });

      if (!response.ok) {
        if (response.status === 413) {
          setStatus("File quá lớn. Giới hạn tối đa 100MB.");
        } else if (response.status === 504) {
          setStatus("Xử lý quá lâu — hãy thử file nhỏ hơn hoặc ít file hơn.");
        } else if (response.status === 503 || response.status === 429) {
          setStatus("Server đang bận. Hãy đợi một lát rồi thử lại.");
        } else {
          setStatus(`Tải lên thất bại (Lỗi ${response.status}). Hãy thử lại.`);
        }
        setError(true);
        return;
      }

      const data = await response.json();
      onUploaded(data.files);
      setStatus("Hoàn tất. Bạn có thể bật RAG để hỏi tài liệu.");
      setError(false);
    } catch (err) {
      setStatus("Lỗi kết nối mạng. Kiểm tra server đang chạy và thử lại.");
      setError(true);
    } finally {
      setUploading(false);
      // Reset input so re-uploading the same file triggers onChange
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div
      className={`rounded-2xl border border-dashed border-border bg-input p-6 ${
        dragging ? "ring-2 ring-primary/40" : ""
      }`}
      onDragOver={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
        if (!uploading) handleFiles(event.dataTransfer.files);
      }}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,.docx,.txt,.rtf,.md,.xlsx,.xls,.csv,.tsv,.json,.xml,.pptx,.py,.js,.ts,.java,.c,.cpp,.html,.css,.png,.jpg,.jpeg,.gif,.webp,.bmp"
        onChange={(event) => handleFiles(event.target.files)}
        hidden
      />
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="rounded-full bg-hover p-3">
          {uploading ? (
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          ) : (
            <Upload className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          Kéo thả tài liệu hoặc nhấn để chọn file.
        </p>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
        >
          {uploading ? "Đang xử lý..." : "Chọn tài liệu"}
        </button>
        {status && (
          <p className={`text-xs ${error ? "text-red-400" : "text-muted-foreground"}`}>
            {status}
          </p>
        )}
      </div>
    </div>
  );
}

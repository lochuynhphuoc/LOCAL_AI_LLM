"use client";

import { useRef, useState } from "react";
import { Upload } from "lucide-react";
import type { UploadResult } from "../../lib/types";

export function UploadZone({
  onUploaded
}: {
  onUploaded: (files: UploadResult[]) => void;
}) {
  const [status, setStatus] = useState("");
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setStatus("Đang tải lên và lập chỉ mục...");

    const formData = new FormData();
    Array.from(files).forEach((file) => formData.append("files", file));

    const response = await fetch("/api/documents/upload", {
      method: "POST",
      body: formData
    });

    if (!response.ok) {
      setStatus("Tải lên thất bại. Hãy thử lại.");
      return;
    }

    const data = await response.json();
    onUploaded(data.files);
    setStatus("Hoàn tất. Bạn có thể bật RAG để hỏi tài liệu.");
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
        handleFiles(event.dataTransfer.files);
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
          <Upload className="h-5 w-5 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">
          Kéo thả tài liệu hoặc nhấn để chọn file.
        </p>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
        >
          Chọn tài liệu
        </button>
        {status && <p className="text-xs text-muted-foreground">{status}</p>}
      </div>
    </div>
  );
}

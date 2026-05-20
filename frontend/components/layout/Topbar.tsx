"use client";

import Link from "next/link";
import { Upload } from "lucide-react";
import { Switch } from "../ui/switch";
import { useChatStore } from "../../lib/store";

export function Topbar() {
  const { useRag, setUseRag } = useChatStore();

  return (
    <div className="flex items-center gap-3 text-xs text-muted-foreground">
      <div className="flex items-center gap-2">
        <Switch checked={useRag} onCheckedChange={setUseRag} />
        <span>RAG</span>
      </div>
      <Link
        href="/knowledge"
        className="glass-pill inline-flex items-center gap-2 px-2 py-1 text-muted-foreground transition"
      >
        <Upload className="h-3.5 w-3.5" />
        Upload
      </Link>
    </div>
  );
}

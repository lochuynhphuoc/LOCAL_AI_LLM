"use client";

import { RefreshCcw } from "lucide-react";
import { Button } from "../ui/button";

const PROMPT_POOL = [
  "Giải thích nhanh về RAG cho người mới học.",
  "So sánh Qwen3-8B và Llama 3.1 8B.",
  "Viết kế hoạch học LLM trong 30 ngày.",
  "Gợi ý 5 ý tưởng AI cho doanh nghiệp nhỏ.",
  "Tạo checklist triển khai chatbot nội bộ.",
  "Viết email xin báo giá lịch sự.",
  "Tóm tắt tài liệu thành 5 ý chính.",
  "Tạo prompt cho trợ lý CSKH chuẩn hóa trả lời.",
  "Viết đoạn mô tả sản phẩm theo giọng premium.",
  "Lập kế hoạch marketing cho sản phẩm mới."
];

export function PromptTemplates({
  prompts,
  onRefresh,
  onPick
}: {
  prompts: string[];
  onRefresh: () => void;
  onPick: (value: string) => void;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card/70 p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Quick prompts</h3>
        <Button variant="ghost" size="sm" onClick={onRefresh}>
          <RefreshCcw className="h-3 w-3" />
        </Button>
      </div>
      <div className="mt-3 space-y-2">
        {prompts.map((prompt) => (
          <button
            key={prompt}
            onClick={() => onPick(prompt)}
            className="w-full rounded-xl border border-border bg-muted/40 px-3 py-2 text-left text-sm text-foreground hover:bg-muted"
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  );
}

export function getRandomPrompts(count: number) {
  return [...PROMPT_POOL].sort(() => 0.5 - Math.random()).slice(0, count);
}

import { Badge } from "../ui/badge";

export function ChatStats({
  usedTokens,
  contextLength
}: {
  usedTokens: number;
  contextLength: number;
}) {
  const percentage = Math.min(100, Math.round((usedTokens / contextLength) * 100));

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
      <Badge>{usedTokens} tokens</Badge>
      <Badge>Context {contextLength}</Badge>
      <Badge>{percentage}% used</Badge>
    </div>
  );
}

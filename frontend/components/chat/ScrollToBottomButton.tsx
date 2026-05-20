import { ArrowDown } from "lucide-react";

export function ScrollToBottomButton({
  onClick,
  animate
}: {
  onClick: () => void;
  animate?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`scroll-fab absolute bottom-28 left-1/2 z-10${
        animate ? " scroll-fab--nudge" : ""
      }`}
    >
      <ArrowDown className="h-4 w-4" />
    </button>
  );
}

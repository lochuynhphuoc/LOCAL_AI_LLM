import { useEffect } from "react";

export function useAutosizeTextarea(
  textarea: HTMLTextAreaElement | null,
  value: string
) {
  useEffect(() => {
    if (!textarea) return;
    textarea.style.height = "0px";
    textarea.style.height = `${textarea.scrollHeight}px`;
  }, [textarea, value]);
}

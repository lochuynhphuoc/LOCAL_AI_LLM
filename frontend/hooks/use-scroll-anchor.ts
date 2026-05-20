import { useEffect, useRef, useState } from "react";

export function useScrollAnchor(active = true) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);
  const [showScroll, setShowScroll] = useState(false);

  const scrollToBottom = () => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (!active) {
      setShowScroll(false);
      return;
    }

    const container = containerRef.current;
    if (!container) return;

    const onScroll = () => {
      const distance =
        container.scrollHeight - container.scrollTop - container.clientHeight;
      setShowScroll(distance > 120);
    };

    onScroll();
    container.addEventListener("scroll", onScroll, { passive: true });

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(onScroll);
      resizeObserver.observe(container);
    }

    const onResize = () => onScroll();
    window.addEventListener("resize", onResize);

    return () => {
      container.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      resizeObserver?.disconnect();
    };
  }, [active]);

  return { containerRef, endRef, showScroll, scrollToBottom };
}

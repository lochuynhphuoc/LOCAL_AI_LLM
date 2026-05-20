"use client";

import { useEffect, useState } from "react";

/**
 * Prevents Zustand hydration mismatch between server and client.
 * 
 * Next.js renders on the server first (where localStorage doesn't exist),
 * then the client tries to rehydrate Zustand from localStorage.
 * If the states differ, React throws a hydration error.
 * 
 * This provider delays rendering children until after the first client-side
 * mount, ensuring Zustand has fully rehydrated from localStorage.
 */
export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  if (!isHydrated) {
    // Return a minimal loading shell that matches the app's dark theme
    // to prevent flash of unstyled content
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading GigaChat...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

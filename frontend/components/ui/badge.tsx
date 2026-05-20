import * as React from "react";
import { cn } from "../../lib/utils";

export const Badge = React.forwardRef<HTMLSpanElement, React.HTMLAttributes<HTMLSpanElement>>(
  ({ className, ...props }, ref) => (
    <span
      ref={ref}
      className={cn(
        "inline-flex items-center rounded-full border border-border bg-muted px-2 py-1 text-xs",
        className
      )}
      {...props}
    />
  )
);

Badge.displayName = "Badge";

import * as React from "react";
import { cn } from "../../lib/utils";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "flex w-full rounded-lg border border-border bg-input px-4 py-3 text-sm",
      "placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-border",
      className
    )}
    {...props}
  />
));

Textarea.displayName = "Textarea";

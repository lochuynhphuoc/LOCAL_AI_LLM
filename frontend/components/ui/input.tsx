import * as React from "react";
import { cn } from "../../lib/utils";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      "flex h-10 w-full rounded-lg border border-border bg-input px-3 py-2 text-sm",
      "placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-border",
      className
    )}
    {...props}
  />
));

Input.displayName = "Input";

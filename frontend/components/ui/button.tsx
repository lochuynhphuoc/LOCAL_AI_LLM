import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "../../lib/utils";

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  asChild?: boolean;
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
};

const variants = {
  primary:
    "bg-gradient-to-br from-[#1F8B4C] via-[#2E7D57] to-[#295E3B] text-primary-foreground shadow-[0_10px_20px_rgba(12,60,34,0.35)] hover:scale-[1.02] hover:shadow-[0_12px_28px_rgba(24,120,70,0.35)]",
  secondary:
    "bg-input text-foreground border border-border hover:border-[#2E7D57] hover:text-foreground",
  ghost:
    "bg-transparent text-muted-foreground hover:bg-hover/20 hover:text-foreground"
};

const sizes = {
  sm: "h-8 px-3 text-xs",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-5 text-base"
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", asChild, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(
          "inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200",
          variants[variant],
          sizes[size],
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";

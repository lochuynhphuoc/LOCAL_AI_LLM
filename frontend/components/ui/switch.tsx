import * as React from "react";
import * as SwitchPrimitive from "@radix-ui/react-switch";
import { cn } from "../../lib/utils";

export const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitive.Root
    ref={ref}
    className={cn(
      "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full",
      "border border-border bg-[#0B1F13] transition-all duration-200",
      "data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-[#1F8B4C] data-[state=checked]:to-[#2E7D57]",
      "data-[state=checked]:shadow-[0_0_12px_rgba(46,125,87,0.5)]",
      className
    )}
    {...props}
  >
    <SwitchPrimitive.Thumb
      className={cn(
        "pointer-events-none block h-5 w-5 translate-x-0.5 rounded-full bg-white",
        "shadow transition data-[state=checked]:translate-x-5"
      )}
    />
  </SwitchPrimitive.Root>
));

Switch.displayName = "Switch";

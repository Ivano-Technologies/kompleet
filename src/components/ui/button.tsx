import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost" | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        className={cn(
          "inline-flex items-center justify-center rounded-md font-medium transition-all select-none",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
          "disabled:pointer-events-none disabled:opacity-50",
          // Skeuomorphic base (convex + pressable)
          "shadow-outer-soft gradient-convex border border-black/5",
          "active:shadow-pressed active:gradient-concave active:translate-y-px",
          {
            "bg-primary text-white hover:brightness-[0.98]":
              variant === "default",
            "bg-surface text-text-1 hover:bg-surface-2 dark:bg-dark-surface dark:text-dark-text-1 dark:hover:bg-dark-surface-2":
              variant === "outline",
            "shadow-none border-transparent bg-transparent text-text-1 hover:bg-surface-2 dark:text-dark-text-1 dark:hover:bg-dark-surface-2":
              variant === "ghost",
            "bg-error text-white hover:brightness-[0.98]":
              variant === "destructive",
          },
          {
            "h-10 px-4 py-2": size === "default",
            "h-9 rounded-md px-3": size === "sm",
            "h-11 rounded-md px-8": size === "lg",
            "h-10 w-10": size === "icon",
          },
          "dark:border-white/10",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button };

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-xl2 font-body font-medium tracking-wide transition-transform active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none disabled:cursor-wait",
  {
    variants: {
      variant: {
        primary:
          "bg-gradient-to-br from-terracotta-bright to-terracotta text-white shadow-glow hover:-translate-y-0.5",
        secondary:
          "bg-sky/90 text-white shadow-[0_14px_28px_-12px_rgba(0,96,168,.55)] hover:-translate-y-0.5",
        ghost:
          "bg-cream/10 text-cream border border-cream/25 backdrop-blur hover:bg-cream/15",
      },
      size: {
        default: "px-5 py-3 text-sm",
        sm: "px-4 py-2 text-xs",
      },
    },
    defaultVariants: { variant: "primary", size: "default" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return <button className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}

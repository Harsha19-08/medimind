import * as React from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-xl2 border border-cream/20 bg-cream/[0.08] p-5 shadow-glass backdrop-blur-xl",
        className
      )}
      {...props}
    />
  );
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={cn("font-display text-xl text-cream mb-3", className)} {...props} />;
}

export function CardLabel({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("text-[0.7rem] uppercase tracking-[0.1em] text-mist/80 font-medium mb-1.5", className)}
      {...props}
    />
  );
}

export function CardMetric({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("font-display text-2xl text-cream", className)} {...props} />;
}

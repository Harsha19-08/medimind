import { cn } from "@/lib/utils";

export function StatusPill({ status }: { status: "active" | "paused" }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-cream/25 bg-cream/10 px-4 py-2 text-sm font-medium text-cream backdrop-blur">
      <span
        className={cn(
          "w-2 h-2 rounded-full",
          status === "active" ? "bg-terracotta-bright shadow-[0_0_0_5px_rgba(240,72,0,.22)]" : "bg-ok"
        )}
      />
      {status === "active" ? "Reminders active" : "Paused — within supply"}
    </span>
  );
}

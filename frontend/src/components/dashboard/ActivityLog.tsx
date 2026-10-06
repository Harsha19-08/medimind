import type { ReminderLog } from "@/lib/types";
import { Badge } from "@/components/ui/badge";

export function ActivityLog({ logs, limit }: { logs: ReminderLog[]; limit?: number }) {
  const rows = limit ? logs.slice(0, limit) : logs;
  if (!rows.length) return <p className="text-sm text-mist/70">No reminders sent yet.</p>;

  return (
    <div className="divide-y divide-cream/15">
      {rows.map((l) => (
        <div key={l.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
          <div>
            <span className="text-cream font-medium">{l.recipient_name}</span>{" "}
            <span className="text-mist/70">
              · {l.slot} · {l.log_date}
            </span>
            {l.status === "error" && <div className="text-xs text-warn mt-0.5">{l.error}</div>}
          </div>
          <Badge variant={l.status === "sent" ? "ok" : "warn"}>
            {l.status === "sent" ? "✓ sent" : "✗ error"}
          </Badge>
        </div>
      ))}
    </div>
  );
}

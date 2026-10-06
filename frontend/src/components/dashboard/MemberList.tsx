import type { Member } from "@/lib/types";
import { Badge } from "@/components/ui/badge";

export function MemberList({ members, compact = false }: { members: Member[]; compact?: boolean }) {
  if (!members.length)
    return <p className="text-sm text-mist/70">No recipients loaded — add them to reminders.csv.</p>;

  return (
    <div className={compact ? "grid grid-cols-2 md:grid-cols-4 gap-3" : "divide-y divide-cream/15"}>
      {members.map((m) =>
        compact ? (
          <div key={m.id} className="rounded-xl2 border border-cream/15 bg-cream/5 p-3.5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sky to-terracotta-bright mb-2" />
            <div className="text-sm font-medium text-cream">{m.name}</div>
            <div className="text-xs text-mist/70">{m.phone}</div>
            <Badge variant="ok" className="mt-2">Active</Badge>
            <div className="text-xs text-mist/60 mt-1.5">Next: {m.morning_time}</div>
          </div>
        ) : (
          <div key={m.id} className="flex items-center justify-between py-2.5 text-sm">
            <span className="text-cream">
              {m.name} <span className="text-mist/70">{m.phone}</span>
            </span>
            <span className="text-mist/70 text-xs">{m.morning_time} / {m.evening_time}</span>
          </div>
        )
      )}
    </div>
  );
}

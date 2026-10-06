import { Sun } from "lucide-react";
import { Card, CardLabel } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { FamilyStatus } from "@/lib/types";

function fmtTime(iso: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleString("en-IN", { weekday: "long", hour: "numeric", minute: "2-digit" });
}

export function NextReminderCard({ status }: { status: FamilyStatus }) {
  const soonest = status.medicines.slice().sort((a, b) => a.days_remaining - b.days_remaining)[0];

  return (
    <Card>
      <div className="flex items-center justify-between mb-1">
        <CardLabel className="mb-0">Next Reminder</CardLabel>
        <Badge variant={status.status === "active" ? "ok" : "neutral"}>
          {status.status === "active" ? "Active" : "Paused"}
        </Badge>
      </div>
      <div className="flex items-center gap-3 mt-2">
        <Sun className="text-gold" size={26} />
        <div>
          <div className="font-display text-2xl text-cream">
            {status.next_reminder_at ? new Date(status.next_reminder_at).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" }) : "Not due yet"}
          </div>
          <div className="text-xs text-mist/70">{fmtTime(status.next_reminder_at) || "—"}</div>
        </div>
      </div>
      {soonest && (
        <div className="flex items-center gap-2.5 mt-4 pt-4 border-t border-cream/15">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-sky to-night" />
          <div className="text-sm text-cream">
            {status.last_sms?.recipient_name ?? status.members[0]?.name ?? "Family"}
            <div className="text-xs text-mist/70">{soonest.name}</div>
          </div>
        </div>
      )}
    </Card>
  );
}

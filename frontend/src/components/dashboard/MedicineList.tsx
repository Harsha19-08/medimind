import type { Medicine } from "@/lib/types";
import { Badge } from "@/components/ui/badge";

export function MedicineList({ medicines }: { medicines: Medicine[] }) {
  if (!medicines.length) return <p className="text-sm text-mist/70">Nothing uploaded yet.</p>;
  return (
    <div className="divide-y divide-cream/15">
      {medicines.map((m) => (
        <div key={m.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
          <span className="text-cream font-medium">
            {m.name}{" "}
            <span className="text-mist/70 font-normal">
              ({m.quantity} units · {m.dosage_per_day}/day)
            </span>
          </span>
          <Badge variant={m.overdue ? "warn" : "ok"}>
            {m.overdue ? `overdue ${Math.abs(m.days_remaining)}d` : `${m.days_remaining}d left`}
          </Badge>
        </div>
      ))}
    </div>
  );
}

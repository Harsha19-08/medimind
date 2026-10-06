"use client";

import { TopNav } from "@/components/nav/TopNav";
import { Card, CardTitle } from "@/components/ui/card";
import { ActivityLog } from "@/components/dashboard/ActivityLog";
import { useFamily } from "@/hooks/useFamily";
import { useFamilyStatus } from "@/hooks/useFamilyStatus";

export default function HistoryPage() {
  const { family } = useFamily();
  const { status } = useFamilyStatus(family?.id ?? null);

  return (
    <>
      <TopNav />
      <h1 className="font-display text-3xl text-cream mb-5">Reminder History</h1>

      <Card>
        <CardTitle>Recent SMS log</CardTitle>
        {status ? <ActivityLog logs={status.recent_logs} /> : <p className="text-sm text-mist">Loading…</p>}
      </Card>
    </>
  );
}

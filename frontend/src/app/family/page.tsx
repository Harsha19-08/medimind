"use client";

import { TopNav } from "@/components/nav/TopNav";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MemberList } from "@/components/dashboard/MemberList";
import { useFamily } from "@/hooks/useFamily";
import { useFamilyStatus } from "@/hooks/useFamilyStatus";
import { reloadRecipients } from "@/lib/api";
import { useState } from "react";

export default function FamilyPage() {
  const { family } = useFamily();
  const { status } = useFamilyStatus(family?.id ?? null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function handleReload() {
    setBusy(true);
    try {
      const data = await reloadRecipients();
      setMsg(`Reloaded ${data.recipients_loaded} recipient(s) from reminders.csv`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <TopNav />
      <div className="flex items-center justify-between mb-5">
        <h1 className="font-display text-3xl text-cream">Family</h1>
        <Button variant="ghost" size="sm" disabled={busy} onClick={handleReload}>
          {busy ? "Reloading…" : "↻ Reload from CSV"}
        </Button>
      </div>
      {msg && <p className="text-sm text-ok mb-4">{msg}</p>}

      <Card>
        <CardTitle>Who gets reminded {status && <span className="text-mist/60 text-sm">({status.members.length})</span>}</CardTitle>
        {status ? <MemberList members={status.members} compact /> : <p className="text-sm text-mist">Loading…</p>}
      </Card>

      <Card className="mt-4">
        <CardTitle>Where recipients come from</CardTitle>
        <p className="text-sm text-mist/80 leading-relaxed">
          Nobody is hardcoded — every name, phone number, and reminder time comes from{" "}
          <code className="text-cream">reminders.csv</code> next to the backend. Edit the file, then hit
          &ldquo;Reload from CSV&rdquo; above (or just restart the backend) to pick up changes.
        </p>
      </Card>
    </>
  );
}

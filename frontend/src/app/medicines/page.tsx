"use client";

import { TopNav } from "@/components/nav/TopNav";
import { Card, CardTitle, CardLabel, CardMetric } from "@/components/ui/card";
import { MedicineList } from "@/components/dashboard/MedicineList";
import { UploadBill } from "@/components/dashboard/UploadBill";
import { TestSms } from "@/components/dashboard/TestSms";
import { useFamily } from "@/hooks/useFamily";
import { useFamilyStatus } from "@/hooks/useFamilyStatus";

export default function MedicinesPage() {
  const { family } = useFamily();
  const { status } = useFamilyStatus(family?.id ?? null);

  return (
    <>
      <TopNav />
      <h1 className="font-display text-3xl text-cream mb-5">Medicines</h1>

      {status && (
        <div className="grid md:grid-cols-2 gap-4 mb-5">
          <Card>
            <CardLabel>Run-out date</CardLabel>
            <CardMetric>
              {status.medicines[0]
                ? new Date(status.medicines[0].depletion_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                : "—"}
            </CardMetric>
          </Card>
          <Card>
            <CardLabel>{status.days_remaining !== null && status.days_remaining < 0 ? "Days overdue" : "Days remaining"}</CardLabel>
            <CardMetric className={status.days_remaining !== null && status.days_remaining < 0 ? "text-warn" : "text-ok"}>
              {status.days_remaining !== null ? Math.abs(status.days_remaining) : "—"}
            </CardMetric>
          </Card>
        </div>
      )}

      <Card className="mb-5">
        <CardTitle>Medicines being tracked</CardTitle>
        {status ? <MedicineList medicines={status.medicines} /> : <p className="text-sm text-mist">Loading…</p>}
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardTitle>Upload new bill / prescription</CardTitle>
          {family ? (
            <UploadBill familyId={family.id} onDone={() => window.location.reload()} />
          ) : (
            <p className="text-sm text-mist">Set up reminders.csv first.</p>
          )}
        </Card>

        <Card>
          <CardTitle>Send test SMS</CardTitle>
          <TestSms />
        </Card>
      </div>
    </>
  );
}

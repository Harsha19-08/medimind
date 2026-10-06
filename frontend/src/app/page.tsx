"use client";

import { Heart, Upload, Users as UsersIcon, History, Send } from "lucide-react";
import { TopNav } from "@/components/nav/TopNav";
import { Card, CardLabel, CardMetric, CardTitle } from "@/components/ui/card";
import { StatusPill } from "@/components/dashboard/StatusPill";
import { NextReminderCard } from "@/components/dashboard/NextReminderCard";
import { MemberList } from "@/components/dashboard/MemberList";
import { ActivityLog } from "@/components/dashboard/ActivityLog";
import { Badge } from "@/components/ui/badge";
import { useFamily } from "@/hooks/useFamily";
import { useFamilyStatus } from "@/hooks/useFamilyStatus";
import Link from "next/link";

const quickActions = [
  { href: "/medicines", label: "Upload Bill", icon: Upload },
  { href: "/family", label: "Add Family", icon: UsersIcon },
  { href: "/history", label: "View History", icon: History },
  { href: "/medicines", label: "Send Test SMS", icon: Send },
];

export default function HomePage() {
  const { family, loading, error } = useFamily();
  const { status } = useFamilyStatus(family?.id ?? null);

  return (
    <>
      <TopNav />

      <section className="pt-6 pb-8">
        <div className="text-xs tracking-[0.14em] uppercase text-gold font-medium mb-3">Family Care</div>
        <h1 className="font-display text-4xl md:text-5xl leading-[1.05] text-cream mb-3">
          Because someone
          <br />
          always cares
        </h1>
        <p className="text-mist/85 max-w-md mb-5">
          MediMind reminds your family about medicine refills — so no one has to ask, and no one gets missed.
        </p>
        <span className="inline-flex items-center gap-2 rounded-full bg-cream/10 border border-cream/20 px-4 py-2 text-sm text-cream backdrop-blur">
          <Heart size={14} className="text-terracotta-bright" /> Your family&apos;s health, our daily priority
        </span>
      </section>

      {loading && <Card className="text-sm text-mist">Loading…</Card>}
      {error && <Card className="text-sm text-warn">{error} — is the backend running?</Card>}

      {!loading && !family && (
        <Card className="text-sm text-mist">
          No family set up yet. Add <code className="text-cream">reminders.csv</code> next to the backend and restart it, or hit Reload recipients once it exists.
        </Card>
      )}

      {status && (
        <>
          <div className="mb-5">
            <StatusPill status={status.status} />
          </div>

          <div className="grid md:grid-cols-2 gap-4 mb-5">
            <NextReminderCard status={status} />

            <Card>
              <CardTitle>Quick Actions</CardTitle>
              <div className="grid grid-cols-2 gap-2.5">
                {quickActions.map(({ href, label, icon: Icon }) => (
                  <Link
                    key={label}
                    href={href}
                    className="flex flex-col items-center justify-center gap-1.5 rounded-xl2 border border-cream/15 bg-cream/5 py-4 text-xs text-cream hover:bg-cream/10 transition-colors"
                  >
                    <Icon size={18} className="text-terracotta-bright" />
                    {label}
                  </Link>
                ))}
              </div>
            </Card>
          </div>

          <Card className="mb-5">
            <div className="flex items-center justify-between mb-3">
              <CardTitle className="mb-0">Family Members</CardTitle>
              <Link href="/family" className="text-xs text-gold hover:underline">
                View All →
              </Link>
            </div>
            <MemberList members={status.members} compact />
          </Card>

          <div className="grid md:grid-cols-2 gap-4 mb-5">
            <Card>
              <CardTitle>Recent Activity</CardTitle>
              <ActivityLog logs={status.recent_logs} limit={4} />
            </Card>

            <Card>
              <CardTitle>Medicine Status</CardTitle>
              {status.medicines[0] ? (
                <div>
                  <div className="text-cream font-medium">{status.medicines[0].name}</div>
                  <div className="text-xs text-mist/70 mb-3">{status.last_sms?.recipient_name ?? status.members[0]?.name}</div>
                  <CardLabel>Runs out on</CardLabel>
                  <CardMetric className="mb-2">
                    {new Date(status.medicines[0].depletion_date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                  </CardMetric>
                  <Badge variant={status.medicines[0].overdue ? "warn" : "ok"}>
                    {status.medicines[0].overdue
                      ? `${Math.abs(status.medicines[0].days_remaining)} days overdue`
                      : `${status.medicines[0].days_remaining} days left`}
                  </Badge>
                </div>
              ) : (
                <p className="text-sm text-mist/70">Nothing uploaded yet.</p>
              )}
            </Card>
          </div>
        </>
      )}
    </>
  );
}

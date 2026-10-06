"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { sendTestSms } from "@/lib/api";

export function TestSms() {
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("This is a test reminder from MediMind.");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);

  async function handleSend() {
    if (!phone.trim()) {
      setResult({ ok: false, text: "Enter a phone number." });
      return;
    }
    setBusy(true);
    setResult(null);
    try {
      const data = await sendTestSms(phone, message);
      setResult({ ok: true, text: `Sent to ${data.phone}` });
    } catch (e) {
      setResult({ ok: false, text: e instanceof Error ? e.message : "Send failed" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <label className="block text-xs font-medium text-mist mt-1">Phone</label>
      <input
        className="w-full mt-1.5 rounded-lg border border-cream/20 bg-black/20 px-3 py-2.5 text-sm text-cream placeholder:text-mist/50 outline-none focus:border-terracotta-bright"
        placeholder="+91XXXXXXXXXX"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
      />
      <label className="block text-xs font-medium text-mist mt-3">Message</label>
      <textarea
        className="w-full mt-1.5 rounded-lg border border-cream/20 bg-black/20 px-3 py-2.5 text-sm text-cream outline-none focus:border-terracotta-bright"
        rows={2}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />
      <Button variant="secondary" className="w-full mt-3.5" disabled={busy} onClick={handleSend}>
        {busy ? "Sending…" : "Send test SMS"}
      </Button>
      {result && (
        <p className={`mt-2 text-sm ${result.ok ? "text-ok" : "text-warn"}`}>{result.text}</p>
      )}
    </div>
  );
}

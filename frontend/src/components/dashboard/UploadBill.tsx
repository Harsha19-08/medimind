"use client";

import { useRef, useState } from "react";
import { Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { uploadSlip } from "@/lib/api";

export function UploadBill({ familyId, onDone }: { familyId: string; onDone: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [banner, setBanner] = useState<{ ok: boolean; text: string } | null>(null);

  async function handleUpload() {
    const file = inputRef.current?.files?.[0];
    if (!file) {
      setBanner({ ok: false, text: "Choose a photo first." });
      return;
    }
    setBusy(true);
    setBanner(null);
    try {
      const data = await uploadSlip(familyId, file);
      setBanner({
        ok: true,
        text: `🎉 Cycle reset — tracking ${data.medicines.length} medicine(s). Reminders stopped until run-out date.`,
      });
      if (inputRef.current) inputRef.current.value = "";
      setFileName(null);
      onDone();
    } catch (e) {
      setBanner({ ok: false, text: e instanceof Error ? e.message : "Upload failed" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      {banner && (
        <div
          className={`mb-4 rounded-xl2 border border-cream/20 px-4 py-3 text-sm font-medium backdrop-blur ${
            banner.ok ? "bg-ok/15 text-ok" : "bg-warn/15 text-warn"
          }`}
        >
          {banner.text}
        </div>
      )}
      <label className="block cursor-pointer rounded-xl2 border border-dashed border-cream/30 bg-cream/5 p-7 text-center hover:border-terracotta-bright hover:bg-cream/[0.08] transition-colors">
        <Camera className="mx-auto mb-2 text-mist" size={26} />
        <div className="text-sm text-mist">{fileName || "Tap to choose a photo of the bill"}</div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
        />
      </label>
      <Button className="w-full mt-3.5" disabled={busy} onClick={handleUpload}>
        {busy ? "Reading the bill…" : "Analyze & reset cycle"}
      </Button>
    </div>
  );
}

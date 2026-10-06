"use client";

import { useEffect, useRef, useState } from "react";
import { getFamilyStatus, familyEventsUrl } from "@/lib/api";
import type { FamilyStatus } from "@/lib/types";

/**
 * Keeps FamilyStatus fresh. Tries Server-Sent Events for low-latency
 * updates; if SSE isn't available (blocked by a proxy, older browser,
 * connection drop) it transparently falls back to polling every 20s.
 * Core functionality never depends on this succeeding — a plain interval
 * poll always runs underneath as a safety net.
 */
export function useFamilyStatus(familyId: string | null) {
  const [status, setStatus] = useState<FamilyStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const sourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!familyId) return;
    let cancelled = false;

    const poll = async () => {
      try {
        const data = await getFamilyStatus(familyId);
        if (!cancelled) {
          setStatus(data);
          setError(null);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "failed to load status");
      }
    };

    poll(); // initial load, always runs regardless of SSE support
    const pollInterval = setInterval(poll, 20000);

    let es: EventSource | null = null;
    try {
      es = new EventSource(familyEventsUrl(familyId));
      es.onmessage = (ev) => {
        if (cancelled) return;
        try {
          setStatus(JSON.parse(ev.data));
          setError(null);
        } catch {
          // ignore malformed event, next poll will recover
        }
      };
      es.onerror = () => {
        es?.close();
      };
      sourceRef.current = es;
    } catch {
      // EventSource unsupported — polling above still covers us
    }

    return () => {
      cancelled = true;
      clearInterval(pollInterval);
      es?.close();
    };
  }, [familyId]);

  return { status, error };
}

"use client";

import { useEffect, useState } from "react";
import { getFamilies } from "@/lib/api";
import type { Family } from "@/lib/types";

export function useFamily() {
  const [family, setFamily] = useState<Family | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getFamilies()
      .then((families: Family[]) => setFamily(families[0] ?? null))
      .catch((e) => setError(e instanceof Error ? e.message : "failed to load"))
      .finally(() => setLoading(false));
  }, []);

  return { family, loading, error };
}

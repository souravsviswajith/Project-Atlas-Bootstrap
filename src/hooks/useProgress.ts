import { useCallback, useEffect, useState } from "react";
import { phases } from "../data/phases";
import { readStoredProgress, writeStoredProgress } from "./progressStorage";

const STORAGE_KEY = "atlas-checklist-progress-v2";
const LEGACY_STORAGE_KEY = "dev-setup-progress-v1";
const VALID_IDS = new Set(phases.flatMap((phase) => phase.sections.flatMap((section) => section.items.map((item) => item.id))));

function loadInitial(): Record<string, boolean> {
  try {
    return readStoredProgress(localStorage, VALID_IDS, STORAGE_KEY, LEGACY_STORAGE_KEY);
  } catch {
    // Storage may be disabled, malformed, or unavailable in a privacy-restricted browser.
    return {};
  }
}

export function useProgress() {
  const [checked, setChecked] = useState<Record<string, boolean>>(loadInitial);

  useEffect(() => {
    try { writeStoredProgress(localStorage, checked, VALID_IDS, STORAGE_KEY); } catch { /* best effort */ }
  }, [checked]);

  const toggle = useCallback((id: string) => {
    if (!VALID_IDS.has(id)) return;
    setChecked((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const setMany = useCallback((ids: string[], value: boolean) => {
    setChecked((prev) => {
      const next = { ...prev };
      ids.filter((id) => VALID_IDS.has(id)).forEach((id) => { next[id] = value; });
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    setChecked({});
    try { localStorage.removeItem(LEGACY_STORAGE_KEY); } catch { /* best effort */ }
  }, []);

  return { checked, toggle, setMany, reset };
}

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "dev-setup-progress-v1";

function loadInitial(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, boolean>) : {};
  } catch {
    return {};
  }
}

export function useProgress() {
  const [checked, setChecked] = useState<Record<string, boolean>>(loadInitial);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(checked));
    } catch {
      /* ignore quota errors */
    }
  }, [checked]);

  const toggle = useCallback((id: string) => {
    setChecked((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const setMany = useCallback((ids: string[], value: boolean) => {
    setChecked((prev) => {
      const next = { ...prev };
      ids.forEach((id) => {
        next[id] = value;
      });
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    setChecked({});
  }, []);

  return { checked, toggle, setMany, reset };
}

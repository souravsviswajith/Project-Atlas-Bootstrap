export interface ProgressStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function validChecked(value: unknown, validIds: ReadonlySet<string>): Record<string, boolean> {
  if (!isRecord(value)) return {};
  const result: Record<string, boolean> = {};
  for (const [id, checked] of Object.entries(value)) {
    if (validIds.has(id) && typeof checked === "boolean") result[id] = checked;
  }
  return result;
}

export function readStoredProgress(storage: ProgressStorage, validIds: ReadonlySet<string>, key: string, legacyKey: string): Record<string, boolean> {
  try {
    const current = storage.getItem(key);
    if (current) {
      const parsed: unknown = JSON.parse(current);
      if (isRecord(parsed) && parsed.schemaVersion === 2 && isRecord(parsed.checked)) return validChecked(parsed.checked, validIds);
    }
    const legacy = storage.getItem(legacyKey);
    if (!legacy) return {};
    const migrated = validChecked(JSON.parse(legacy), validIds);
    storage.setItem(key, JSON.stringify({ schemaVersion: 2, checked: migrated }));
    storage.removeItem(legacyKey);
    return migrated;
  } catch {
    return {};
  }
}

export function writeStoredProgress(storage: ProgressStorage, value: unknown, validIds: ReadonlySet<string>, key: string): void {
  try {
    storage.setItem(key, JSON.stringify({ schemaVersion: 2, checked: validChecked(value, validIds) }));
  } catch {
    // Storage can be unavailable or full; the in-memory checklist remains available.
  }
}

import { describe, expect, it } from "vitest";
import { readStoredProgress, writeStoredProgress, type ProgressStorage } from "./progressStorage";

function memoryStore(seed: Record<string, string> = {}): ProgressStorage & { data: Record<string, string> } {
  const data = { ...seed };
  return {
    data,
    getItem: (key) => data[key] ?? null,
    setItem: (key, value) => { data[key] = value; },
    removeItem: (key) => { delete data[key]; },
  };
}

const ids = new Set(["git-name", "py-uv"]);

describe("versioned checklist persistence", () => {
  it("migrates valid v1 IDs and drops stale IDs and malformed values", () => {
    const storage = memoryStore({ old: JSON.stringify({ "git-name": true, removed: true, "py-uv": "yes" }) });
    expect(readStoredProgress(storage, ids, "new", "old")).toEqual({ "git-name": true });
    expect(JSON.parse(storage.data.new)).toEqual({ schemaVersion: 2, checked: { "git-name": true } });
    expect(storage.data.old).toBeUndefined();
  });

  it("validates v2 persisted objects and recovers corrupted or stale keys safely", () => {
    const storage = memoryStore({ new: JSON.stringify({ schemaVersion: 2, checked: { "git-name": false, unknown: true } }) });
    expect(readStoredProgress(storage, ids, "new", "old")).toEqual({ "git-name": false });
    storage.data.new = "not-json";
    expect(readStoredProgress(storage, ids, "new", "missing")).toEqual({});
  });

  it("writes only current boolean IDs and tolerates storage failures", () => {
    const storage = memoryStore();
    writeStoredProgress(storage, { "git-name": true, obsolete: true, "py-uv": 1 }, ids, "new");
    expect(JSON.parse(storage.data.new)).toEqual({ schemaVersion: 2, checked: { "git-name": true } });
    const broken = { ...storage, setItem: () => { throw new Error("quota"); } };
    expect(() => writeStoredProgress(broken, { "git-name": true }, ids, "new")).not.toThrow();
  });
});

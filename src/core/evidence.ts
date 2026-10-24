import type { AtlasPlan, PlanStep } from "./types";

export type ExecutionStatus = "not-run" | "succeeded" | "failed" | "interrupted";
export type VerificationStatus = "not-run" | "passed" | "failed" | "unknown";
export interface EvidenceEntry {
  capabilityId: string;
  provider?: string;
  execution: ExecutionStatus;
  verification: VerificationStatus;
  observedVersion?: string;
  diagnostics?: string;
}
export interface AtlasReport {
  schemaVersion: 1;
  planGeneratedAt: string;
  recordedAt: string;
  target: AtlasPlan["target"];
  entries: EvidenceEntry[];
  integrity: { algorithm: "sha256"; previousHash: string | null; hash: string };
}

const SECRET_ASSIGNMENT = /((?:password|passwd|token|secret|api[_-]?key|authorization)\s*[:=]\s*)[^\s,;]+/gi;
const BEARER_TOKEN = /Bearer\s+[A-Za-z0-9._~+\/-]+=*/gi;
export function sanitizeDiagnostic(text: string): string {
  return text.replace(BEARER_TOKEN, "Bearer [REDACTED]").replace(SECRET_ASSIGNMENT, "$1[REDACTED]").slice(0, 4000);
}

function payload(planGeneratedAt: string, recordedAt: string, target: AtlasPlan["target"], entries: EvidenceEntry[], previousHash: string | null): string {
  return JSON.stringify({ schemaVersion: 1, planGeneratedAt, recordedAt, target, entries, previousHash });
}

async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

/** Canonical SHA-256 chaining provides tamper evidence, not cryptographic immutability. */
export async function createEvidenceReport(plan: AtlasPlan, entries: EvidenceEntry[], previousHash?: string, now = new Date()): Promise<AtlasReport> {
  const plannedIds = new Set(plan.steps.map((step) => step.capabilityId));
  if (entries.some((entry) => !plannedIds.has(entry.capabilityId))) throw new Error("Evidence contains a capability not present in the plan");
  if (new Set(entries.map((entry) => entry.capabilityId)).size !== entries.length) throw new Error("Evidence contains duplicate capability entries");
  const sanitizedEntries = entries
    .map((entry) => ({ ...entry, ...(entry.diagnostics ? { diagnostics: sanitizeDiagnostic(entry.diagnostics) } : {}) }))
    .sort((a, b) => a.capabilityId.localeCompare(b.capabilityId));
  const recordedAt = now.toISOString();
  const chainPredecessor = previousHash ?? null;
  const hash = await sha256(payload(plan.generatedAt, recordedAt, plan.target, sanitizedEntries, chainPredecessor));
  return { schemaVersion: 1, planGeneratedAt: plan.generatedAt, recordedAt, target: plan.target, entries: sanitizedEntries, integrity: { algorithm: "sha256", previousHash: chainPredecessor, hash } };
}

export async function verifyEvidenceReport(report: AtlasReport): Promise<boolean> {
  if (report.schemaVersion !== 1 || report.integrity.algorithm !== "sha256") return false;
  const expected = await sha256(payload(report.planGeneratedAt, report.recordedAt, report.target, report.entries, report.integrity.previousHash));
  return expected === report.integrity.hash;
}

export function initialEvidence(plan: AtlasPlan): EvidenceEntry[] {
  return plan.steps.map((step: PlanStep) => ({ capabilityId: step.capabilityId, provider: step.provider?.manager, execution: "not-run", verification: "not-run" }));
}

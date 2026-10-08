import {
  BrainCircuit,
  CheckCircle2,
  Cloud,
  Code2,
  Database,
  GitBranch,
  ListChecks,
  Smartphone,
  Terminal,
  type LucideIcon,
} from "lucide-react";
import type { Phase } from "../data/phases";

// phases.ts stores icons as strings. Map them explicitly so only these icons
// are bundled; unknown names fall back to a generic list icon.
const ICONS: Record<string, LucideIcon> = {
  BrainCircuit,
  Cloud,
  Code2,
  Database,
  GitBranch,
  Smartphone,
  Terminal,
};

export interface SidebarProps {
  phases: Phase[];
  activeId: string;
  onSelect: (id: string) => void;
  progressFor: (phase: Phase) => { done: number; total: number };
}

export default function Sidebar({ phases, activeId, onSelect, progressFor }: SidebarProps) {
  return (
    <nav aria-label="Setup phases">
      <p className="mb-3 px-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
        Phases
      </p>
      <ul className="space-y-1">
        {phases.map((phase) => {
          const { done, total } = progressFor(phase);
          const isActive = phase.id === activeId;
          const isComplete = total > 0 && done === total;
          const percent = total > 0 ? Math.round((done / total) * 100) : 0;
          const Icon = ICONS[phase.icon] ?? ListChecks;

          return (
            <li key={phase.id}>
              <button
                type="button"
                onClick={() => onSelect(phase.id)}
                aria-current={isActive ? "step" : undefined}
                title={phase.tagline}
                className={`w-full rounded-lg border px-3 py-2.5 text-left transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400 ${
                  isActive
                    ? "border-slate-700 bg-slate-900 text-white"
                    : "border-transparent text-slate-400 hover:bg-slate-900/60 hover:text-slate-200"
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Icon size={16} aria-hidden="true" className="shrink-0" />
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">
                    {phase.number}. {phase.title}
                  </span>
                  <span
                    className={`flex shrink-0 items-center gap-1.5 text-xs tabular-nums ${
                      isComplete ? "text-emerald-400" : "text-slate-500"
                    }`}
                  >
                    {isComplete && <CheckCircle2 size={14} aria-hidden="true" />}
                    {done}/{total}
                  </span>
                </span>
                <span aria-hidden="true" className="mt-2 block h-1 overflow-hidden rounded-full bg-slate-800">
                  <span
                    className={`block h-full rounded-full bg-gradient-to-r ${phase.color} transition-all`}
                    style={{ width: `${percent}%` }}
                  />
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

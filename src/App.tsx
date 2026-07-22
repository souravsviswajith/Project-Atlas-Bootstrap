import { useMemo, useState } from "react";
import {
  CheckCircle2,
  ExternalLink,
  ListChecks,
  RotateCcw,
  Rocket,
  Menu,
  X,
} from "lucide-react";
import { phases, totalItemCount, type Phase } from "./data/phases";
import { useProgress } from "./hooks/useProgress";
import Sidebar from "./components/Sidebar";
import ChecklistItemRow from "./components/ChecklistItemRow";

function phaseItemIds(phase: Phase): string[] {
  return phase.sections.flatMap((s) => s.items.map((i) => i.id));
}

export default function App() {
  const [activeId, setActiveId] = useState<string>(phases[0].id);
  const { checked, toggle, setMany, reset } = useProgress();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const activePhase = useMemo(() => phases.find((p) => p.id === activeId)!, [activeId]);

  const progressFor = (phase: Phase) => {
    const ids = phaseItemIds(phase);
    const done = ids.filter((id) => checked[id]).length;
    return { done, total: ids.length };
  };

  const overallDone = useMemo(
    () => Object.values(checked).filter(Boolean).length,
    [checked]
  );
  const overallPct = totalItemCount ? Math.round((overallDone / totalItemCount) * 100) : 0;

  const activeIds = phaseItemIds(activePhase);
  const activeDone = activeIds.filter((id) => checked[id]).length;
  const phaseIndex = phases.findIndex((p) => p.id === activeId);

  const goTo = (id: string) => {
    setActiveId(id);
    setMobileNavOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              className="rounded-lg border border-slate-800 p-2 text-slate-300 hover:bg-slate-900 lg:hidden"
              onClick={() => setMobileNavOpen((v) => !v)}
              aria-label="Toggle navigation"
            >
              {mobileNavOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-950">
              <Rocket size={18} />
            </span>
            <div>
              <h1 className="text-sm font-semibold leading-tight text-white sm:text-base">
                Dev Machine Setup Wizard
              </h1>
              <p className="text-[11px] text-slate-500 sm:text-xs">Phases 7 – 13 · Git through Databases</p>
            </div>
          </div>

          <div className="hidden items-center gap-4 sm:flex">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <ListChecks size={14} className="text-emerald-400" />
              <span className="tabular-nums">
                {overallDone}/{totalItemCount} steps
              </span>
            </div>
            <div className="h-2 w-40 overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all"
                style={{ width: `${overallPct}%` }}
              />
            </div>
            <span className="w-10 text-right text-xs font-semibold tabular-nums text-emerald-400">
              {overallPct}%
            </span>
          </div>

          <button
            onClick={reset}
            className="flex items-center gap-1.5 rounded-lg border border-slate-800 px-2.5 py-1.5 text-xs text-slate-400 transition hover:border-red-900 hover:text-red-400"
          >
            <RotateCcw size={13} />
            <span className="hidden sm:inline">Reset</span>
          </button>
        </div>
        {/* mobile progress bar */}
        <div className="px-4 pb-3 sm:hidden">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>
              {overallDone}/{totalItemCount} steps
            </span>
            <span className="font-semibold text-emerald-400">{overallPct}%</span>
          </div>
          <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all"
              style={{ width: `${overallPct}%` }}
            />
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6 sm:px-6">
        {/* Sidebar */}
        <aside
          className={`${
            mobileNavOpen ? "block" : "hidden"
          } fixed inset-0 z-20 overflow-y-auto bg-slate-950 p-4 pt-4 lg:sticky lg:top-20 lg:block lg:h-[calc(100vh-6rem)] lg:w-72 lg:shrink-0 lg:bg-transparent lg:p-0`}
        >
          <Sidebar phases={phases} activeId={activeId} onSelect={goTo} progressFor={progressFor} />

          <div className="mt-6 rounded-xl border border-slate-800 bg-slate-900/40 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Reference</p>
            <a
              href="https://learn.microsoft.com/windows/wsl/install"
              target="_blank"
              rel="noreferrer"
              className="mt-2 flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300"
            >
              WSL install guide <ExternalLink size={12} />
            </a>
            <a
              href="https://docs.flutter.dev/get-started/install/windows"
              target="_blank"
              rel="noreferrer"
              className="mt-2 flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300"
            >
              Flutter Windows setup <ExternalLink size={12} />
            </a>
          </div>
        </aside>

        {/* Main content */}
        <main className="min-w-0 flex-1">
          <div className={`rounded-2xl border border-slate-800 bg-gradient-to-br ${activePhase.color} p-[1px]`}>
            <div className="rounded-2xl bg-slate-950/95 p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                    Phase {activePhase.number} of 13
                  </p>
                  <h2 className="mt-1 text-2xl font-bold text-white sm:text-3xl">{activePhase.title}</h2>
                  <p className="mt-1 text-sm text-slate-400">{activePhase.tagline}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-lg font-bold tabular-nums text-white">
                      {activeDone}/{activeIds.length}
                    </p>
                    <p className="text-[11px] text-slate-500">completed</p>
                  </div>
                  <button
                    onClick={() => setMany(activeIds, activeDone !== activeIds.length)}
                    className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-medium text-slate-200 transition hover:border-emerald-700 hover:text-emerald-300"
                  >
                    <CheckCircle2 size={14} />
                    {activeDone === activeIds.length ? "Uncheck all" : "Mark all done"}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 space-y-6">
            {activePhase.sections.map((section) => (
              <section key={section.title}>
                <h3 className="mb-2.5 flex items-center gap-2 text-sm font-semibold text-slate-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-600" />
                  {section.title}
                </h3>
                <ul className="space-y-2">
                  {section.items.map((item) => (
                    <ChecklistItemRow
                      key={item.id}
                      item={item}
                      checked={!!checked[item.id]}
                      onToggle={() => toggle(item.id)}
                    />
                  ))}
                </ul>
              </section>
            ))}
          </div>

          {/* Prev / Next */}
          <div className="mt-8 flex items-center justify-between gap-3 border-t border-slate-800 pt-5">
            <button
              disabled={phaseIndex === 0}
              onClick={() => goTo(phases[phaseIndex - 1].id)}
              className="rounded-lg border border-slate-800 px-4 py-2 text-sm text-slate-300 transition hover:border-slate-600 disabled:cursor-not-allowed disabled:opacity-30"
            >
              ← Phase {phaseIndex > 0 ? phases[phaseIndex - 1].number : ""}
            </button>
            <button
              disabled={phaseIndex === phases.length - 1}
              onClick={() => goTo(phases[phaseIndex + 1].id)}
              className="rounded-lg bg-gradient-to-r from-indigo-500 to-violet-600 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-indigo-950/40 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-30"
            >
              Phase {phaseIndex < phases.length - 1 ? phases[phaseIndex + 1].number : ""} →
            </button>
          </div>
        </main>
      </div>

      <footer className="border-t border-slate-800/80 py-6 text-center text-xs text-slate-600">
        Progress is saved automatically in this browser. Built for setting up a full-stack, cloud & mobile dev machine.
      </footer>
    </div>
  );
}

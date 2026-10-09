import type { ChecklistItem } from "../data/phases";

export interface ChecklistItemRowProps {
  item: ChecklistItem;
  checked: boolean;
  onToggle: () => void;
}

// Rendered inside a <ul> by App.tsx, so the row root is an <li>.
export default function ChecklistItemRow({ item, checked, onToggle }: ChecklistItemRowProps) {
  const inputId = `step-${item.id}`;
  const commands = item.commands ?? [];

  return (
    <li
      className={`flex gap-3 rounded-xl border p-4 transition ${
        checked ? "border-slate-800/60 bg-slate-900/20" : "border-slate-800 bg-slate-900/40"
      }`}
    >
      <input
        id={inputId}
        type="checkbox"
        checked={checked}
        onChange={onToggle}
        className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-emerald-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400"
      />
      <div className="min-w-0 flex-1">
        <label
          htmlFor={inputId}
          className={`block cursor-pointer text-sm font-medium ${
            checked ? "text-slate-500 line-through" : "text-slate-100"
          }`}
        >
          {item.label}
        </label>
        {item.note && <p className="mt-1 text-xs leading-relaxed text-slate-400">{item.note}</p>}
        {commands.length > 0 && (
          <pre className="mt-3 overflow-x-auto rounded-lg border border-slate-800 bg-slate-950 p-3 font-mono text-xs leading-relaxed text-slate-300">
            <code>{commands.join("\n")}</code>
          </pre>
        )}
      </div>
    </li>
  );
}

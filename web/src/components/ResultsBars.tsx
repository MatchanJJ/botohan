import { plural } from "@/lib/format";

/** Horizontal results bars. Leader(s) in black, the rest grey (DESIGN_BRIEF.md). */
export function ResultsBars({ options, results }: { options: readonly string[]; results: readonly bigint[] }) {
  const total = results.reduce((sum, n) => sum + n, 0n);
  const max = results.reduce((m, n) => (n > m ? n : m), 0n);

  return (
    <section aria-label="Results" className="border-t-[3px] border-ink pt-4">
      <h2 className="font-display text-[20px]">Results</h2>
      <p className="text-grey">{plural(total, "vote")}</p>
      <ul className="mt-4 space-y-4">
        {options.map((label, i) => {
          const count = results[i] ?? 0n;
          const pct = total > 0n ? Number((count * 100n) / total) : 0;
          const leading = total > 0n && count === max;
          return (
            <li key={i}>
              <div className="flex items-baseline justify-between gap-4">
                <span>
                  {label}
                  {leading && <span className="ml-2 text-[14px] font-semibold">Leading</span>}
                </span>
                <span className="shrink-0 tabular-nums">
                  {count.toString()} · {pct}%
                </span>
              </div>
              <div className="mt-1 h-3 bg-soft" aria-hidden="true">
                <div
                  className={`h-full transition-[width] duration-500 ease-out motion-reduce:transition-none ${leading ? "bg-ink" : "bg-bar"}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

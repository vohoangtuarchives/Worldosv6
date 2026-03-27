const widths = ['w-24', 'w-4/5', 'w-3/5', 'w-2/3', 'w-1/2'];

export function ObserverLoadingState({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-6 font-sans">
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={index}
          className="animate-pulse rounded-[2rem] border border-slate-100 bg-slate-50 p-8 shadow-sm"
        >
          <div className={`h-4 rounded-full bg-slate-200/80 ${widths[index % widths.length]}`} />
          <div className="mt-6 h-3.5 w-full rounded-full bg-slate-100" />
          <div className={`mt-3 h-3.5 rounded-full bg-slate-100 ${widths[(index + 2) % widths.length]}`} />
          <div className={`mt-3 h-3.5 rounded-full bg-slate-100 ${widths[(index + 3) % widths.length]}`} />
        </div>
      ))}
    </div>
  );
}

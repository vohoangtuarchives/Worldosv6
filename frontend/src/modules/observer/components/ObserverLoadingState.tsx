const widths = ['w-24', 'w-4/5', 'w-3/5', 'w-2/3', 'w-1/2'];

export function ObserverLoadingState({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={index}
          className="animate-pulse rounded-[26px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] p-5"
        >
          <div className={`h-3 rounded bg-white/10 ${widths[index % widths.length]}`} />
          <div className="mt-4 h-3 w-full rounded bg-white/6" />
          <div className={`mt-2 h-3 rounded bg-white/6 ${widths[(index + 2) % widths.length]}`} />
          <div className={`mt-2 h-3 rounded bg-white/6 ${widths[(index + 3) % widths.length]}`} />
        </div>
      ))}
    </div>
  );
}

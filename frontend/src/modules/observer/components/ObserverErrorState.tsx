export function ObserverErrorState({
  title,
  description,
  onRetry,
}: {
  title: string;
  description: string;
  onRetry: () => void;
}) {
  return (
    <div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 p-5 text-sm text-rose-100">
      <p className="font-semibold">{title}</p>
      <p className="mt-2 text-rose-100/80">{description}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-4 rounded-xl border border-rose-200/20 bg-black/10 px-4 py-2 text-xs uppercase tracking-[0.18em] transition hover:bg-black/20"
      >
        Retry
      </button>
    </div>
  );
}

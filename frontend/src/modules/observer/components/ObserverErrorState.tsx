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
    <div className="rounded-[2rem] border border-rose-200 bg-rose-50 p-8 text-sm text-rose-700 shadow-sm font-sans">
      <p className="text-lg font-black uppercase tracking-tight">{title}</p>
      <p className="mt-3 text-rose-600/80 font-medium leading-relaxed">{description}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-6 rounded-xl border border-rose-200 bg-white px-6 py-2.5 text-[10px] font-black uppercase tracking-[0.2em] text-rose-700 transition hover:bg-rose-100 shadow-sm"
      >
        Thử lại
      </button>
    </div>
  );
}

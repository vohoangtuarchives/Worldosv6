'use client';

import { History } from 'lucide-react';

type Dictionary = Record<string, unknown>;

interface HistoryTabProps {
    historyEvents: Array<{ label: string; event: Dictionary }>;
    eraSummaries: unknown[];
    sentenceCase: (value: string | undefined | null) => string;
}

export default function HistoryTab({
    historyEvents,
    eraSummaries,
    sentenceCase,
}: HistoryTabProps) {
    return (
        <div className="grid gap-6 xl:grid-cols-[0.7fr_1.3fr]">
            <div className="space-y-6">
                 {historyEvents.map(({ label, event }) => (
                    <div key={label} className="rounded-[32px] border border-slate-800 bg-slate-950/40 p-6">
                        <div className="mb-3 flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">{label}</span>
                            <span className="rounded-lg bg-cyan-500/10 px-2 py-1 text-[10px] font-black text-cyan-400 ring-1 ring-inset ring-cyan-500/20">
                                TICK {String(event.tick ?? '???')}
                            </span>
                        </div>
                        <div className="text-lg font-black text-white mb-2">{sentenceCase(String(event.type || 'Undefined'))}</div>
                        <p className="text-sm text-slate-400 leading-relaxed italic line-clamp-3">&quot;{String(event.summary || 'A forgotten shadow in the river of time.')}&quot;</p>
                    </div>
                 ))}
            </div>
            <div className="rounded-[32px] border border-slate-800 bg-slate-950/40 p-8">
                 <div className="mb-6 flex items-center gap-2 text-rose-300">
                    <History size={20} />
                    <h3 className="text-xl font-black italic tracking-[-0.02em]">Historical Eras / Timeline</h3>
                 </div>
                 <div className="relative pl-8 before:absolute before:left-3 before:top-2 before:bottom-0 before:w-px before:bg-gradient-to-b before:from-rose-500/60 before:to-transparent">
                    {eraSummaries.map((era, i) => (
                        <div key={i} className="mb-10 relative">
                            <div className="absolute -left-[25px] top-1 h-3 w-3 rounded-full bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)] border-2 border-slate-950" />
                            <div className="flex items-center gap-4 mb-2">
                                <span className="text-xs font-black text-rose-400 tracking-widest">{String((era as Dictionary).start_tick)} - {String((era as Dictionary).end_tick)}</span>
                                <div className="h-px flex-1 bg-slate-800/40" />
                            </div>
                            <h4 className="text-xl font-black text-white mb-2 tracking-tight">{String((era as Dictionary).title)}</h4>
                            <p className="text-sm text-slate-400 leading-relaxed">{String((era as Dictionary).summary)}</p>
                        </div>
                    ))}
                 </div>
            </div>
         </div>
    );
}

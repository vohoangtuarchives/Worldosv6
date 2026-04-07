'use client';

import { Sparkles, ScrollText } from 'lucide-react';

type Dictionary = Record<string, unknown>;

interface LoreTabProps {
    myths: Dictionary;
    dominantReligion: Dictionary;
    getEntries: (value: unknown) => Array<[string, number]>;
    formatMetric: (value: number | undefined, digits?: number) => string;
    sentenceCase: (value: string | undefined | null) => string;
}

export default function LoreTab({
    myths,
    dominantReligion,
    getEntries,
    formatMetric,
    sentenceCase,
}: LoreTabProps) {
    return (
        <div className="grid gap-6 md:grid-cols-2">
             <div className="rounded-[32px] border border-slate-800 bg-slate-950/40 p-8">
                 <div className="mb-6 flex items-center gap-2 text-violet-300">
                    <Sparkles size={20} />
                    <h3 className="text-xl font-black tracking-tight uppercase">Mythogenetic Tree</h3>
                 </div>
                 <div className="space-y-4">
                     {getEntries(myths.top_types).map(([label, count]) => (
                         <div key={label} className="p-4 rounded-2xl bg-white/[0.03] border border-slate-800">
                             <div className="flex justify-between items-center mb-1">
                                 <span className="font-bold text-white text-base">{sentenceCase(label)}</span>
                                 <span className="text-violet-400 font-black">{String(count)}</span>
                             </div>
                             <div className="text-xs text-slate-500 italic">Genesis from chronicle patterns</div>
                         </div>
                     ))}
                 </div>
             </div>
             <div className="rounded-[32px] border border-slate-800 bg-slate-950/40 p-8">
                 <div className="mb-6 flex items-center gap-2 text-emerald-300">
                    <ScrollText size={20} />
                    <h3 className="text-xl font-black tracking-tight uppercase">Active Religions</h3>
                 </div>
                 <div className="space-y-6">
                     <div className="p-6 rounded-[28px] bg-emerald-500/5 border border-emerald-500/20">
                        <div className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-2">Dominant Faith</div>
                        <h4 className="text-2xl font-black text-white">{sentenceCase(String(dominantReligion.name || 'none'))}</h4>

                        <div className="mt-4 p-4 rounded-xl bg-slate-950/60 border border-emerald-500/10">
                            <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Sacred Doctrine</div>
                            <p className="text-sm text-emerald-100/80 leading-relaxed italic">
                                &quot;{String(dominantReligion.doctrine || 'No records in the Great Library.')}&quot;
                            </p>
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-4">
                            <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800">
                                <div className="text-[9px] text-slate-500 uppercase font-black tracking-widest mb-1">Followers</div>
                                <div className="text-lg font-bold text-white">{String(dominantReligion.followers || 0)}</div>
                            </div>
                            <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800">
                                <div className="text-[9px] text-slate-500 uppercase font-black tracking-widest mb-1">Spread Rate</div>
                                <div className="text-lg font-bold text-white">{formatMetric(Number(dominantReligion.spread_rate || 0), 2)}</div>
                            </div>
                        </div>

                        {Array.isArray(dominantReligion.holy_sites) && dominantReligion.holy_sites.length > 0 && (
                            <div className="mt-4">
                                <div className="text-[9px] text-slate-500 uppercase font-black tracking-widest mb-2">Holy Sites</div>
                                <div className="flex flex-wrap gap-2">
                                    {dominantReligion.holy_sites.map((site: unknown, i: number) => (
                                        <span key={i} className="px-3 py-1 rounded-full bg-emerald-500/10 text-[10px] font-bold text-emerald-300 border border-emerald-500/20">
                                            {String(site)}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                     </div>
                 </div>
             </div>
        </div>
    );
}

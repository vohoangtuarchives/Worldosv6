"use client";

import { useEffect, useState } from "react";
import { GitMerge } from "lucide-react";

import { api } from "@/lib/api";

export default function EvolutionTree() {
    const [data, setData] = useState<any>(null);

    useEffect(() => {
        api.labDashboard.evolution()
            .then((json: any) => setData(json))
            .catch((err: any) => console.error("Failed to load evolution tree", err));
    }, []);

    if (!data) return <div className="h-full flex items-center justify-center animate-pulse text-zinc-500">Sequencing Genomes...</div>;

    return (
        <div className="bg-zinc-950/50 backdrop-blur-md border border-zinc-800 rounded-xl p-6 h-full flex flex-col">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                        <GitMerge className="w-5 h-5 text-indigo-400" />
                        Evolution Lineage
                    </h2>
                    <p className="text-zinc-400 text-sm mt-1">Ancestry of emergent archetypes.</p>
                </div>
            </div>

            <div className="flex-grow flex items-center justify-center min-h-[150px]">
                <div className="text-center font-mono opacity-60">
                    <div className="text-indigo-400 text-sm mb-2">Ancestral Tree</div>
                    <div className="text-zinc-400 text-xs flex flex-col items-center">
                        <span>[Warlord]</span>
                        <span className="text-zinc-600">|</span>
                        <span>[Technocrat]</span>
                        <span className="text-zinc-600">|</span>
                        <div className="flex gap-4">
                            <span>[CyberDictator]</span>
                            <span>[AIGovernor]</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-4 pt-4 border-t border-zinc-800">
                <h3 className="text-xs text-zinc-500 uppercase font-semibold mb-3">Winning Phenotypes</h3>
                <div className="grid grid-cols-2 gap-2">
                    {data.win_rates.map((rate: any, i: number) => (
                        <div key={i} className="flex justify-between text-xs p-2 bg-zinc-900 rounded">
                            <span className="text-zinc-300">{rate.name}</span>
                            <span className="text-indigo-400 font-mono">{rate.rate}%</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

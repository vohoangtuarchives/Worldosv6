"use client";

import React, { useState, useEffect } from "react";

interface AxiomConsoleProps {
    initialAxioms: Record<string, unknown>;
    onUpdate: (axioms: Record<string, unknown>) => Promise<void>;
    busy?: boolean;
}

export function AxiomConsole({ initialAxioms, onUpdate, busy }: AxiomConsoleProps) {
    const [axiomsJson, setAxiomsJson] = useState("{}");

    useEffect(() => {
        setAxiomsJson(JSON.stringify(initialAxioms, null, 2));
    }, [initialAxioms]);

    const handleApply = async () => {
        try {
            const parsed = JSON.parse(axiomsJson);
            await onUpdate(parsed);
        } catch (e) {
            alert("Invalid JSON format");
        }
    };

    return (
        <div className="rounded-xl border border-border bg-card/50 p-6 backdrop-blur">
            <div className="text-sm font-semibold mb-4 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                Thiên Đạo Tiên Đề (World Axioms)
            </div>
            <textarea
                value={axiomsJson}
                onChange={(e) => setAxiomsJson(e.target.value)}
                className="min-h-48 w-full rounded-md border border-input bg-background/50 p-3 font-mono text-xs text-blue-100 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                spellCheck={false}
            />
            <div className="mt-4 flex justify-end">
                <button
                    onClick={handleApply}
                    disabled={busy}
                    className="rounded-[var(--radius)] bg-primary/20 border border-primary/50 text-blue-400 px-4 py-2 text-sm font-semibold hover:bg-primary/30 transition-all disabled:opacity-50"
                >
                    {busy ? "Applying..." : "Apply Axiom Shift"}
                </button>
            </div>
        </div>
    );
}

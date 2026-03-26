'use client';

import React from 'react';
import { RealityPulse } from './components/RealityPulse';
import { MutationStream } from './components/MutationStream';
import { AiDiagnosticsLab } from './components/AiDiagnosticsLab';

/**
 * Walkthrough: Observer Console Observability Expansion (V2)
 * 
 * This document demonstrates the new visualization and diagnostic tools
 * implemented to monitor the simulation's autopoietic stability and AI intelligence.
 */

// --- 1. Reality Pulse (Z-Health) ---
// The Reality Pulse provides a real-time SVG visualization of the universe's health.
// It reflects Entropy (chaos) and Stability (structure).
// High entropy triggers a "Pressure" animation with red glow and crystalline glitches.

/*
<RealityPulse entropy={0.8} stability={0.2} />
*/

// --- 2. Mutation Stream (Autonomy Audit) ---
// Displays a historical log of all autopoietic DSL mutations applied to the simulation.
// Lists the DSL path, the latest tick of mutation, and the number of versions.

/*
<MutationStream universeId="1" />
*/

// --- 3. AI Diagnostics Lab ---
// A playground for verifying AI Driver connectivity (OpenRouter, Ollama, etc.).
// Allows sending direct neural probes (prompts) and viewing raw latency/responses.

/*
<AiDiagnosticsLab />
*/

export default function WalkthroughDemo() {
  return (
    <div className="p-8 space-y-12 bg-black text-white min-h-screen">
      <header>
        <h1 className="text-4xl font-bold tracking-tighter uppercase italic">Causal Observability V2</h1>
        <p className="text-muted-foreground mt-2">Telemetry for the self-evolving multiverse.</p>
      </header>

      <div className="grid gap-8 lg:grid-cols-2">
        <section className="space-y-4">
           <h2 className="text-xl font-semibold border-b border-white/10 pb-2 uppercase tracking-widest">Reality Vitality</h2>
           <div className="bg-card/20 rounded-3xl p-12 flex items-center justify-center border border-white/5 backdrop-blur-xl">
              <RealityPulse entropy={0.4} stability={0.8} />
           </div>
        </section>

        <section className="space-y-4">
           <h2 className="text-xl font-semibold border-b border-white/10 pb-2 uppercase tracking-widest">Neural Diagnostic</h2>
           <AiDiagnosticsLab />
        </section>

        <section className="col-span-full space-y-4">
           <h2 className="text-xl font-semibold border-b border-white/10 pb-2 uppercase tracking-widest">Autonomy Chronicle</h2>
           <MutationStream universeId="1" />
        </section>
      </div>
    </div>
  );
}

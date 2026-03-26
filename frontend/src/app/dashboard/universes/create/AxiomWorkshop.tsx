'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useObserverCreateUniverse } from '@/modules/observer/api';
import type { CreateUniversePayload } from '@/modules/observer/types';
import { Sparkles, Zap, Shield, Microscope, Globe, AlertTriangle, Loader2 } from 'lucide-react';

const AXIOM_CONFIGS = [
  { id: 'physics.gravity', name: 'Gravity', icon: Globe, min: 0.1, max: 5.0, step: 0.1, default: 1.0, dimension: 'Physics' },
  { id: 'physics.entropy', name: 'Entropy Decay', icon: Zap, min: 0.1, max: 10.0, step: 0.1, default: 1.0, dimension: 'Physics' },
  { id: 'physics.time_dilation', name: 'Time Flow', icon: Loader2, min: 0.1, max: 10.0, step: 0.1, default: 1.0, dimension: 'Physics' },
  { id: 'energy.spiritual_qi_density', name: 'Qi Density', icon: Sparkles, min: 0.0, max: 1.0, step: 0.01, default: 0.1, dimension: 'Metaphysics' },
  { id: 'metaphysics.soul_permanence', name: 'Soul Stability', icon: Shield, min: 0.0, max: 1.0, step: 0.01, default: 0.1, dimension: 'Metaphysics' },
  { id: 'social.knowledge_propagation', name: 'Info Velocity', icon: Microscope, min: 0.0, max: 1.0, step: 0.01, default: 0.2, dimension: 'Social' },
];

export function AxiomWorkshop() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [baseGenre, setBaseGenre] = useState('fantasy');
  const [axioms, setAxioms] = useState<Record<string, number>>(
    AXIOM_CONFIGS.reduce((acc, config) => ({ ...acc, [config.id]: config.default }), {})
  );

  const createUniverse = useObserverCreateUniverse();

  const handleSliderChange = (id: string, value: string) => {
    setAxioms(prev => ({ ...prev, [id]: parseFloat(value) }));
  };

  const calculateStability = () => {
    const entropy = axioms['physics.entropy'] || 1;
    const gravity = axioms['physics.gravity'] || 1;
    const stability = 100 - (entropy * 5) - (Math.abs(1 - gravity) * 10);
    return Math.max(0, Math.min(100, Math.round(stability)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    const payload: CreateUniversePayload = {
      name,
      base_genre: baseGenre,
      axioms,
      initial_state: {
        entropy: axioms['physics.entropy'] || 0,
        stability_index: calculateStability() / 100,
        metrics: {}
      }
    };

    try {
      const result = await createUniverse.mutateAsync(payload);
      router.push(`/dashboard/universes/${result.id}`);
    } catch (error) {
      console.error('Failed to create universe:', error);
    }
  };

  const stability = calculateStability();

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl mx-auto pb-20">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
          Axiom Workshop
        </h1>
        <p className="text-muted-foreground">
          Breathe life into a new reality by configuring its fundamental constants.
        </p>
      </div>

      <div className="rounded-xl border border-purple-500/20 bg-black/40 backdrop-blur-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/10">
          <h3 className="text-lg font-semibold text-white">Genesis Identity</h3>
          <p className="text-sm text-muted-foreground text-white/50">How shall this universe be known in the multiverse index?</p>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid gap-2">
            <label htmlFor="name" className="text-sm font-medium text-white/80">Universe Name</label>
            <input
              id="name"
              type="text"
              placeholder="e.g. The Silver Spire, Void-7..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-md py-2 px-3 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              required
            />
          </div>
          <div className="grid gap-2">
            <label htmlFor="genre" className="text-sm font-medium text-white/80">Base Genre Template</label>
            <select
              id="genre"
              value={baseGenre}
              onChange={(e) => setBaseGenre(e.target.value)}
              className="flex h-10 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
            >
              <option value="fantasy" className="bg-neutral-900">High Fantasy</option>
              <option value="scifi" className="bg-neutral-900">Hard Sci-Fi</option>
              <option value="wuxia" className="bg-neutral-900">Wuxia / Cultivation</option>
              <option value="horror" className="bg-neutral-900">Cosmic Horror</option>
              <option value="cyberpunk" className="bg-neutral-900">Cyberpunk</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-xl border border-white/5 bg-black/20 overflow-hidden md:row-span-2">
          <div className="px-6 py-4 border-b border-white/10 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-400" />
            <h3 className="text-lg font-semibold text-white">Fundamental Laws</h3>
          </div>
          <div className="p-6 space-y-8">
            {AXIOM_CONFIGS.map((config) => (
              <div key={config.id} className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <config.icon className="h-4 w-4 text-cyan-400" />
                    <span className="text-sm font-medium text-white/90">{config.name}</span>
                  </div>
                  <span className="text-xs font-mono bg-white/5 px-2 py-1 rounded text-cyan-300">
                    {axioms[config.id].toFixed(2)}
                  </span>
                </div>
                <input
                  type="range"
                  min={config.min}
                  max={config.max}
                  step={config.step}
                  value={axioms[config.id]}
                  onChange={(e) => handleSliderChange(config.id, e.target.value)}
                  className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                />
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest text-white/30">
                  Dimension: {config.dimension}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-white/5 bg-black/20 overflow-hidden">
          <div className="px-6 py-4 border-b border-white/10 flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-400" />
            <h3 className="text-lg font-semibold text-white">Stability Forecast</h3>
          </div>
          <div className="p-6 space-y-6">
            <div className="text-center">
              <div className="text-6xl font-black mb-2 flex items-center justify-center gap-2 text-white">
                {stability}%
                {stability < 40 && <AlertTriangle className="h-8 w-8 text-rose-500 animate-pulse" />}
              </div>
              <p className="text-sm text-muted-foreground text-white/50">
                Estimated reality coherence at Genesis
              </p>
            </div>
            <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  stability > 70 ? 'bg-emerald-500' : stability > 40 ? 'bg-yellow-500' : 'bg-rose-500'
                }`}
                style={{ width: `${stability}%` }}
              />
            </div>
            <div className="p-4 rounded-lg bg-white/5 border border-white/10 text-xs space-y-2">
              <p className="font-semibold text-white/80 uppercase">Observer Warning:</p>
              {stability < 40 ? (
                <p className="text-rose-400">High risk of immediate heat death or vacuum decay. The universe may collapse before the first tick.</p>
              ) : stability < 70 ? (
                <p className="text-yellow-400">Moderate fluctuation expected. Anomalies will frequent this reality.</p>
              ) : (
                <p className="text-emerald-400">Optimal coherence. Stable evolution path predicted.</p>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-purple-500/30 bg-purple-500/5 hover:bg-purple-500/10 transition-colors p-6 flex flex-col justify-center gap-4">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-white">Breathe Life</h3>
            <p className="text-sm text-white/50">Commit these laws to the multiverse record.</p>
          </div>
          <button
            type="submit"
            disabled={!name || createUniverse.isPending}
            className="w-full bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold h-12 rounded-xl shadow-lg shadow-purple-500/20 transition-all active:scale-95"
          >
            {createUniverse.isPending ? (
              <div className="flex items-center justify-center">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Constituting Reality...
              </div>
            ) : (
              'INITIALIZE COSMOGENESIS'
            )}
          </button>
        </div>
      </div>
    </form>
  );
}

'use client';

import { Activity, Shield, AlertTriangle, Database } from 'lucide-react';

import GaugeCard from '@/components/ui/shared/GaugeCard';
import type { WavefunctionData, InformationalMass } from '@/types/api';

interface Props {
  wavefunction: WavefunctionData | undefined;
  informationalMass: InformationalMass | undefined;
}

function entropyTone(v: number): string {
  if (v > 0.7) return 'from-rose-500/20 to-orange-500/10 border-rose-500/20 text-rose-200';
  if (v < 0.3) return 'from-cyan-500/20 to-blue-500/10 border-cyan-500/20 text-cyan-200';
  return 'from-amber-500/20 to-yellow-500/10 border-amber-500/20 text-amber-200';
}

function stabilityTone(v: number): string {
  if (v > 0.5) return 'from-emerald-500/20 to-green-500/10 border-emerald-500/20 text-emerald-200';
  if (v < 0.3) return 'from-rose-500/20 to-red-500/10 border-rose-500/20 text-rose-200';
  return 'from-amber-500/20 to-yellow-500/10 border-amber-500/20 text-amber-200';
}

function collapseTone(v: number): string {
  if (v > 0.5) return 'from-rose-500/20 to-red-500/10 border-rose-500/20 text-rose-200';
  if (v < 0.2) return 'from-emerald-500/20 to-green-500/10 border-emerald-500/20 text-emerald-200';
  return 'from-amber-500/20 to-yellow-500/10 border-amber-500/20 text-amber-200';
}

export default function WavefunctionGauges({ wavefunction, informationalMass }: Props) {
  const wf = wavefunction?.wavefunction;

  const entropy = wf?.entropy ?? 0;
  const stability = wf?.stability_index ?? 0;
  const collapse = wf?.collapse_probability ?? 0;
  const mass = informationalMass?.informational_mass ?? 0;

  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
      <GaugeCard
        label="Entropy"
        value={entropy.toFixed(3)}
        meta={`Attractor: ${wf?.active_attractor ?? '—'}`}
        icon={Activity}
        tone={entropyTone(entropy)}
        index={0}
      />
      <GaugeCard
        label="Stability"
        value={stability.toFixed(3)}
        meta={`Density: ${(wf?.information_density ?? 0).toFixed(2)}`}
        icon={Shield}
        tone={stabilityTone(stability)}
        index={1}
      />
      <GaugeCard
        label="Collapse Probability"
        value={(collapse * 100).toFixed(1) + '%'}
        meta={collapse > 0.5 ? 'High risk' : 'Stable'}
        icon={AlertTriangle}
        tone={collapseTone(collapse)}
        index={2}
      />
      <GaugeCard
        label="Informational Mass"
        value={mass.toFixed(2)}
        meta={`Risk: ${informationalMass?.singularity_risk ?? '—'}`}
        icon={Database}
        tone="from-violet-500/20 to-purple-500/10 border-violet-500/20 text-violet-200"
        index={3}
      />
    </div>
  );
}

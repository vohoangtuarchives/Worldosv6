'use client';

import { Radio } from 'lucide-react';
import { motion } from 'framer-motion';

import { useUniverse } from '@/contexts/UniverseContext';
import {
  useWavefunction,
  useInformationalMass,
  useConsciousness,
  useAscensionFilters,
  useStateDelta,
} from '@/hooks/useWavefunction';

import WavefunctionGauges from '@/components/dashboard/wavefunction/WavefunctionGauges';
import EntropyChart from '@/components/dashboard/wavefunction/EntropyChart';
import FieldContributions from '@/components/dashboard/wavefunction/FieldContributions';
import SingularityRisk from '@/components/dashboard/wavefunction/SingularityRisk';
import AutopoiesisStatus from '@/components/dashboard/wavefunction/AutopoiesisStatus';
import AscensionFilters from '@/components/dashboard/wavefunction/AscensionFilters';

/* ── Skeleton placeholder ─────────────────────── */
function Skeleton() {
  return (
    <div className="space-y-6">
      {/* Gauge skeletons */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-36 animate-pulse rounded-[28px] border border-slate-800 bg-slate-900/50"
          />
        ))}
      </div>
      {/* Chart + sidebar skeletons */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="col-span-1 h-[380px] animate-pulse rounded-[32px] border border-slate-800 bg-slate-900/50 lg:col-span-2" />
        <div className="space-y-5">
          <div className="h-44 animate-pulse rounded-[32px] border border-slate-800 bg-slate-900/50" />
          <div className="h-44 animate-pulse rounded-[32px] border border-slate-800 bg-slate-900/50" />
        </div>
      </div>
      {/* Bottom skeletons */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="h-[340px] animate-pulse rounded-[32px] border border-slate-800 bg-slate-900/50" />
        <div className="h-[340px] animate-pulse rounded-[32px] border border-slate-800 bg-slate-900/50" />
      </div>
    </div>
  );
}

/* ── Page ──────────────────────────────────────── */
export default function WavefunctionPage() {
  const { activeUniverseId } = useUniverse();

  const { wavefunction, isLoading: wfLoading } = useWavefunction(activeUniverseId);
  const { informationalMass, isLoading: massLoading } = useInformationalMass(activeUniverseId);
  useConsciousness(activeUniverseId); // fetched for cache — used by future components
  const { ascensionFilters, isLoading: afLoading } = useAscensionFilters(activeUniverseId);
  const { delta, isLoading: deltaLoading } = useStateDelta(activeUniverseId);

  const isInitialLoad = wfLoading && massLoading && afLoading && deltaLoading;

  return (
    <div className="space-y-8">
      {/* ── Header ───────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-500/15 ring-1 ring-inset ring-violet-500/25">
          <Radio size={20} className="text-violet-300" />
        </div>
        <div>
          <h1 className="text-xl font-black tracking-tight text-white">
            Wavefunction Observatory
          </h1>
          <p className="text-xs text-slate-500">
            Quantum state monitoring &amp; ascension diagnostics
          </p>
        </div>
      </motion.div>

      {isInitialLoad ? (
        <Skeleton />
      ) : (
        <>
          {/* ── Top: Gauges ──────────────────── */}
          <WavefunctionGauges
            wavefunction={wavefunction}
            informationalMass={informationalMass}
          />

          {/* ── Middle: Chart + Risk + Auto ──── */}
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <EntropyChart wavefunction={wavefunction} delta={delta} />
            </div>
            <div className="space-y-5">
              <SingularityRisk risk={informationalMass?.singularity_risk} />
              <AutopoiesisStatus autopoiesis={wavefunction?.autopoiesis} />
            </div>
          </div>

          {/* ── Bottom: Field + Ascension ────── */}
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <FieldContributions informationalMass={informationalMass} />
            <AscensionFilters data={ascensionFilters} />
          </div>
        </>
      )}
    </div>
  );
}

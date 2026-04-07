'use client';

import { useState } from 'react';
import { Cog, Plus } from 'lucide-react';

import { useUniverse } from '@/contexts/UniverseContext';
import EmptyState from '@/components/ui/shared/EmptyState';
import TickAdvancePanel from '@/components/dashboard/simulation/TickAdvancePanel';
import UniverseStatusPanel from '@/components/dashboard/simulation/UniverseStatusPanel';
import SnapshotPanel from '@/components/dashboard/simulation/SnapshotPanel';
import ForkPanel from '@/components/dashboard/simulation/ForkPanel';
import CreateUniverseForm from '@/components/dashboard/simulation/CreateUniverseForm';

export default function SimulationPage() {
  const { activeUniverseId, isLoading } = useUniverse();
  const [showCreateModal, setShowCreateModal] = useState(false);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/10">
            <Cog size={22} className="text-cyan-400" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white">
              Simulation Control Panel
            </h1>
            <p className="text-sm text-slate-500">
              Manage tick advancement, snapshots, and universe branching
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 rounded-xl border border-cyan-500/20 bg-cyan-500/10 px-4 py-2.5 text-sm font-bold text-cyan-200 transition-all hover:bg-cyan-500/20"
        >
          <Plus size={16} />
          Create New Universe
        </button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-500/20 border-t-cyan-400" />
        </div>
      ) : !activeUniverseId ? (
        <EmptyState
          title="No universe selected"
          message="Create a universe or select one from the dashboard to begin."
        />
      ) : (
        <>
          {/* 2-Column Grid */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Left Column */}
            <div className="space-y-6">
              <TickAdvancePanel />
              <UniverseStatusPanel />
            </div>

            {/* Right Column */}
            <div>
              <SnapshotPanel />
            </div>
          </div>

          {/* Full-Width Bottom */}
          <ForkPanel />
        </>
      )}

      {/* Create Universe Modal */}
      <CreateUniverseForm
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
    </div>
  );
}

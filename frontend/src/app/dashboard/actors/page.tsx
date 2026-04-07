'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Loader2 } from 'lucide-react';

import { useUniverse } from '@/contexts/UniverseContext';
import { useActors } from '@/hooks/useActors';
import ActorGrid from '@/components/dashboard/actors/ActorGrid';
import ActorDetailModal from '@/components/dashboard/actors/ActorDetailModal';
import BadgeLabel from '@/components/ui/shared/BadgeLabel';
import EmptyState from '@/components/ui/shared/EmptyState';

export default function ActorsPage() {
  const { activeUniverseId, universes } = useUniverse();
  const { actors, isLoading } = useActors(activeUniverseId);
  const [selectedActorId, setSelectedActorId] = useState<number | null>(null);

  const activeName = universes.find((u) => u.id === activeUniverseId)?.name ?? 'Unknown';

  return (
    <div className="min-h-screen bg-[#0a0a0c] px-6 py-8">
      {/* Page header */}
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="mb-8"
      >
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-500/10">
              <Users size={20} className="text-cyan-400" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white">Actor Registry</h1>
          </div>
          {!isLoading && (
            <div className="flex items-center gap-2">
              <BadgeLabel variant="slate">{actors.length} actors</BadgeLabel>
              <BadgeLabel variant="cyan">{activeName}</BadgeLabel>
            </div>
          )}
        </div>
        <p className="mt-2 text-sm text-slate-500">
          Browse and inspect all actors in the active universe.
        </p>
      </motion.div>

      {/* Content */}
      {!activeUniverseId ? (
        <EmptyState
          icon={Users}
          title="No universe selected"
          message="Select a universe to view its actors."
        />
      ) : isLoading ? (
        <div className="flex flex-col items-center justify-center py-32">
          <Loader2 size={40} className="animate-spin text-cyan-500/40" />
          <p className="mt-4 text-sm text-slate-600">Loading actors...</p>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <ActorGrid actors={actors} onSelectActor={setSelectedActorId} />
        </motion.div>
      )}

      {/* Detail Modal */}
      <ActorDetailModal
        actorId={selectedActorId}
        open={selectedActorId !== null}
        onClose={() => setSelectedActorId(null)}
      />
    </div>
  );
}

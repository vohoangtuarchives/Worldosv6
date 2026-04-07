'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Users } from 'lucide-react';

import type { ActorSummary } from '@/types/api';
import FilterToolbar from '@/components/ui/shared/FilterToolbar';
import EmptyState from '@/components/ui/shared/EmptyState';
import ActorCard from './ActorCard';

interface ActorGridProps {
  actors: ActorSummary[];
  onSelectActor: (id: number) => void;
}

export default function ActorGrid({ actors, onSelectActor }: ActorGridProps) {
  const [search, setSearch] = useState('');
  const [archetypeFilter, setArchetypeFilter] = useState('');
  const [alignmentFilter, setAlignmentFilter] = useState('');
  const [aliveFilter, setAliveFilter] = useState('');

  // Extract unique archetype / alignment values
  const archetypeOptions = useMemo(() => {
    const unique = [...new Set(actors.map((a) => a.archetype))].sort();
    return unique.map((v) => ({ label: v, value: v }));
  }, [actors]);

  const alignmentOptions = useMemo(() => {
    const unique = [...new Set(actors.map((a) => a.alignment))].sort();
    return unique.map((v) => ({ label: v, value: v }));
  }, [actors]);

  const aliveOptions = [
    { label: 'Alive', value: 'alive' },
    { label: 'Dead', value: 'dead' },
  ];

  // Apply filters
  const filtered = useMemo(() => {
    let list = actors;

    if (search) {
      const q = search.toLowerCase();
      list = list.filter((a) => a.name.toLowerCase().includes(q));
    }
    if (archetypeFilter) {
      list = list.filter((a) => a.archetype === archetypeFilter);
    }
    if (alignmentFilter) {
      list = list.filter((a) => a.alignment === alignmentFilter);
    }
    if (aliveFilter === 'alive') {
      list = list.filter((a) => a.is_alive);
    } else if (aliveFilter === 'dead') {
      list = list.filter((a) => !a.is_alive);
    }

    return list;
  }, [actors, search, archetypeFilter, alignmentFilter, aliveFilter]);

  const containerVariants = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: 0.04,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 18 },
    show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' as const } },
  };

  return (
    <div>
      <FilterToolbar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search actors by name..."
        filters={[
          {
            label: 'Archetype',
            value: archetypeFilter,
            options: archetypeOptions,
            onChange: setArchetypeFilter,
          },
          {
            label: 'Alignment',
            value: alignmentFilter,
            options: alignmentOptions,
            onChange: setAlignmentFilter,
          },
          {
            label: 'Status',
            value: aliveFilter,
            options: aliveOptions,
            onChange: setAliveFilter,
          },
        ]}
      />

      {filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No actors found"
          message="Try adjusting your filters or search query."
        />
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        >
          {filtered.map((actor) => (
            <motion.div key={actor.id} variants={itemVariants}>
              <ActorCard
                actor={actor}
                onClick={() => onSelectActor(actor.id)}
              />
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}

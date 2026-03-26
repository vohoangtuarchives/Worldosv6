'use client';

import { useMemo, useState } from 'react';
import { useSimulationStore } from '@/store/useSimulationStore';

const NarrativeArchive = () => {
  const chronicles = useSimulationStore((state) => state.chronicles);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredChronicles = useMemo(() => {
    const normalized = searchQuery.trim().toLowerCase();
    if (!normalized) {
      return chronicles;
    }

    return chronicles.filter((chronicle) => {
      const title = chronicle.title?.toLowerCase() ?? '';
      const content = chronicle.content?.toLowerCase() ?? '';
      return title.includes(normalized) || content.includes(normalized);
    });
  }, [chronicles, searchQuery]);

  return (
    <section className="h-full rounded-[28px] border border-white/10 bg-card/45 p-4 backdrop-blur-xl">
      <p className="text-[10px] uppercase tracking-[0.28em] text-primary/70">Archive</p>
      <input
        value={searchQuery}
        onChange={(event) => setSearchQuery(event.target.value)}
        placeholder="Search chronicles"
        className="mt-3 w-full rounded-xl border border-white/8 bg-background/35 px-3 py-2 text-sm outline-none"
      />
      <div className="mt-4 space-y-3">
        {filteredChronicles.length > 0 ? (
          filteredChronicles.slice(0, 5).map((record, index) => (
            <div key={record.id ?? index} className="rounded-xl border border-white/8 bg-background/30 p-3">
              <p className="text-sm font-medium">{record.title ?? `Chronicle ${index + 1}`}</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">{record.content ?? 'No summary available.'}</p>
            </div>
          ))
        ) : (
          <p className="rounded-xl border border-dashed border-white/10 bg-background/20 p-4 text-sm text-muted-foreground">
            No archive entries match the current search.
          </p>
        )}
      </div>
    </section>
  );
};

export default NarrativeArchive;

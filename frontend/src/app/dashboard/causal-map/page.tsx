'use client';

import { useState, useCallback } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import { Map, Loader2 } from 'lucide-react';

import { useUniverse } from '@/contexts/UniverseContext';
import { useTopology } from '@/hooks/useCausalMap';
import TopologyGraph from '@/components/dashboard/causal-map/TopologyGraph';
import CausalLinkPanel from '@/components/dashboard/causal-map/CausalLinkPanel';

export default function CausalMapPage() {
  const { activeUniverseId, isLoading: isUniverseLoading } = useUniverse();
  const { topology, isLoading: isTopologyLoading } = useTopology(activeUniverseId);

  const [highlightedNodes, setHighlightedNodes] = useState<string[]>([]);
  const [isPanelOpen, setIsPanelOpen] = useState(true);

  const handleHighlight = useCallback((nodeIds: string[]) => {
    setHighlightedNodes(nodeIds);
  }, []);

  const handleTogglePanel = useCallback(() => {
    setIsPanelOpen((prev) => !prev);
  }, []);

  const isLoading = isUniverseLoading || isTopologyLoading;

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div>
          <div className="mb-1.5 flex items-center gap-2.5 text-cyan-300">
            <Map size={16} />
            <span className="text-[10px] font-black uppercase tracking-[0.35em]">
              WorldOS / Causal Map
            </span>
          </div>
          <h1 className="text-3xl font-black italic tracking-[-0.03em] text-white">
            Spatial Topology &amp; Causal Links
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Explore the spatial structure of your universe and trace causal connections between zones.
          </p>
        </div>

        {isLoading && (
          <div className="flex items-center gap-2">
            <Loader2 size={14} className="animate-spin text-cyan-400" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
              Loading topology...
            </span>
          </div>
        )}
      </div>

      {/* Main content */}
      <div className="flex flex-1 min-h-0 rounded-2xl border border-slate-800/50 bg-[#0a0a0c] overflow-hidden">
        <ReactFlowProvider>
          <TopologyGraph
            topology={topology}
            highlightedNodes={highlightedNodes}
            isPanelOpen={isPanelOpen}
            onTogglePanel={handleTogglePanel}
          />
        </ReactFlowProvider>

        {isPanelOpen && (
          <CausalLinkPanel
            universeId={activeUniverseId}
            onHighlight={handleHighlight}
          />
        )}
      </div>
    </div>
  );
}

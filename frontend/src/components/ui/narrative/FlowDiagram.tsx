'use client';

import React from 'react';

interface NodeStatus {
  status: 'idle' | 'running' | 'completed' | 'error';
  startedAt?: number;
  completedAt?: number;
}

interface FlowDiagramProps {
  nodes: Record<string, NodeStatus>;
  onNodeClick?: (nodeId: string) => void;
  selectedNode?: string;
}

// Pipeline structure from narrative-loom/graph.py
const PIPELINE_NODES = [
  // Sequential start
  { id: 'Event_Normalizer', label: 'Event Normalizer' },
  { id: 'Universe_Bridge', label: 'Universe Bridge' },
  // Parallel 1
  { id: 'Entropy_Engine', label: 'Entropy Engine', parallelGroup: 1 },
  { id: 'Style_Analyzer', label: 'Style Analyzer', parallelGroup: 1 },
  // Sequential after parallel 1
  { id: 'Attractor_Engine', label: 'Attractor Engine' },
  { id: 'Dramatic_Arc', label: 'Dramatic Arc' },
  { id: 'Phase_Engine', label: 'Phase Engine' },
  { id: 'Singularity_Engine', label: 'Singularity Engine' },
  { id: 'Chief_Editor', label: 'Chief Editor' },
  // Parallel 2
  { id: 'The_Historian', label: 'The Historian', parallelGroup: 2 },
  { id: 'The_Mythologist', label: 'The Mythologist', parallelGroup: 2 },
  // Sequential after parallel 2
  { id: 'The_Psychologist', label: 'The Psychologist' },
  { id: 'The_Director', label: 'The Director' },
  { id: 'The_Wordsmith', label: 'The Wordsmith' },
  { id: 'The_Critic', label: 'The Critic' },
  // Sequential after critic
  { id: 'VFX_Director', label: 'VFX Director' },
  { id: 'The_Archivist', label: 'The Archivist' },
  { id: 'News_Anchor', label: 'News Anchor' },
];

const FlowDiagram: React.FC<FlowDiagramProps> = ({ nodes, onNodeClick, selectedNode }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'border-violet-500 bg-violet-500/20 shadow-[0_0_12px_rgba(139,92,246,0.6)] animate-pulse';
      case 'completed':
        return 'border-emerald-500 bg-emerald-500/20 shadow-[0_0_8px_rgba(16,185,129,0.4)]';
      case 'error':
        return 'border-rose-500 bg-rose-500/20 shadow-[0_0_8px_rgba(244,63,94,0.4)]';
      default:
        return 'border-gray-700 bg-gray-800/50';
    }
  };

  const getStatusDot = (status: string) => {
    switch (status) {
      case 'running':
        return 'bg-violet-400 animate-pulse';
      case 'completed':
        return 'bg-emerald-400';
      case 'error':
        return 'bg-rose-400';
      default:
        return 'bg-gray-600';
    }
  };

  const getDuration = (node: NodeStatus) => {
    if (node.startedAt && node.completedAt) {
      return `${((node.completedAt - node.startedAt) / 1000).toFixed(2)}s`;
    }
    return null;
  };

  return (
    <div className="space-y-4">
      {/* Sequential section */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <NodeCard
            id="Event_Normalizer"
            label="Event Normalizer"
            status={nodes['Event_Normalizer']?.status || 'idle'}
            duration={getDuration(nodes['Event_Normalizer'] || {})}
            getStatusColor={getStatusColor}
            getStatusDot={getStatusDot}
            onNodeClick={onNodeClick}
            isSelected={selectedNode === 'Event_Normalizer'}
          />
          <div className="w-8 h-0.5 bg-gray-700" />
          <NodeCard
            id="Universe_Bridge"
            label="Universe Bridge"
            status={nodes['Universe_Bridge']?.status || 'idle'}
            duration={getDuration(nodes['Universe_Bridge'] || {})}
            getStatusColor={getStatusColor}
            getStatusDot={getStatusDot}
            onNodeClick={onNodeClick}
            isSelected={selectedNode === 'Universe_Bridge'}
          />
        </div>

        {/* Parallel 1 */}
        <div className="flex items-center gap-3">
          <div className="w-0.5 h-16 bg-gray-700" />
          <div className="flex flex-col gap-2">
            <NodeCard
              id="Entropy_Engine"
              label="Entropy Engine"
              status={nodes['Entropy_Engine']?.status || 'idle'}
              duration={getDuration(nodes['Entropy_Engine'] || {})}
              getStatusColor={getStatusColor}
              getStatusDot={getStatusDot}
              onNodeClick={onNodeClick}
              isSelected={selectedNode === 'Entropy_Engine'}
            />
            <NodeCard
              id="Style_Analyzer"
              label="Style Analyzer"
              status={nodes['Style_Analyzer']?.status || 'idle'}
              duration={getDuration(nodes['Style_Analyzer'] || {})}
              getStatusColor={getStatusColor}
              getStatusDot={getStatusDot}
              onNodeClick={onNodeClick}
              isSelected={selectedNode === 'Style_Analyzer'}
            />
          </div>
          <div className="w-0.5 h-16 bg-gray-700" />
        </div>

        {/* Sequential engines */}
        <div className="flex flex-wrap items-center gap-3">
          <NodeCard
            id="Attractor_Engine"
            label="Attractor Engine"
            status={nodes['Attractor_Engine']?.status || 'idle'}
            duration={getDuration(nodes['Attractor_Engine'] || {})}
            getStatusColor={getStatusColor}
            getStatusDot={getStatusDot}
            onNodeClick={onNodeClick}
            isSelected={selectedNode === 'Attractor_Engine'}
          />
          <div className="w-8 h-0.5 bg-gray-700" />
          <NodeCard
            id="Dramatic_Arc"
            label="Dramatic Arc"
            status={nodes['Dramatic_Arc']?.status || 'idle'}
            duration={getDuration(nodes['Dramatic_Arc'] || {})}
            getStatusColor={getStatusColor}
            getStatusDot={getStatusDot}
            onNodeClick={onNodeClick}
            isSelected={selectedNode === 'Dramatic_Arc'}
          />
          <div className="w-8 h-0.5 bg-gray-700" />
          <NodeCard
            id="Phase_Engine"
            label="Phase Engine"
            status={nodes['Phase_Engine']?.status || 'idle'}
            duration={getDuration(nodes['Phase_Engine'] || {})}
            getStatusColor={getStatusColor}
            getStatusDot={getStatusDot}
            onNodeClick={onNodeClick}
            isSelected={selectedNode === 'Phase_Engine'}
          />
          <div className="w-8 h-0.5 bg-gray-700" />
          <NodeCard
            id="Singularity_Engine"
            label="Singularity Engine"
            status={nodes['Singularity_Engine']?.status || 'idle'}
            duration={getDuration(nodes['Singularity_Engine'] || {})}
            getStatusColor={getStatusColor}
            getStatusDot={getStatusDot}
            onNodeClick={onNodeClick}
            isSelected={selectedNode === 'Singularity_Engine'}
          />
          <div className="w-8 h-0.5 bg-gray-700" />
          <NodeCard
            id="Chief_Editor"
            label="Chief Editor"
            status={nodes['Chief_Editor']?.status || 'idle'}
            duration={getDuration(nodes['Chief_Editor'] || {})}
            getStatusColor={getStatusColor}
            getStatusDot={getStatusDot}
            onNodeClick={onNodeClick}
            isSelected={selectedNode === 'Chief_Editor'}
          />
        </div>

        {/* Parallel 2 */}
        <div className="flex items-center gap-3">
          <div className="w-0.5 h-16 bg-gray-700" />
          <div className="flex flex-col gap-2">
            <NodeCard
              id="The_Historian"
              label="The Historian"
              status={nodes['The_Historian']?.status || 'idle'}
              duration={getDuration(nodes['The_Historian'] || {})}
              getStatusColor={getStatusColor}
              getStatusDot={getStatusDot}
              onNodeClick={onNodeClick}
              isSelected={selectedNode === 'The_Historian'}
            />
            <NodeCard
              id="The_Mythologist"
              label="The Mythologist"
              status={nodes['The_Mythologist']?.status || 'idle'}
              duration={getDuration(nodes['The_Mythologist'] || {})}
              getStatusColor={getStatusColor}
              getStatusDot={getStatusDot}
              onNodeClick={onNodeClick}
              isSelected={selectedNode === 'The_Mythologist'}
            />
          </div>
          <div className="w-0.5 h-16 bg-gray-700" />
        </div>

        {/* Sequential agents */}
        <div className="flex flex-wrap items-center gap-3">
          <NodeCard
            id="The_Psychologist"
            label="The Psychologist"
            status={nodes['The_Psychologist']?.status || 'idle'}
            duration={getDuration(nodes['The_Psychologist'] || {})}
            getStatusColor={getStatusColor}
            getStatusDot={getStatusDot}
            onNodeClick={onNodeClick}
            isSelected={selectedNode === 'The_Psychologist'}
          />
          <div className="w-8 h-0.5 bg-gray-700" />
          <NodeCard
            id="The_Director"
            label="The Director"
            status={nodes['The_Director']?.status || 'idle'}
            duration={getDuration(nodes['The_Director'] || {})}
            getStatusColor={getStatusColor}
            getStatusDot={getStatusDot}
            onNodeClick={onNodeClick}
            isSelected={selectedNode === 'The_Director'}
          />
          <div className="w-8 h-0.5 bg-gray-700" />
          <NodeCard
            id="The_Wordsmith"
            label="The Wordsmith"
            status={nodes['The_Wordsmith']?.status || 'idle'}
            duration={getDuration(nodes['The_Wordsmith'] || {})}
            getStatusColor={getStatusColor}
            getStatusDot={getStatusDot}
            onNodeClick={onNodeClick}
            isSelected={selectedNode === 'The_Wordsmith'}
          />
          <div className="w-8 h-0.5 bg-gray-700" />
          <NodeCard
            id="The_Critic"
            label="The Critic"
            status={nodes['The_Critic']?.status || 'idle'}
            duration={getDuration(nodes['The_Critic'] || {})}
            getStatusColor={getStatusColor}
            getStatusDot={getStatusDot}
            onNodeClick={onNodeClick}
            isSelected={selectedNode === 'The_Critic'}
          />
        </div>

        {/* Final sequential */}
        <div className="flex items-center gap-3">
          <NodeCard
            id="VFX_Director"
            label="VFX Director"
            status={nodes['VFX_Director']?.status || 'idle'}
            duration={getDuration(nodes['VFX_Director'] || {})}
            getStatusColor={getStatusColor}
            getStatusDot={getStatusDot}
            onNodeClick={onNodeClick}
            isSelected={selectedNode === 'VFX_Director'}
          />
          <div className="w-8 h-0.5 bg-gray-700" />
          <NodeCard
            id="The_Archivist"
            label="The Archivist"
            status={nodes['The_Archivist']?.status || 'idle'}
            duration={getDuration(nodes['The_Archivist'] || {})}
            getStatusColor={getStatusColor}
            getStatusDot={getStatusDot}
            onNodeClick={onNodeClick}
            isSelected={selectedNode === 'The_Archivist'}
          />
          <div className="w-8 h-0.5 bg-gray-700" />
          <NodeCard
            id="News_Anchor"
            label="News Anchor"
            status={nodes['News_Anchor']?.status || 'idle'}
            duration={getDuration(nodes['News_Anchor'] || {})}
            getStatusColor={getStatusColor}
            getStatusDot={getStatusDot}
            onNodeClick={onNodeClick}
            isSelected={selectedNode === 'News_Anchor'}
          />
        </div>
      </div>
    </div>
  );
};

interface NodeCardProps {
  id: string;
  label: string;
  status: 'idle' | 'running' | 'completed' | 'error';
  duration: string | null;
  getStatusColor: (status: string) => string;
  getStatusDot: (status: string) => string;
  onNodeClick?: (nodeId: string) => void;
  isSelected?: boolean;
}

const NodeCard: React.FC<NodeCardProps> = ({ id, label, status, duration, getStatusColor, getStatusDot, onNodeClick, isSelected }) => {
  return (
    <div
      className={`relative px-4 py-2 rounded-lg border cursor-pointer transition-all duration-300 ${getStatusColor(status)} ${isSelected ? 'ring-2 ring-cyan-400' : ''}`}
      onClick={() => onNodeClick?.(id)}
    >
      <div className="flex items-center gap-3">
        <div className={`w-2 h-2 rounded-full ${getStatusDot(status)}`} />
        <span className="text-xs font-medium text-gray-200">{label}</span>
        {duration && <span className="text-[10px] text-gray-400">{duration}</span>}
      </div>
    </div>
  );
};

export default FlowDiagram;

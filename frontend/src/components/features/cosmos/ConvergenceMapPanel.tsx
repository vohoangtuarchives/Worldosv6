import React, { useState, useEffect } from 'react';
import { universeApi } from '@/lib/api/universe';
import { useUniverseList } from '@/context/UniverseListContext';
import { 
  Network, 
  Trash2, 
  Plus, 
  Activity, 
  ArrowRight,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';
import type { Universe } from '@/types/simulation';

interface UniverseBridge {
  id: number;
  source_universe_id: number;
  target_universe_id: number;
  bridge_type: 'causal' | 'resonance' | 'bleed';
  resonance_level: number;
  is_active: boolean;
  convergence_score: number;
  last_synced_tick: number | null;
  target_universe: Partial<Universe> & { entropy?: number; name?: string };
}

export function ConvergenceMapPanel({ universeId }: { universeId: number }) {
  const [bridges, setBridges] = useState<UniverseBridge[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  
  // Form State
  const [targetId, setTargetId] = useState<number | ''>('');
  const [bridgeType, setBridgeType] = useState<'causal' | 'resonance' | 'bleed'>('causal');
  const [resonanceLevel, setResonanceLevel] = useState(0.5);

  const { universes, refreshUniverses } = useUniverseList();

  const fetchBridges = async () => {
    setLoading(true);
    try {
      const data = await universeApi.convergenceMap(universeId);
      setBridges(data.bridges || []);
    } catch (err) {
      console.error('Failed to fetch convergence map', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBridges();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [universeId]);

  const handleCreateBridge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetId) return;

    setCreating(true);
    try {
      await universeApi.createBridge(universeId, {
        target_universe_id: Number(targetId),
        bridge_type: bridgeType,
        resonance_level: resonanceLevel,
      });
      setTargetId('');
      fetchBridges();
    } catch (err) {
      console.error('Failed to create bridge', err);
      alert('Error creating bridge');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteBridge = async (bridgeId: number) => {
    if (!confirm('Are you sure you want to sever this connection?')) return;
    
    try {
      await universeApi.destroyBridge(universeId, bridgeId);
      fetchBridges();
    } catch (err) {
      console.error('Failed to destroy bridge', err);
    }
  };

  // Filter out the current universe from the target options
  const availableTargets = universes.filter(u => u.id !== universeId);

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 text-sm text-slate-300">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold flex items-center gap-2 text-fuchsia-400">
          <Network className="w-5 h-5" />
          Convergence Map
        </h3>
        <button 
          onClick={fetchBridges}
          className="p-1.5 hover:bg-slate-700 rounded transition-colors"
          title="Refresh Convergence Data"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Creation Form */}
      <form onSubmit={handleCreateBridge} className="bg-slate-900/50 rounded p-3 mb-6 border border-slate-700 flex flex-col gap-3">
        <h4 className="font-semibold text-slate-200">Establish New Bridge</h4>
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs uppercase text-slate-500 mb-1">Target Dimension</label>
            <select 
              value={targetId}
              onChange={e => setTargetId(e.target.value ? Number(e.target.value) : '')}
              className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1.5 focus:border-fuchsia-500 focus:outline-none"
              required
              onFocus={() => { if(universes.length === 0) refreshUniverses() }}
            >
              <option value="" disabled>Select Universe...</option>
              {availableTargets.map(u => (
                <option key={u.id} value={u.id}>[{u.id}] {u.name} (E: {u.entropy?.toFixed(2)})</option>
              ))}
            </select>
          </div>
          
          <div className="w-[150px]">
            <label className="block text-xs uppercase text-slate-500 mb-1">Bridge Type</label>
            <select 
              value={bridgeType}
              onChange={e => setBridgeType(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1.5 focus:border-fuchsia-500 focus:outline-none"
            >
              <option value="causal">Causal</option>
              <option value="resonance">Resonance</option>
              <option value="bleed">Collapse Bleed</option>
            </select>
          </div>

          <div className="w-[120px]">
            <label className="block text-xs uppercase text-slate-500 mb-1">
              Resonance ({resonanceLevel.toFixed(2)})
            </label>
            <input 
              type="range" 
              min="0" max="1" step="0.05"
              value={resonanceLevel}
              onChange={e => setResonanceLevel(Number(e.target.value))}
              className="w-full accent-fuchsia-500"
            />
          </div>

          <button 
            type="submit" 
            disabled={creating || !targetId}
            className="bg-fuchsia-600 hover:bg-fuchsia-500 text-white px-4 py-1.5 rounded flex items-center gap-2 transition-colors disabled:opacity-50"
          >
            {creating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Establish
          </button>
        </div>
      </form>

      {/* Bridges List */}
      <div>
        <h4 className="font-semibold text-slate-200 mb-3">Active Manifolds ({bridges.length})</h4>
        {bridges.length === 0 ? (
          <div className="text-center p-6 bg-slate-900/30 rounded border border-slate-700/50 text-slate-500">
            No active bridges. This universe is causally isolated.
          </div>
        ) : (
          <div className="space-y-3">
            {bridges.map(bridge => (
              <div key={bridge.id} className="bg-slate-900 border border-slate-700 rounded p-3 flex flex-col md:flex-row gap-4 items-start md:items-center">
                {/* Visual Connection */}
                <div className="flex items-center gap-3 w-full md:w-auto">
                  <div className="text-center hidden md:block">
                    <div className="text-xs text-slate-500">SOURCE</div>
                    <div className="font-mono text-fuchsia-400">[{bridge.source_universe_id}]</div>
                  </div>
                  
                  <div className="flex-1 flex flex-col items-center">
                    <span className={`text-[10px] uppercase font-bold tracking-widest ${
                      bridge.bridge_type === 'bleed' ? 'text-red-400' :
                      bridge.bridge_type === 'resonance' ? 'text-blue-400' : 'text-purple-400'
                    }`}>
                      {bridge.bridge_type}
                    </span>
                    <div className="relative w-full min-w-[100px] h-1 bg-slate-800 rounded my-1 overflow-hidden">
                      <div 
                        className={`absolute top-0 left-0 h-full ${bridge.bridge_type === 'bleed' ? 'bg-red-500' : 'bg-fuchsia-500'} opacity-50 block`}
                        style={{ width: `${bridge.resonance_level * 100}%` }}
                      />
                    </div>
                    <div className="text-[10px] text-slate-500">Resonance: {(bridge.resonance_level * 100).toFixed(0)}%</div>
                  </div>

                  <ArrowRight className="w-4 h-4 text-slate-600 hidden md:block" />

                  <div className="text-center w-full md:w-auto flex justify-between md:block items-center">
                    <div className="text-left md:text-center">
                      <div className="text-xs text-slate-500">TARGET [{bridge.target_universe_id}]</div>
                      <div className="font-bold text-slate-200 truncate max-w-[150px]" title={bridge.target_universe?.name}>
                        {bridge.target_universe?.name || 'Unknown'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Vertical Divider */}
                <div className="hidden md:block w-px h-10 bg-slate-700"></div>

                {/* Metrics */}
                <div className="flex-1 grid grid-cols-2 gap-2 text-xs w-full">
                  <div className="bg-slate-950 p-2 rounded">
                    <div className="text-slate-500 mb-0.5 whitespace-nowrap">Convergence Score</div>
                    <div className="text-lg font-mono text-emerald-400">
                      {(bridge.convergence_score * 100).toFixed(1)}%
                    </div>
                  </div>
                  <div className="bg-slate-950 p-2 rounded">
                    <div className="text-slate-500 mb-0.5">Target Entropy</div>
                    <div className="text-lg font-mono flex items-center gap-1">
                      {bridge.target_universe?.entropy !== undefined ? bridge.target_universe.entropy.toFixed(2) : '--'}
                      {bridge.target_universe?.entropy && bridge.target_universe.entropy > 0.8 && (
                        <span title="High entropy - Collapse risk">
                          <AlertTriangle className="w-4 h-4 text-red-500" />
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <button
                  onClick={() => handleDeleteBridge(bridge.id)}
                  className="p-2 hover:bg-red-900/30 text-slate-500 hover:text-red-400 rounded transition-colors"
                  title="Sever Connection"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

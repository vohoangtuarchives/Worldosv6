'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Crown, Gem, ImageIcon, Music, Send, Loader2, Sparkles, 
  User, Package, Palette, Headphones, Copy, Download 
} from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';

const tabs = [
  { id: 'celebrity', label: 'Celebrity', icon: Crown },
  { id: 'artifact', label: 'Artifact', icon: Gem },
  { id: 'visual', label: 'Visual Asset', icon: ImageIcon },
  { id: 'audio', label: 'Soundtrack', icon: Music },
];

export default function AssetForgeTab() {
  const [activeTab, setActiveTab] = useState('celebrity');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  // Celebrity form
  const [celebrityData, setCelebrityData] = useState({
    agent_id: '',
    zone_id: '',
    fame: 50,
    vocation: 'warrior',
    world_era: 'genesis'
  });

  // Artifact form
  const [artifactData, setArtifactData] = useState({
    artifact_id: '',
    zone_id: '',
    mass: 10,
    knowledge: '',
    world_era: 'genesis'
  });

  // Visual form
  const [visualData, setVisualData] = useState({
    prompt: '',
    is_portrait: true
  });

  // Audio form
  const [audioData, setAudioData] = useState({
    epoch_name: '',
    core_theme: ''
  });

  const vocations = ['warrior', 'diplomat', 'scholar', 'merchant', 'mystic', 'ruler', 'explorer'];
  const eras = ['genesis', 'paleolithic', 'medieval', 'industrial', 'cyberpunk', 'space_age'];

  const generateAsset = async () => {
    setLoading(true);
    setResult(null);

    try {
      let endpoint = '';
      let payload = {};

      switch (activeTab) {
        case 'celebrity':
          endpoint = '/weave-celebrity';
          payload = celebrityData;
          break;
        case 'artifact':
          endpoint = '/forge-artifact';
          payload = artifactData;
          break;
        case 'visual':
          endpoint = '/paint-asset';
          payload = visualData;
          break;
        case 'audio':
          endpoint = '/compose-track';
          payload = audioData;
          break;
      }

      const response = await api.post(endpoint, payload);
      setResult(response.data);
      toast.success(`${activeTab} generated successfully`);
    } catch (error) {
      toast.error(`Failed to generate ${activeTab}`);
    } finally {
      setLoading(false);
    }
  };

  const renderForm = () => {
    switch (activeTab) {
      case 'celebrity':
        return (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] uppercase text-gray-500 mb-1 block">Agent ID</label>
                <input
                  type="text"
                  value={celebrityData.agent_id}
                  onChange={(e) => setCelebrityData({ ...celebrityData, agent_id: e.target.value })}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm"
                  placeholder="e.g. hero_001"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase text-gray-500 mb-1 block">Zone ID</label>
                <input
                  type="text"
                  value={celebrityData.zone_id}
                  onChange={(e) => setCelebrityData({ ...celebrityData, zone_id: e.target.value })}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm"
                  placeholder="e.g. zone_alpha"
                />
              </div>
            </div>
            <div>
              <label className="text-[10px] uppercase text-gray-500 mb-1 block">Vocation</label>
              <select
                value={celebrityData.vocation}
                onChange={(e) => setCelebrityData({ ...celebrityData, vocation: e.target.value })}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm"
              >
                {vocations.map(v => (
                  <option key={v} value={v}>{v.charAt(0).toUpperCase() + v.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] uppercase text-gray-500 mb-1 block">Fame Level (0-100)</label>
              <input
                type="range"
                min="0"
                max="100"
                value={celebrityData.fame}
                onChange={(e) => setCelebrityData({ ...celebrityData, fame: parseInt(e.target.value) })}
                className="w-full h-1 bg-gray-800 rounded-full appearance-none cursor-pointer accent-violet-500"
              />
              <p className="text-xs text-gray-500 mt-1">{celebrityData.fame} / 100</p>
            </div>
          </div>
        );

      case 'artifact':
        return (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] uppercase text-gray-500 mb-1 block">Artifact ID</label>
                <input
                  type="text"
                  value={artifactData.artifact_id}
                  onChange={(e) => setArtifactData({ ...artifactData, artifact_id: e.target.value })}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm"
                  placeholder="e.g. sword_excalibur"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase text-gray-500 mb-1 block">Zone ID</label>
                <input
                  type="text"
                  value={artifactData.zone_id}
                  onChange={(e) => setArtifactData({ ...artifactData, zone_id: e.target.value })}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm"
                  placeholder="e.g. ancient_ruins"
                />
              </div>
            </div>
            <div>
              <label className="text-[10px] uppercase text-gray-500 mb-1 block">Mass</label>
              <input
                type="number"
                value={artifactData.mass}
                onChange={(e) => setArtifactData({ ...artifactData, mass: parseInt(e.target.value) })}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase text-gray-500 mb-1 block">Knowledge / Lore Context</label>
              <textarea
                value={artifactData.knowledge}
                onChange={(e) => setArtifactData({ ...artifactData, knowledge: e.target.value })}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm h-20 resize-none"
                placeholder="What is known about this artifact..."
              />
            </div>
          </div>
        );

      case 'visual':
        return (
          <div className="space-y-3">
            <div>
              <label className="text-[10px] uppercase text-gray-500 mb-1 block">Image Prompt</label>
              <textarea
                value={visualData.prompt}
                onChange={(e) => setVisualData({ ...visualData, prompt: e.target.value })}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm h-32 resize-none"
                placeholder="Describe the image you want to generate..."
              />
            </div>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="is_portrait"
                checked={visualData.is_portrait}
                onChange={(e) => setVisualData({ ...visualData, is_portrait: e.target.checked })}
                className="w-4 h-4 rounded border-gray-700 bg-white/5 accent-violet-500"
              />
              <label htmlFor="is_portrait" className="text-sm text-gray-300">Portrait mode (character)</label>
            </div>
          </div>
        );

      case 'audio':
        return (
          <div className="space-y-3">
            <div>
              <label className="text-[10px] uppercase text-gray-500 mb-1 block">Epoch Name</label>
              <input
                type="text"
                value={audioData.epoch_name}
                onChange={(e) => setAudioData({ ...audioData, epoch_name: e.target.value })}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm"
                placeholder="e.g. The Golden Age"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase text-gray-500 mb-1 block">Core Theme</label>
              <input
                type="text"
                value={audioData.core_theme}
                onChange={(e) => setAudioData({ ...audioData, core_theme: e.target.value })}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm"
                placeholder="e.g. war, peace, mystery, discovery"
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const renderResult = () => {
    if (!result) return null;

    switch (activeTab) {
      case 'celebrity':
        return (
          <div className="space-y-4">
            <div className="p-4 bg-violet-500/10 border border-violet-500/20 rounded-lg">
              <p className="text-[10px] uppercase text-violet-400 mb-1">Name</p>
              <p className="text-xl font-bold text-white">{result.name}</p>
            </div>
            <div className="p-4 bg-black/40 rounded-lg">
              <p className="text-[10px] uppercase text-gray-500 mb-2 flex items-center gap-1">
                <User className="w-3 h-3" />
                Biography
              </p>
              <p className="text-sm text-gray-300 leading-relaxed">{result.biography}</p>
            </div>
          </div>
        );

      case 'artifact':
        return (
          <div className="space-y-4">
            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
              <p className="text-[10px] uppercase text-amber-400 mb-1">Artifact Name</p>
              <p className="text-xl font-bold text-white">{result.name}</p>
            </div>
            <div className="p-4 bg-black/40 rounded-lg">
              <p className="text-[10px] uppercase text-gray-500 mb-2 flex items-center gap-1">
                <Gem className="w-3 h-3" />
                Lore
              </p>
              <p className="text-sm text-gray-300 leading-relaxed">{result.lore}</p>
            </div>
          </div>
        );

      case 'visual':
        return (
          <div className="space-y-4">
            {result.image_url ? (
              <div className="space-y-3">
                <div className="relative aspect-square rounded-xl overflow-hidden border border-white/10">
                  <img 
                    src={result.image_url} 
                    alt="Generated" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex gap-2">
                  <a 
                    href={result.image_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm text-gray-300 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    View Full Size
                  </a>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(result.image_url);
                      toast.success('URL copied');
                    }}
                    className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-gray-300 transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-lg">
                <p className="text-sm text-rose-400">Image generation failed</p>
              </div>
            )}
          </div>
        );

      case 'audio':
        return (
          <div className="space-y-4">
            <div className="p-4 bg-cyan-500/10 border border-cyan-500/20 rounded-lg">
              <p className="text-[10px] uppercase text-cyan-400 mb-1">Track</p>
              <p className="text-lg font-bold text-white">{result.epoch_name}</p>
              <p className="text-sm text-gray-400 mt-1">Style: {result.style}</p>
            </div>
            {result.stream_url && (
              <div className="p-4 bg-black/40 rounded-lg">
                <p className="text-[10px] uppercase text-gray-500 mb-3">Preview</p>
                <audio controls className="w-full">
                  <source src={result.stream_url} type="audio/mpeg" />
                </audio>
                <a 
                  href={result.stream_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 flex items-center gap-2 text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  <Headphones className="w-4 h-4" />
                  Open in new tab
                </a>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left: Form */}
      <div className="space-y-4">
        {/* Sub-tabs */}
        <div className="flex flex-wrap gap-2 p-1 bg-white/5 border border-white/10 rounded-xl">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-white/10 text-white'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                <Icon className="w-3 h-3" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="p-4 bg-black/40 border border-white/10 rounded-xl">
          <h3 className="text-xs uppercase tracking-widest text-gray-500 mb-4">
            {tabs.find(t => t.id === activeTab)?.label} Configuration
          </h3>
          {renderForm()}
        </div>

        <button
          onClick={generateAsset}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-500/20 to-fuchsia-500/20 text-white border border-violet-500/30 rounded-xl font-medium hover:from-violet-500/30 hover:to-fuchsia-500/30 transition-all disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Forging...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Generate {tabs.find(t => t.id === activeTab)?.label}
            </>
          )}
        </button>
      </div>

      {/* Right: Result */}
      <div>
        {result ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-6 bg-black/40 border border-white/10 rounded-xl"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
                {React.createElement(tabs.find(t => t.id === activeTab)?.icon || Sparkles, { className: 'w-5 h-5 text-white' })}
              </div>
              <div>
                <h3 className="font-semibold text-white">{tabs.find(t => t.id === activeTab)?.label} Generated</h3>
                <p className="text-xs text-gray-500">Ready to use</p>
              </div>
            </div>
            {renderResult()}
          </motion.div>
        ) : (
          <div className="h-full min-h-[400px] flex items-center justify-center border border-dashed border-gray-800 rounded-xl">
            <div className="text-center">
              <Palette className="w-12 h-12 text-gray-700 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No assets generated yet</p>
              <p className="text-gray-600 text-xs mt-1">Configure and click Generate</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

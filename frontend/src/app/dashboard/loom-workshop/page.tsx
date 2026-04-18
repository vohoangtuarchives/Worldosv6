'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  PenTool, 
  UserCircle, 
  Scroll, 
  Hammer, 
  Activity,
  Sparkles
} from 'lucide-react';
import ChronicleTab from './sections/ChronicleTab';
import ActorIntentTab from './sections/ActorIntentTab';
import ScribeTab from './sections/ScribeTab';
import AssetForgeTab from './sections/AssetForgeTab';
import SystemTab from './sections/SystemTab';

const tabs = [
  { id: 'chronicle', label: 'Chronicle Weaver', icon: PenTool },
  { id: 'actor', label: 'Actor Intent', icon: UserCircle },
  { id: 'scribe', label: 'History Scribe', icon: Scroll },
  { id: 'forge', label: 'Asset Forge', icon: Hammer },
  { id: 'system', label: 'System Health', icon: Activity },
];

export default function LoomWorkshopPage() {
  const [activeTab, setActiveTab] = useState('chronicle');

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white p-6">
      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              Loom Workshop
            </h1>
            <p className="text-xs text-gray-500 uppercase tracking-widest">
              NarrativeLoom Control Center
            </p>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <nav className="flex flex-wrap gap-2 mb-8 p-2 bg-white/5 border border-white/10 rounded-xl">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </nav>

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {activeTab === 'chronicle' && <ChronicleTab />}
        {activeTab === 'actor' && <ActorIntentTab />}
        {activeTab === 'scribe' && <ScribeTab />}
        {activeTab === 'forge' && <AssetForgeTab />}
        {activeTab === 'system' && <SystemTab />}
      </motion.div>
    </div>
  );
}

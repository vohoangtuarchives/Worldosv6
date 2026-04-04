'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
    Plus, 
    RefreshCcw, 
    Database, 
    ShieldCheck
} from 'lucide-react';
import { useKeyPool, AiKey, AiKeyPayload } from '@/hooks/useKeyPool';
import StatsOverview from '@/components/ui/key-pool/StatsOverview';
import KeyTable from '@/components/ui/key-pool/KeyTable';
import KeyForm from '@/components/ui/key-pool/KeyForm';
import { toast } from 'sonner';

export default function KeyPoolPage() {
    const { 
        keys, 
        isLoading, 
        addKey, 
        updateKey, 
        deleteKey 
    } = useKeyPool();

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingKey, setEditingKey] = useState<AiKey | null>(null);

    const handleAddClick = () => {
        setEditingKey(null);
        setIsFormOpen(true);
    };

    const handleEditClick = (key: AiKey) => {
        setEditingKey(key);
        setIsFormOpen(true);
    };

    const handleDeleteClick = async (id: number) => {
        if (confirm('Are you sure you want to decommission this intelligence asset?')) {
            try {
                await deleteKey(id);
                toast.success('Asset successfully decommissioned.');
            } catch {
                // Error handled by api interceptor
            }
        }
    };

    const handleFormSubmit = async (data: AiKeyPayload) => {
        try {
            if (editingKey) {
                await updateKey({ id: editingKey.id, data });
                toast.success('Intelligence asset parameters updated.');
            } else {
                const key = data.key;
                if (!key) {
                    throw new Error('API key is required when creating a new pool entry.');
                }

                await addKey({ ...data, key });
                toast.success('New intelligence asset initialized.');
            }
        } catch (error) {
            throw error;
        }
    };

    return (
        <div className="max-w-7xl mx-auto">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
                <div>
                    <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-3 text-cyan-400 mb-2"
                    >
                        <Database size={18} />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Infrastructure / Configuration</span>
                    </motion.div>
                    <h1 className="text-4xl font-black text-white tracking-tight">Intelligence Key Pool</h1>
                    <p className="text-slate-500 mt-2 font-medium">Manage and rotate API keys for civilizational simulation models.</p>
                </div>

                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => window.location.reload()}
                        className="p-3 rounded-2xl bg-slate-800/50 border border-slate-700/50 text-slate-400 hover:text-white transition-all"
                    >
                        <RefreshCcw size={20} />
                    </button>
                    <button 
                        onClick={handleAddClick}
                        className="flex items-center gap-2 px-6 py-3 bg-white text-black font-black rounded-2xl hover:bg-cyan-400 transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                    >
                        <Plus size={20} />
                        Initialize New Asset
                    </button>
                </div>
            </div>

            {/* Stats Overview */}
            <StatsOverview keys={keys} />

            {/* Main Content Area */}
            <div className="relative">
                {isLoading && (
                    <div className="absolute inset-0 bg-[#0a0a0c]/50 backdrop-blur-sm z-10 flex items-center justify-center rounded-3xl border border-slate-800/50">
                        <div className="flex flex-col items-center gap-4">
                            <div className="w-12 h-12 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin" />
                            <p className="text-xs font-bold text-cyan-400 uppercase tracking-widest animate-pulse">Synchronizing Pool...</p>
                        </div>
                    </div>
                )}
                
                <KeyTable 
                    keys={keys} 
                    onEdit={handleEditClick} 
                    onDelete={handleDeleteClick} 
                />
            </div>

            {/* Form Modal */}
            <KeyForm 
                key={editingKey ? `edit-${editingKey.id}` : isFormOpen ? 'new-open' : 'new-closed'}
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                onSubmit={handleFormSubmit}
                initialData={editingKey}
            />

            {/* Floating Info */}
            <div className="mt-12 p-8 rounded-3xl bg-emerald-500/5 border border-emerald-500/10 flex flex-col md:flex-row items-center gap-6">
                <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 shrink-0">
                    <ShieldCheck size={32} />
                </div>
                <div>
                    <h4 className="text-lg font-black text-white mb-1">Automated Failover & Cooldown</h4>
                    <p className="text-sm text-slate-400 leading-relaxed font-normal">
                        The WorldOS Intelligence Engine monitors all API calls in real-time. If an asset reaches its threshold or encounters a 429 Status, 
                        the pool will automatically rotate to the next available Tier/Level asset and place the previous one in Cooldown mode.
                    </p>
                </div>
            </div>
        </div>
    );
}

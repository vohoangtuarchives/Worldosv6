'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
    Plus,
    RefreshCcw,
    Settings,
    Cpu,
    Brain,
    Save,
    Download,
    Upload,
    Trash2
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface AiSetting {
    id: number;
    key: string;
    value: {
        provider: string;
        model: string;
        tier?: string;
    };
    group: string;
    description: string;
    created_at: string;
    updated_at: string;
}

interface AiProviderModel {
    id: number;
    provider: string;
    model_name: string;
    display_name: string;
    is_active: boolean;
    metadata: {
        tier?: string;
        context_length?: number;
    };
    created_at: string;
    updated_at: string;
}

async function fetchAiSettings(): Promise<AiSetting[]> {
    const response = await fetch('/api/ai-settings');
    if (!response.ok) throw new Error('Failed to fetch AI settings');
    return response.json();
}

async function fetchLoomAgents(): Promise<AiSetting[]> {
    const response = await fetch('/api/ai-settings/loom-agents');
    if (!response.ok) throw new Error('Failed to fetch Loom agents');
    return response.json();
}

async function fetchProviderModels(): Promise<AiProviderModel[]> {
    const response = await fetch('/api/ai-provider-models');
    if (!response.ok) throw new Error('Failed to fetch provider models');
    return response.json();
}

async function updateAiSetting(key: string, value: any): Promise<void> {
    const response = await fetch('/api/ai-settings/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value }),
    });
    if (!response.ok) throw new Error('Failed to update AI setting');
}

async function createProviderModel(data: Partial<AiProviderModel>): Promise<AiProviderModel> {
    const response = await fetch('/api/ai-provider-models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create provider model');
    return response.json();
}

async function updateProviderModel(id: number, data: Partial<AiProviderModel>): Promise<AiProviderModel> {
    const response = await fetch(`/api/ai-provider-models/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update provider model');
    return response.json();
}

async function deleteProviderModel(id: number): Promise<void> {
    const response = await fetch(`/api/ai-provider-models/${id}`, {
        method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete provider model');
}

async function exportProviderModels(): Promise<any> {
    const response = await fetch('/api/ai-provider-models/export');
    if (!response.ok) throw new Error('Failed to export provider models');
    return response.json();
}

async function importProviderModels(data: any): Promise<void> {
    const response = await fetch('/api/ai-provider-models/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to import provider models');
}

export default function AiSettingsPage() {
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState<'features' | 'loom-agents' | 'provider-models'>('loom-agents');
    const [editing, setEditing] = useState<{ key: string; value: any } | null>(null);
    const [editingProviderModel, setEditingProviderModel] = useState<Partial<AiProviderModel> | null>(null);

    const { data: features, isLoading: featuresLoading } = useQuery({
        queryKey: ['ai-settings'],
        queryFn: fetchAiSettings,
    });

    const { data: loomAgents, isLoading: loomAgentsLoading } = useQuery({
        queryKey: ['ai-settings-loom-agents'],
        queryFn: fetchLoomAgents,
    });

    const { data: providerModels, isLoading: providerModelsLoading } = useQuery({
        queryKey: ['ai-provider-models'],
        queryFn: fetchProviderModels,
    });

    const updateMutation = useMutation({
        mutationFn: ({ key, value }: { key: string; value: any }) => updateAiSetting(key, value),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['ai-settings'] });
            queryClient.invalidateQueries({ queryKey: ['ai-settings-loom-agents'] });
            toast.success('AI setting updated successfully');
            setEditing(null);
        },
        onError: (error) => {
            toast.error('Failed to update AI setting');
            console.error(error);
        },
    });

    const createProviderModelMutation = useMutation({
        mutationFn: createProviderModel,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['ai-provider-models'] });
            toast.success('Provider model created successfully');
            setEditingProviderModel(null);
        },
        onError: (error) => {
            toast.error('Failed to create provider model');
            console.error(error);
        },
    });

    const updateProviderModelMutation = useMutation({
        mutationFn: ({ id, data }: { id: number; data: Partial<AiProviderModel> }) => updateProviderModel(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['ai-provider-models'] });
            toast.success('Provider model updated successfully');
            setEditingProviderModel(null);
        },
        onError: (error) => {
            toast.error('Failed to update provider model');
            console.error(error);
        },
    });

    const deleteProviderModelMutation = useMutation({
        mutationFn: deleteProviderModel,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['ai-provider-models'] });
            toast.success('Provider model deleted successfully');
        },
        onError: (error) => {
            toast.error('Failed to delete provider model');
            console.error(error);
        },
    });

    const exportMutation = useMutation({
        mutationFn: exportProviderModels,
        onSuccess: (data) => {
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'provider-models.json';
            a.click();
            URL.revokeObjectURL(url);
            toast.success('Provider models exported successfully');
        },
        onError: (error) => {
            toast.error('Failed to export provider models');
            console.error(error);
        },
    });

    const importMutation = useMutation({
        mutationFn: importProviderModels,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['ai-provider-models'] });
            toast.success('Provider models imported successfully');
        },
        onError: (error) => {
            toast.error('Failed to import provider models');
            console.error(error);
        },
    });

    const handleSave = () => {
        if (editing) {
            updateMutation.mutate({ key: editing.key, value: editing.value });
        }
    };

    const handleEdit = (setting: AiSetting) => {
        setEditing({ key: setting.key, value: setting.value });
    };

    const handleValueChange = (field: string, newValue: string) => {
        if (editing) {
            setEditing({
                ...editing,
                value: { ...editing.value, [field]: newValue }
            });
        }
    };

    const handleProviderModelSave = () => {
        if (editingProviderModel) {
            if (editingProviderModel.id) {
                updateProviderModelMutation.mutate({ id: editingProviderModel.id, data: editingProviderModel });
            } else {
                createProviderModelMutation.mutate(editingProviderModel);
            }
        }
    };

    const handleProviderModelEdit = (model: AiProviderModel) => {
        setEditingProviderModel(model);
    };

    const handleProviderModelDelete = (id: number) => {
        if (confirm('Are you sure you want to delete this provider model?')) {
            deleteProviderModelMutation.mutate(id);
        }
    };

    const handleExport = () => {
        exportMutation.mutate();
    };

    const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target?.result as string);
                    importMutation.mutate(data);
                } catch (error) {
                    toast.error('Failed to parse JSON file');
                    console.error(error);
                }
            };
            reader.readAsText(file);
        }
    };

    const currentData = activeTab === 'features' ? features : activeTab === 'provider-models' ? providerModels : loomAgents;
    const isLoading = activeTab === 'features' ? featuresLoading : activeTab === 'provider-models' ? providerModelsLoading : loomAgentsLoading;

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
                        <Settings size={18} />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Infrastructure / Configuration</span>
                    </motion.div>
                    <h1 className="text-4xl font-black text-white tracking-tight">AI Settings</h1>
                    <p className="text-slate-500 mt-2 font-medium">Configure AI providers and models for features and Loom agents.</p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => queryClient.invalidateQueries({ queryKey: activeTab === 'features' ? ['ai-settings'] : ['ai-settings-loom-agents'] })}
                        className="p-3 rounded-2xl bg-slate-800/50 border border-slate-700/50 text-slate-400 hover:text-white transition-all"
                    >
                        <RefreshCcw size={20} />
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-8">
                <button
                    onClick={() => setActiveTab('loom-agents')}
                    className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black transition-all ${
                        activeTab === 'loom-agents'
                            ? 'bg-white text-black'
                            : 'bg-slate-800/50 text-slate-400 hover:text-white border border-slate-700/50'
                    }`}
                >
                    <Brain size={20} />
                    Loom Agents
                </button>
                <button
                    onClick={() => setActiveTab('features')}
                    className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black transition-all ${
                        activeTab === 'features'
                            ? 'bg-white text-black'
                            : 'bg-slate-800/50 text-slate-400 hover:text-white border border-slate-700/50'
                    }`}
                >
                    <Cpu size={20} />
                    Features
                </button>
                <button
                    onClick={() => setActiveTab('provider-models')}
                    className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black transition-all ${
                        activeTab === 'provider-models'
                            ? 'bg-white text-black'
                            : 'bg-slate-800/50 text-slate-400 hover:text-white border border-slate-700/50'
                    }`}
                >
                    <Settings size={20} />
                    Provider Models
                </button>
            </div>

            {/* Content */}
            <div className="relative">
                {isLoading && (
                    <div className="absolute inset-0 bg-[#0a0a0c]/50 backdrop-blur-sm z-10 flex items-center justify-center rounded-3xl border border-slate-800/50">
                        <div className="flex flex-col items-center gap-4">
                            <div className="w-12 h-12 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin" />
                            <p className="text-xs font-bold text-cyan-400 uppercase tracking-widest animate-pulse">Loading...</p>
                        </div>
                    </div>
                )}

                {activeTab === 'provider-models' ? (
                    <div className="space-y-4">
                        {/* Header with actions */}
                        <div className="flex items-center justify-between mb-6">
                            <button
                                onClick={() => setEditingProviderModel({ provider: 'openai', is_active: true })}
                                className="flex items-center gap-2 px-4 py-2 bg-cyan-500 text-white font-bold rounded-xl hover:bg-cyan-400 transition-all"
                            >
                                <Plus size={16} />
                                Add Model
                            </button>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handleExport}
                                    disabled={exportMutation.isPending}
                                    className="flex items-center gap-2 px-4 py-2 bg-slate-700/50 text-white font-bold rounded-xl hover:bg-slate-600 transition-all disabled:opacity-50"
                                >
                                    <Download size={16} />
                                    Export
                                </button>
                                <label className="flex items-center gap-2 px-4 py-2 bg-slate-700/50 text-white font-bold rounded-xl hover:bg-slate-600 transition-all cursor-pointer">
                                    <Upload size={16} />
                                    Import
                                    <input
                                        type="file"
                                        accept=".json"
                                        onChange={handleImport}
                                        className="hidden"
                                    />
                                </label>
                            </div>
                        </div>

                        {/* Add/Edit Form */}
                        {editingProviderModel && (
                            <div className="p-6 rounded-3xl bg-cyan-500/10 border border-cyan-500/30">
                                <h3 className="text-lg font-black text-white mb-4">
                                    {editingProviderModel.id ? 'Edit' : 'Add'} Provider Model
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Provider</label>
                                        <select
                                            value={editingProviderModel.provider || ''}
                                            onChange={(e) => setEditingProviderModel({ ...editingProviderModel, provider: e.target.value })}
                                            className="w-full px-4 py-3 rounded-xl bg-slate-900/50 border border-slate-700/50 text-white font-medium focus:outline-none focus:border-cyan-500"
                                        >
                                            <option value="openai">OpenAI</option>
                                            <option value="openrouter">OpenRouter</option>
                                            <option value="google">Google</option>
                                            <option value="anthropic">Anthropic</option>
                                            <option value="local">Local</option>
                                            <option value="zai">Zai</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Model Name</label>
                                        <input
                                            type="text"
                                            value={editingProviderModel.model_name || ''}
                                            onChange={(e) => setEditingProviderModel({ ...editingProviderModel, model_name: e.target.value })}
                                            className="w-full px-4 py-3 rounded-xl bg-slate-900/50 border border-slate-700/50 text-white font-medium focus:outline-none focus:border-cyan-500"
                                            placeholder="e.g., gpt-4o"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Display Name</label>
                                        <input
                                            type="text"
                                            value={editingProviderModel.display_name || ''}
                                            onChange={(e) => setEditingProviderModel({ ...editingProviderModel, display_name: e.target.value })}
                                            className="w-full px-4 py-3 rounded-xl bg-slate-900/50 border border-slate-700/50 text-white font-medium focus:outline-none focus:border-cyan-500"
                                            placeholder="e.g., GPT-4o"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Tier</label>
                                        <select
                                            value={editingProviderModel.metadata?.tier || ''}
                                            onChange={(e) => setEditingProviderModel({
                                                ...editingProviderModel,
                                                metadata: { ...editingProviderModel.metadata, tier: e.target.value }
                                            })}
                                            className="w-full px-4 py-3 rounded-xl bg-slate-900/50 border border-slate-700/50 text-white font-medium focus:outline-none focus:border-cyan-500"
                                        >
                                            <option value="">Select tier</option>
                                            <option value="pro">Pro</option>
                                            <option value="mini">Mini</option>
                                            <option value="free">Free</option>
                                        </select>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            id="is_active"
                                            checked={editingProviderModel.is_active ?? true}
                                            onChange={(e) => setEditingProviderModel({ ...editingProviderModel, is_active: e.target.checked })}
                                            className="w-4 h-4 rounded bg-slate-700 border-slate-600 text-cyan-500 focus:ring-cyan-500"
                                        />
                                        <label htmlFor="is_active" className="text-sm text-white">Active</label>
                                    </div>
                                </div>
                                <div className="flex gap-3 mt-4">
                                    <button
                                        onClick={handleProviderModelSave}
                                        disabled={createProviderModelMutation.isPending || updateProviderModelMutation.isPending}
                                        className="flex items-center gap-2 px-4 py-2 bg-cyan-500 text-white font-bold rounded-xl hover:bg-cyan-400 transition-all disabled:opacity-50"
                                    >
                                        <Save size={16} />
                                        Save
                                    </button>
                                    <button
                                        onClick={() => setEditingProviderModel(null)}
                                        className="px-4 py-2 bg-slate-700/50 text-white font-bold rounded-xl hover:bg-slate-600 transition-all"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Provider Models List */}
                        {providerModels?.map((model) => (
                            <div
                                key={model.id}
                                className="p-6 rounded-3xl bg-slate-800/50 border border-slate-700/50 hover:border-slate-600 transition-all"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="text-lg font-black text-white">{model.display_name}</h3>
                                            <span className="px-3 py-1 text-xs font-bold uppercase rounded-full bg-slate-700/50 text-slate-400">
                                                {model.provider}
                                            </span>
                                            {model.is_active ? (
                                                <span className="px-3 py-1 text-xs font-bold uppercase rounded-full bg-green-500/20 text-green-400">
                                                    Active
                                                </span>
                                            ) : (
                                                <span className="px-3 py-1 text-xs font-bold uppercase rounded-full bg-red-500/20 text-red-400">
                                                    Inactive
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-slate-400 mb-2">Model: {model.model_name}</p>
                                        {model.metadata?.tier && (
                                            <p className="text-sm text-slate-400">Tier: {model.metadata.tier}</p>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleProviderModelEdit(model)}
                                            className="p-2 rounded-xl bg-slate-700/50 text-slate-400 hover:text-white hover:bg-slate-600 transition-all"
                                        >
                                            <Settings size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleProviderModelDelete(model.id)}
                                            className="p-2 rounded-xl bg-red-500/20 text-red-400 hover:text-white hover:bg-red-500/40 transition-all"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="space-y-4">
                        {(currentData as AiSetting[])?.map((setting) => (
                            <div
                                key={setting.id}
                                className={`p-6 rounded-3xl border transition-all ${
                                    editing?.key === setting.key
                                        ? 'bg-cyan-500/10 border-cyan-500/30'
                                        : 'bg-slate-800/50 border-slate-700/50 hover:border-slate-600'
                                }`}
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="text-lg font-black text-white">
                                                {setting.key.replace('loom_agents.', '').replace('features.', '')}
                                            </h3>
                                            <span className="px-3 py-1 text-xs font-bold uppercase rounded-full bg-slate-700/50 text-slate-400">
                                                {setting.group}
                                            </span>
                                        </div>
                                        <p className="text-sm text-slate-400 mb-4">{setting.description}</p>

                                        {editing?.key === setting.key ? (
                                            <div className="space-y-3">
                                                <div>
                                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Provider</label>
                                                    <select
                                                        value={editing?.value.provider || ''}
                                                        onChange={(e) => {
                                                            handleValueChange('provider', e.target.value);
                                                            // Reset model when provider changes
                                                            const firstModelForProvider = providerModels?.find(m => m.provider === e.target.value);
                                                            if (firstModelForProvider) {
                                                                handleValueChange('model', firstModelForProvider.model_name);
                                                            }
                                                        }}
                                                        className="w-full px-4 py-3 rounded-xl bg-slate-900/50 border border-slate-700/50 text-white font-medium focus:outline-none focus:border-cyan-500"
                                                    >
                                                        <option value="">Select provider</option>
                                                        <option value="openai">OpenAI</option>
                                                        <option value="openrouter">OpenRouter</option>
                                                        <option value="google">Google</option>
                                                        <option value="anthropic">Anthropic</option>
                                                        <option value="local">Local</option>
                                                        <option value="zai">Zai</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Model</label>
                                                    <select
                                                        value={editing?.value.model || ''}
                                                        onChange={(e) => handleValueChange('model', e.target.value)}
                                                        className="w-full px-4 py-3 rounded-xl bg-slate-900/50 border border-slate-700/50 text-white font-medium focus:outline-none focus:border-cyan-500"
                                                        disabled={!editing?.value.provider}
                                                    >
                                                        <option value="">Select model</option>
                                                        {providerModels
                                                            ?.filter(m => m.provider === editing?.value.provider && m.is_active)
                                                            .map(m => (
                                                                <option key={m.id} value={m.model_name}>
                                                                    {m.display_name}
                                                                </option>
                                                            ))}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Tier (optional)</label>
                                                    <select
                                                        value={editing.value.tier || ''}
                                                        onChange={(e) => handleValueChange('tier', e.target.value)}
                                                        className="w-full px-4 py-3 rounded-xl bg-slate-900/50 border border-slate-700/50 text-white font-medium focus:outline-none focus:border-cyan-500"
                                                    >
                                                        <option value="">Select tier</option>
                                                        <option value="pro">Pro</option>
                                                        <option value="mini">Mini</option>
                                                        <option value="free">Free</option>
                                                    </select>
                                                </div>
                                                <div className="flex gap-3 mt-4">
                                                    <button
                                                        onClick={handleSave}
                                                        disabled={updateMutation.isPending}
                                                        className="flex items-center gap-2 px-4 py-2 bg-cyan-500 text-white font-bold rounded-xl hover:bg-cyan-400 transition-all disabled:opacity-50"
                                                    >
                                                        <Save size={16} />
                                                        Save
                                                    </button>
                                                    <button
                                                        onClick={() => setEditing(null)}
                                                        className="px-4 py-2 bg-slate-700/50 text-white font-bold rounded-xl hover:bg-slate-600 transition-all"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-4">
                                                <div className="px-4 py-2 rounded-xl bg-slate-900/50 border border-slate-700/50">
                                                    <span className="text-xs text-slate-400 uppercase tracking-wider">Provider: </span>
                                                    <span className="text-white font-bold">{setting.value.provider}</span>
                                                </div>
                                                <div className="px-4 py-2 rounded-xl bg-slate-900/50 border border-slate-700/50">
                                                    <span className="text-xs text-slate-400 uppercase tracking-wider">Model: </span>
                                                    <span className="text-white font-bold">{setting.value.model}</span>
                                                </div>
                                                {setting.value.tier && (
                                                    <div className="px-4 py-2 rounded-xl bg-slate-900/50 border border-slate-700/50">
                                                        <span className="text-xs text-slate-400 uppercase tracking-wider">Tier: </span>
                                                        <span className="text-white font-bold">{setting.value.tier}</span>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {editing?.key !== setting.key && (
                                        <button
                                            onClick={() => handleEdit(setting)}
                                            className="p-2 rounded-xl bg-slate-700/50 text-slate-400 hover:text-white hover:bg-slate-600 transition-all"
                                        >
                                            <Settings size={16} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

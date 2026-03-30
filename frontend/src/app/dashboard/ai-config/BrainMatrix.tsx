'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  BookOpen, 
  Users, 
  Zap, 
  Save, 
  ChevronRight,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';

interface AgentRoute {
  provider: string;
  model: string;
}

interface AiSetting {
  key: string;
  value: any;
  group: string;
}

const DEFAULT_AGENTS = ['historian', 'psychologist', 'director', 'wordsmith'];

export const BrainMatrix: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [localStyle, setLocalStyle] = useState('');
  const [localRouting, setLocalRouting] = useState<Record<string, AgentRoute>>({
    historian: { provider: 'openai', model: 'gpt-4o' },
    psychologist: { provider: 'anthropic', model: 'claude-3-sonnet' },
    director: { provider: 'openrouter', model: 'meta-llama/llama-3-70b' },
    wordsmith: { provider: 'openai', model: 'gpt-4-turbo' }
  });
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/ai-settings');
        if (!response.ok) throw new Error('Failed to fetch');
        const data = (await response.json()) as AiSetting[];

        const styleSetting = data.find(s => s.key === 'narrative.style');
        const routingSetting = data.find(s => s.key === 'agent.routing');

        if (styleSetting) setLocalStyle(String(styleSetting.value || ''));
        if (routingSetting) {
          const val = typeof routingSetting.value === 'string' 
            ? JSON.parse(routingSetting.value) 
            : routingSetting.value;
          if (val && typeof val === 'object') {
            setLocalRouting(prev => ({ ...prev, ...val }));
          }
        }
      } catch (error) {
        console.error('Fetch error:', error);
      } finally {
        setLoading(false);
      }
    };

    void fetchSettings();
  }, []);

  const handleSaveMatrix = async () => {
    try {
      setSaving(true);
      const toastId = toast.loading('Đang cập nhật Ma trận...');

      await fetch('/api/ai-settings/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'narrative.style', value: localStyle, group: 'narrative' }),
      });

      await fetch('/api/ai-settings/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'agent.routing', value: localRouting, group: 'orchestration' }),
      });

      toast.dismiss(toastId);
      toast.success('Đã cập nhật Ma trận thành công.');
      setIsDirty(false);
    } catch (error) {
      toast.error('Lỗi khi lưu.');
    } finally {
      setSaving(false);
    }
  };

  const updateRouting = (agent: string, field: string, value: string) => {
    setLocalRouting(prev => ({
      ...prev,
      [agent]: {
        ...(prev[agent] || { provider: 'openai', model: '' }),
        [field]: value
      }
    }));
    setIsDirty(true);
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Narrative Section */}
        <section className="space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/20 bg-primary/5 text-primary shadow-sm">
                <BookOpen size={20} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 tracking-tight">Hạt nhân Narrative</h3>
                <p className="text-[9px] font-heading font-black uppercase tracking-wider text-slate-400 mt-0.5">Cấu hình System Prompt mặc định</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <textarea
              value={localStyle}
              onChange={(e) => { setLocalStyle(e.target.value); setIsDirty(true); }}
              className="w-full h-[320px] bg-slate-50/50 border border-slate-200 rounded-xl p-5 text-xs font-bold text-slate-700 outline-none resize-none font-heading leading-relaxed"
              placeholder="Nhập phong cách (VD: Dark Fantasy, Noir...)"
            />
          </div>
        </section>

        {/* Agent Matrix Section */}
        <section className="space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-600 shadow-sm">
                <Users size={20} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 tracking-tight">Ma trận Agent</h3>
                <p className="text-[9px] font-heading font-black uppercase tracking-wider text-slate-400 mt-0.5">Ánh xạ Model theo vai trò</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {DEFAULT_AGENTS.map((agent) => (
              <div key={agent} className="rounded-2xl border border-slate-100 bg-white p-5 hover:border-emerald-200 transition-all">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[11px] font-heading font-black uppercase tracking-widest text-slate-900">{agent}</span>
                  <Zap size={14} className="text-amber-400" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <select
                    value={localRouting[agent]?.provider || 'openai'}
                    onChange={(e) => updateRouting(agent, 'provider', e.target.value)}
                    className="rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-[10px] font-heading font-bold outline-none"
                  >
                    <option value="openai">OPENAI</option>
                    <option value="openrouter">OPENROUTER</option>
                    <option value="google">GOOGLE</option>
                    <option value="anthropic">ANTHROPIC</option>
                  </select>
                  <input
                    type="text"
                    value={localRouting[agent]?.model || ''}
                    onChange={(e) => updateRouting(agent, 'model', e.target.value)}
                    className="rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-[10px] font-heading font-bold outline-none"
                    placeholder="Model ID"
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {isDirty && (
        <div className="sticky bottom-0 z-30 flex items-center justify-between p-6 rounded-3xl border border-amber-200 bg-amber-50/80 backdrop-blur-xl shadow-xl">
          <div className="flex items-center gap-4">
            <RefreshCw size={20} className={saving ? 'animate-spin' : ''} />
            <p className="text-xs font-bold text-amber-900">Thay đổi chưa lưu</p>
          </div>
          <button
            onClick={handleSaveMatrix}
            disabled={saving}
            className="rounded-xl bg-primary px-10 py-3.5 text-[10px] font-heading font-black uppercase tracking-widest text-white"
          >
            LƯU MA TRẬN HẠT NHÂN
          </button>
        </div>
      )}
    </div>
  );
};

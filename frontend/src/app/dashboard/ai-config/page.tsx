'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Settings, 
  Cpu, 
  Database, 
  Save, 
  RefreshCw, 
  Download, 
  ShieldCheck, 
  Terminal,
  ChevronRight,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  History
} from 'lucide-react';
import AiLogViewer from './AiLogViewer';
import { toast } from 'sonner';

interface AiSetting {
  id: number;
  key: string;
  value: any;
  group: string;
  description: string;
  is_secret: boolean;
}

const AiConfigPage = () => {
  const [activeTab, setActiveTab] = useState<'config' | 'logs'>('config');
  const [settings, setSettings] = useState<AiSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [drivers, setDrivers] = useState<string[]>([]);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [localValues, setLocalValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (activeTab === 'config') {
      fetchSettings();
      fetchDrivers();
    }
  }, [activeTab]);

  const fetchDrivers = async () => {
    try {
      const res = await fetch('/api/ai-settings/drivers');
      const data = await res.json();
      setDrivers(data);
    } catch (err) {
      console.error('Failed to fetch drivers', err);
    }
  };

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/ai-settings');
      const data = await res.json();
      setSettings(data);
      
      // Initialize local values
      const initial: Record<string, string> = {};
      data.forEach((s: AiSetting) => {
        initial[s.key] = typeof s.value === 'object' ? JSON.stringify(s.value, null, 2) : String(s.value);
      });
      setLocalValues(initial);
    } catch (err) {
      console.error('Failed to fetch AI settings', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (key: string, value: any, group: string, isSecret: boolean) => {
    try {
      const res = await fetch('/api/ai-settings/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value, group, is_secret: isSecret }),
      });
      return res.ok;
    } catch (err) {
      console.error('Update failed', err);
      return false;
    }
  };

  const handleSaveAll = async () => {
    const changedKeys = Object.keys(localValues).filter(key => {
      const original = settings.find(s => s.key === key);
      if (!original) return false;
      const originalStr = typeof original.value === 'object' ? JSON.stringify(original.value, null, 2) : String(original.value);
      return localValues[key] !== originalStr;
    });

    if (changedKeys.length === 0) {
      toast.info('Không có thay đổi nào cần lưu');
      return;
    }

    try {
      setSaving(true);
      const toastId = toast.loading(`Đang lưu ${changedKeys.length} thay đổi...`);
      
      const results = await Promise.all(changedKeys.map(key => {
        const s = settings.find(item => item.key === key)!;
        let pValue = localValues[key];
        try {
          if (pValue.startsWith('{') || pValue.startsWith('[')) {
            pValue = JSON.parse(pValue);
          }
        } catch (e) {}
        return handleUpdate(key, pValue, s.group, s.is_secret);
      }));

      const successCount = results.filter(r => r).length;
      toast.dismiss(toastId);
      
      if (successCount === changedKeys.length) {
        toast.success(`Đã lưu thành công ${successCount} cấu hình`);
      } else {
        toast.error(`Chỉ lưu được ${successCount}/${changedKeys.length} cấu hình. Vui lòng kiểm tra lại.`);
      }
      
      fetchSettings();
    } finally {
      setSaving(false);
    }
  };

  const handleSync = async () => {
    try {
      setSyncing(true);
      await fetch('/api/ai-settings/sync', { method: 'POST' });
    } finally {
      setSyncing(false);
    }
  };

  const handleImport = async () => {
    if (!confirm('Nhập lại cấu hình từ file ai.php sẽ ghi đè các thay đổi hiện tại. Bạn có chắc chắn?')) return;
    try {
      setLoading(true);
      await fetch('/api/ai-settings/import', { method: 'POST' });
      fetchSettings();
    } finally {
      setLoading(false);
    }
  };

  const toggleSecret = (key: string) => {
    setShowSecrets(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const renderGroup = (group: string, title: string, icon: any) => {
    const Icon = icon;
    const groupSettings = settings.filter(s => s.group === group);

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
            <Icon size={20} className="text-primary" />
          </div>
          <h2 className="text-lg font-bold tracking-tight">{title}</h2>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {groupSettings.map((s) => {
            const isDriverSelection = group === 'feature' || s.key === 'default';
            const originalValue = typeof s.value === 'object' ? JSON.stringify(s.value, null, 2) : String(s.value);
            const isChanged = localValues[s.key] !== originalValue;

            return (
              <motion.div
                layout
                key={s.key}
                className="p-4 rounded-xl bg-card/40 border border-border/50 backdrop-blur-md hover:border-primary/30 transition-colors group"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-mono text-primary font-bold">{s.key}</span>
                      {s.is_secret && (
                        <span className="px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-[10px] text-amber-500 font-mono uppercase">Secret</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{s.description || 'Chưa có mô tả'}</p>
                  </div>

                  <div className="flex items-center gap-2 max-w-md w-full md:w-auto">
                    <div className="relative flex-1 min-w-[300px]">
                      {isDriverSelection ? (
                        <select
                          value={localValues[s.key] || ''}
                          onChange={(e) => {
                            setLocalValues(prev => ({ ...prev, [s.key]: e.target.value }));
                          }}
                          className={`w-full bg-void/60 border rounded-lg px-4 py-2 text-sm font-mono focus:outline-none appearance-none transition-all ${
                            isChanged
                            ? 'border-amber-500/50 focus:border-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.1)]'
                            : 'border-border/40 focus:border-primary/50'
                          }`}
                        >
                          {drivers.map(d => (
                            <option key={d} value={d}>{d}</option>
                          ))}
                        </select>
                      ) : (
                        <input 
                          type={s.is_secret && !showSecrets[s.key] ? "password" : "text"}
                          value={localValues[s.key] || ''}
                          onChange={(e) => {
                            setLocalValues(prev => ({ ...prev, [s.key]: e.target.value }));
                          }}
                          className={`w-full bg-void/60 border rounded-lg px-4 py-2 text-sm font-mono focus:outline-none transition-all ${
                            isChanged
                            ? 'border-amber-500/50 focus:border-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.1)]'
                            : 'border-border/40 focus:border-primary/50'
                          }`}
                        />
                      )}
                      
                      {s.is_secret && !isDriverSelection && (
                        <button 
                          onClick={() => toggleSecret(s.key)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-muted-foreground hover:text-primary transition-colors"
                        >
                          {showSecrets[s.key] ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      )}

                      {isDriverSelection && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                          <ChevronRight size={14} className="rotate-90" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Header Bar */}
      <header className="flex flex-wrap items-center justify-between gap-6 p-6 rounded-[var(--radius)] bg-card/40 border border-border/50 backdrop-blur-md relative z-20">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-gradient-to-tr from-primary to-primary/40 flex items-center justify-center glow-left-brain">
            <Settings size={20} className="text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">AI Orchestration Center</h1>
            <p className="text-xs text-muted-foreground uppercase tracking-widest font-mono">Kernel Config / Multi-AI Management</p>
          </div>
        </div>

        <div className="flex gap-4">
          <div className="flex p-1 bg-void/40 border border-border/40 rounded-xl mr-4">
             <button 
               onClick={() => setActiveTab('config')}
               className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-mono transition-all ${activeTab === 'config' ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' : 'text-muted-foreground hover:text-foreground'}`}
             >
                <Cpu size={14} /> CONFIG
             </button>
             <button 
               onClick={() => setActiveTab('logs')}
               className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-mono transition-all ${activeTab === 'logs' ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' : 'text-muted-foreground hover:text-foreground'}`}
             >
                <History size={14} /> AUDIT_LOGS
             </button>
          </div>

          <button 
            onClick={handleImport}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-card border border-border/40 text-xs font-mono hover:border-primary/50 hover:text-primary transition-all group"
          >
            <Download size={14} className="group-hover:-translate-y-0.5 transition-transform" />
            IMPORT_CONFIG
          </button>
          
          <button 
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-card border border-border/40 text-xs font-mono hover:border-primary/50 hover:text-primary transition-all group"
          >
            <RefreshCw size={14} className={`group-hover:rotate-180 transition-transform ${syncing ? 'animate-spin' : ''}`} />
            SYNC_CACHE
          </button>

          <button 
            onClick={handleSaveAll}
            disabled={saving}
            className={`flex items-center gap-2 px-6 py-2 rounded-lg text-xs font-mono transition-all group ${
              saving ? 'opacity-50 cursor-not-allowed' : 'bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90'
            }`}
          >
            {saving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} className="group-hover:scale-110 transition-transform" />}
            {saving ? 'SAVING...' : 'SAVE_CHANGES'}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 space-y-12 relative z-20 max-w-6xl mx-auto w-full py-8">
        
        {activeTab === 'logs' ? (
          <AiLogViewer />
        ) : (
          <>
            {loading ? (
              <div className="flex flex-col items-center justify-center h-[400px] gap-4">
                 <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                 <p className="text-xs font-mono text-muted-foreground animate-pulse">Initializing Neural Link...</p>
              </div>
            ) : (
              <>
                {/* Feature Mappings */}
                {renderGroup('feature', 'Simulation Intelligence Features', Cpu)}
                
                <div className="h-px bg-gradient-to-r from-transparent via-border/50 to-transparent my-12" />

                {/* Providers */}
                {renderGroup('provider', 'AI Providers & LLM Clusters', Database)}

                <div className="h-px bg-gradient-to-r from-transparent via-border/50 to-transparent my-12" />

                {/* General */}
                {renderGroup('general', 'Kernel Systems', ShieldCheck)}
              </>
            )}
          </>
        )}

      </main>
    </>
  );
};

export default AiConfigPage;

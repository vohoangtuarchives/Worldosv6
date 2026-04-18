'use client';

import React, { useEffect, useState } from 'react';
import { 
  Activity, Server, Cpu, AlertCircle,
  CheckCircle, XCircle, RefreshCw, Zap
} from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';

interface SystemHealth {
  status: string;
  checks: Record<string, string>;
}

interface SystemMetrics {
  requests_total: number;
  requests_by_endpoint: Record<string, number>;
  avg_latency_ms: number;
  errors_total: number;
}

interface SystemConfig {
  agents: Record<string, {
    provider: string;
    model: string;
    tier: string;
    role: string;
  }>;
  providers: Record<string, {
    status: string;
    key_present?: boolean;
    url?: string;
  }>;
  version: string;
}

export default function SystemTab() {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [config, setConfig] = useState<SystemConfig | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchSystemData = async () => {
    setLoading(true);
    try {
      const [healthRes, metricsRes, configRes] = await Promise.all([
        api.get('/health').catch(() => null),
        api.get('/metrics').catch(() => null),
        api.get('/config').catch(() => null)
      ]);

      if (healthRes) setHealth(healthRes.data);
      if (metricsRes) setMetrics(metricsRes.data);
      if (configRes) setConfig(configRes.data);
    } catch {
      toast.error('Failed to fetch system data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSystemData();
    const interval = setInterval(fetchSystemData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: string) => {
    if (status === 'healthy' || status === 'ok' || status === 'configured' || status === 'online') {
      return <CheckCircle className="w-4 h-4 text-emerald-400" />;
    }
    if (status.includes('error') || status === 'degraded') {
      return <AlertCircle className="w-4 h-4 text-amber-400" />;
    }
    return <XCircle className="w-4 h-4 text-rose-400" />;
  };

  const getStatusColor = (status: string) => {
    if (status === 'healthy' || status === 'ok' || status === 'configured' || status === 'online') {
      return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    }
    if (status.includes('error') || status === 'degraded') {
      return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
    }
    return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
  };

  return (
    <div className="space-y-6">
      {/* Header with refresh */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${health?.status === 'healthy' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
          <span className="text-sm text-gray-300">
            System Status: <span className="font-medium">{health?.status || 'Unknown'}</span>
          </span>
        </div>
        <button
          onClick={fetchSystemData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm text-gray-400 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Health Checks */}
      {health?.checks && (
        <div className="p-4 bg-black/40 border border-white/10 rounded-xl">
          <h3 className="text-xs uppercase tracking-widest text-gray-500 mb-4 flex items-center gap-2">
            <Activity className="w-3 h-3" />
            Health Checks
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {Object.entries(health.checks).map(([name, status]) => (
              <div 
                key={name}
                className={`p-3 rounded-lg border ${getStatusColor(status)}`}
              >
                <div className="flex items-center gap-2 mb-1">
                  {getStatusIcon(status)}
                  <span className="text-xs font-medium capitalize">{name.replace(/_/g, ' ')}</span>
                </div>
                <p className="text-[10px] opacity-70">{status}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Metrics */}
      {metrics && (
        <div className="p-4 bg-black/40 border border-white/10 rounded-xl">
          <h3 className="text-xs uppercase tracking-widest text-gray-500 mb-4 flex items-center gap-2">
            <Zap className="w-3 h-3" />
            System Metrics
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3 bg-white/5 rounded-lg">
              <p className="text-[10px] uppercase text-gray-500 mb-1">Total Requests</p>
              <p className="text-xl font-bold text-white">{metrics.requests_total.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-white/5 rounded-lg">
              <p className="text-[10px] uppercase text-gray-500 mb-1">Avg Latency</p>
              <p className="text-xl font-bold text-white">{metrics.avg_latency_ms.toFixed(1)}ms</p>
            </div>
            <div className="p-3 bg-white/5 rounded-lg">
              <p className="text-[10px] uppercase text-gray-500 mb-1">Total Errors</p>
              <p className="text-xl font-bold text-rose-400">{metrics.errors_total.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-white/5 rounded-lg">
              <p className="text-[10px] uppercase text-gray-500 mb-1">Error Rate</p>
              <p className="text-xl font-bold text-white">
                {metrics.requests_total > 0 
                  ? ((metrics.errors_total / metrics.requests_total) * 100).toFixed(2) 
                  : '0'}%
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Agents Config */}
      {config?.agents && (
        <div className="p-4 bg-black/40 border border-white/10 rounded-xl">
          <h3 className="text-xs uppercase tracking-widest text-gray-500 mb-4 flex items-center gap-2">
            <Cpu className="w-3 h-3" />
            Loom Agents ({Object.keys(config.agents).length})
          </h3>
          <div className="space-y-2">
            {Object.entries(config.agents).map(([agentId, agent]) => (
              <div 
                key={agentId}
                className="flex items-center justify-between p-3 bg-white/5 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-violet-400" />
                  <div>
                    <p className="text-sm font-medium text-white capitalize">{agentId.replace(/_/g, ' ')}</p>
                    <p className="text-xs text-gray-500">{agent.role}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400">{agent.provider}</p>
                  <p className="text-[10px] text-gray-600">{agent.model}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* LLM Providers */}
      {config?.providers && (
        <div className="p-4 bg-black/40 border border-white/10 rounded-xl">
          <h3 className="text-xs uppercase tracking-widest text-gray-500 mb-4 flex items-center gap-2">
            <Server className="w-3 h-3" />
            LLM Providers
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {Object.entries(config.providers).map(([provider, info]) => (
              <div 
                key={provider}
                className={`p-3 rounded-lg border ${getStatusColor(info.status)}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium uppercase">{provider}</span>
                  {getStatusIcon(info.status)}
                </div>
                <p className="text-[10px] opacity-70">
                  {info.key_present !== undefined 
                    ? (info.key_present ? 'API Key configured' : 'Missing API key')
                    : info.status}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Version */}
      {config?.version && (
        <div className="flex items-center justify-center text-xs text-gray-600">
          <span>NarrativeLoom API v{config.version}</span>
        </div>
      )}
    </div>
  );
}

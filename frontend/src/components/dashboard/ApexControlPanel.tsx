"use client";

import React, { useState, useEffect } from "react";
import { useSimulation } from "@/context/SimulationContext";
import { Eye, Hexagon, Zap, AlertTriangle, ShieldAlert } from "lucide-react";
import { api } from "@/lib/api";

interface WavefunctionData {
  entropy: number;
  stability_index: number;
  information_density: number;
  active_attractor: string;
  collapse_probability: number;
}

export function ApexControlPanel({ universeId }: { universeId: number }) {
  const { latestSnapshot } = useSimulation();
  const [wavefunction, setWavefunction] = useState<WavefunctionData | null>(null);
  const [loading, setLoading] = useState(false);
  const [cmdParam, setCmdParam] = useState("gravity");
  const [cmdValue, setCmdValue] = useState("1.0");
  const [anomalyName, setAnomalyName] = useState("divine_miracle");
  const [cmdType, setCmdType] = useState<"adjust_constant" | "trigger_anomaly">("adjust_constant");

  const fetchWavefunction = async () => {
    try {
      const res = await fetch(`/api/apex/v10/universes/${universeId}/wavefunction`);
      if (res.ok) {
        const data = await res.json();
        if (data.wavefunction) {
          setWavefunction(data.wavefunction);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchWavefunction();
  }, [universeId, latestSnapshot?.tick]);

  const handleCommand = async () => {
    setLoading(true);
    try {
      const payload = cmdType === "adjust_constant" 
        ? { parameter: cmdParam, value: parseFloat(cmdValue) }
        : { anomaly_name: anomalyName, target: "random" };

      await fetch(`/api/worldos/universes/${universeId}/apex/command`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          command_type: cmdType,
          payload,
        }),
      });
      fetchWavefunction();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-card/40 border border-border/50 rounded-lg overflow-hidden">
      <div className="flex items-center gap-2 p-4 border-b border-border/50 bg-card/60">
        <Eye className="w-5 h-5 text-violet-400" />
        <h2 className="text-sm font-semibold text-foreground">Apex Observer Control (V10)</h2>
      </div>
      
      <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Wavefunction View */}
        <div className="flex flex-col gap-3">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
            <Hexagon className="w-4 h-4 text-cyan-400" /> Wavefunction Projection
          </h3>
          {wavefunction ? (
            <div className="grid grid-cols-2 gap-3 p-4 bg-background/50 rounded-lg border border-border/40 font-mono text-sm">
              <div className="flex flex-col">
                <span className="text-muted-foreground text-[10px] uppercase">Entropy</span>
                <span className="font-bold text-foreground">{wavefunction.entropy.toFixed(4)}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-muted-foreground text-[10px] uppercase">Collapse Prob</span>
                <span className="font-bold text-red-400">{(wavefunction.collapse_probability * 100).toFixed(2)}%</span>
              </div>
              <div className="flex flex-col">
                <span className="text-muted-foreground text-[10px] uppercase">Info Density</span>
                <span className="font-bold text-blue-400">{wavefunction.information_density.toFixed(4)}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-muted-foreground text-[10px] uppercase">Active Attractor</span>
                <span className="font-bold text-violet-400">{wavefunction.active_attractor}</span>
              </div>
            </div>
          ) : (
            <div className="p-4 text-xs text-muted-foreground italic">Đang đồng bộ hàm sóng...</div>
          )}
        </div>

        {/* Apex Commands */}
        <div className="flex flex-col gap-3">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" /> Apex Override
          </h3>
          <div className="p-4 bg-background/50 rounded-lg border border-border/40 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <select
                value={cmdType}
                onChange={(e) => setCmdType(e.target.value as any)}
                className="bg-muted text-sm rounded border border-border px-2 py-1 flex-1"
              >
                <option value="adjust_constant">Ghi đè hằng số vật lý</option>
                <option value="trigger_anomaly">Kích hoạt Anomaly</option>
              </select>
            </div>

            {cmdType === "adjust_constant" ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={cmdParam}
                  onChange={(e) => setCmdParam(e.target.value)}
                  placeholder="Tham số (gravity, logic_drift...)"
                  className="bg-muted text-sm rounded border border-border px-2 py-1 w-1/2"
                />
                <input
                  type="number"
                  step="0.1"
                  value={cmdValue}
                  onChange={(e) => setCmdValue(e.target.value)}
                  className="bg-muted text-sm rounded border border-border px-2 py-1 w-1/4"
                />
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <select
                  value={anomalyName}
                  onChange={(e) => setAnomalyName(e.target.value)}
                  className="bg-muted text-sm rounded border border-border px-2 py-1 flex-1"
                >
                  <option value="divine_miracle">Phép màu (Divine Miracle)</option>
                  <option value="celestial_engineering">Can thiệp Vĩ mô (Celestial Engineering)</option>
                  <option value="biological_hivemind">Tâm trí Tập thể (Hivemind)</option>
                </select>
              </div>
            )}

            <button
              onClick={handleCommand}
              disabled={loading}
              className="mt-2 bg-violet-600/20 text-violet-300 border border-violet-500/50 hover:bg-violet-600/40 rounded px-4 py-2 flex items-center justify-center gap-2 font-semibold text-xs uppercase tracking-wide transition-all"
            >
              {loading ? <span className="animate-spin w-4 h-4 border-2 border-violet-400 border-t-transparent rounded-full" /> : <ShieldAlert className="w-4 h-4" />}
              {loading ? "Đang can thiệp..." : "Thực thi Lệnh Apex"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

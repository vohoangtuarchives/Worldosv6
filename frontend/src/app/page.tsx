"use client";

import { useEffect, useState, useRef } from "react";
import JsonViewer from "@/components/JsonViewer";
import { Centrifuge } from "centrifuge";

export default function Home() {
  const [universes, setUniverses] = useState<any[]>([]);
  const [universe, setUniverse] = useState<any>(null);
  const [snapshots, setSnapshots] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSnapshot, setSelectedSnapshot] = useState<any>(null);
  const [prevSelectedSnapshot, setPrevSelectedSnapshot] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [fetchingDetail, setFetchingDetail] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  
  const centrifugeRef = useRef<Centrifuge | null>(null);

  const [viewMode, setViewMode] = useState<"monitor" | "manager">("monitor");

  const handleToggleStatus = async (u: any) => {
    try {
      const res = await fetch(`/api/worldos/universes/${u.id}/toggle-status`, { method: "POST" });
      if (res.ok) {
        fetchUniverses();
      }
    } catch (err) {
      console.error("Toggle status failed", err);
    }
  };


  const fetchUniverses = async () => {
    try {
      const res = await fetch("/api/worldos/universes");
      if (res.ok) {
        const data = await res.json();
        setUniverses(data);
        
        // V10: Persistence logic for Universe selection
        const storedId = localStorage.getItem("worldos_selected_universe_id");
        if (storedId) {
          const matched = data.find((u: any) => u.id === parseInt(storedId));
          // Only update if we don't have a selection OR the current selection doesn't match the new data (e.g. name update)
          if (matched) {
             if (!universe || universe.id !== matched.id) {
                setUniverse(matched);
             }
          } else if (!universe && data.length > 0) {
            setUniverse(data[0]);
          }
        } else if (!universe && data.length > 0) {
          setUniverse(data[0]);
        }
      }
    } catch (err) {
      console.error("Failed to fetch universes", err);
    }
  };

  const handleFork = async (u: any) => {
    const newName = prompt("Enter name for the new fork:", `${u.name} (Fork)`);
    if (!newName) return;

    try {
      const res = await fetch(`/api/worldos/universes/${u.id}/fork`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tick: u.current_tick, name: newName })
      });
      if (res.ok) {
        const result = await res.json();
        alert(`Successfully forked! New Universe ID: ${result.child_universe_id}`);
        fetchUniverses();
      }
    } catch (err) {
      console.error("Fork failed", err);
    }
  };

  const handleRename = async (u: any) => {
    const newName = prompt("Enter new name:", u.name);
    if (!newName || newName === u.name) return;

    try {
      const res = await fetch(`/api/worldos/universes/${u.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName })
      });
      if (res.ok) {
        fetchUniverses();
        if (universe?.id === u.id) {
          setUniverse({ ...universe, name: newName });
        }
      }
    } catch (err) {
      console.error("Rename failed", err);
    }
  };

  const handleDelete = async (u: any) => {
    if (!confirm(`Are you sure you want to delete "${u.name}"? All snapshot data will be permanently lost.`)) return;

    try {
      const res = await fetch(`/api/worldos/universes/${u.id}`, { method: "DELETE" });
      if (res.ok) {
        fetchUniverses();
        if (universe?.id === u.id) {
          setUniverse(null);
          setSnapshots([]);
        }
      }
    } catch (err) {
      console.error("Delete failed", err);
    }
  };

  const fetchSnapshots = async (universeId: number) => {
    try {
      const res = await fetch(`/api/worldos/universes/${universeId}/snapshots?limit=50`);
      if (res.ok) {
        const rows = await res.json();
        setSnapshots(rows.sort((a: any, b: any) => b.tick - a.tick));
      }
    } catch (err) {
      console.error("Failed to fetch snapshots", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const res = await fetch("/api/worldos/analytics/ticks");
      if (res.ok) {
        const data = await res.json();
        setAnalytics(data);
      }
    } catch (err) {
      console.error("Failed to fetch analytics", err);
    }
  };

  useEffect(() => {
    fetchUniverses();
    fetchAnalytics();
    const interval = setInterval(() => {
      fetchUniverses();
      fetchAnalytics();
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (universe?.id) {
      setLoading(true);
      fetchSnapshots(universe.id);
    }
  }, [universe?.id]);

  const viewSnapshotDetail = async (snapshot: any) => {
    try {
      setFetchingDetail(true);
      const res = await fetch(`/api/worldos/snapshots/${snapshot.id}`);
      if (res.ok) {
        const fullData = await res.json();
        setSelectedSnapshot(fullData);
        setPrevSelectedSnapshot(null);

        const prevInList = snapshots.find(s => s.tick === snapshot.tick - 1);
        if (prevInList) {
          const prevRes = await fetch(`/api/worldos/snapshots/${prevInList.id}`);
          if (prevRes.ok) {
            const prevFullData = await prevRes.json();
            setPrevSelectedSnapshot(prevFullData);
          }
        }
        
        setIsModalOpen(true);
      }
    } catch (err) {
      console.error("Failed to fetch snapshot detail", err);
    } finally {
      setFetchingDetail(false);
    }
  };

  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/connection/websocket`;
    
    const centrifuge = new Centrifuge(wsUrl);
    centrifugeRef.current = centrifuge;

    centrifuge.on("connected", () => setIsConnected(true));
    centrifuge.on("disconnected", () => setIsConnected(false));

    const sub = centrifuge.newSubscription("public:universes");

    sub.on("publication", (ctx) => {
      console.log("Realtime update received:", ctx.data);
      if (ctx.data && ctx.data.snapshot) {
        // Update all universes tick if possible
        setUniverses(prev => prev.map(u => u.id === ctx.data.universe_id ? { ...u, current_tick: ctx.data.snapshot.tick } : u));
        
        // Update snapshots if it belongs to current selected universe
        if (universe && ctx.data.universe_id === universe.id) {
          setSnapshots(prev => {
            const exists = prev.find(s => s.id === ctx.data.snapshot.id);
            if (exists) return prev;
            const newList = [ctx.data.snapshot, ...prev];
            return newList.sort((a: any, b: any) => Number(b.tick) - Number(a.tick)).slice(0, 100);
          });
        }
      }
    });

    sub.subscribe();
    centrifuge.connect();

    return () => {
      if (centrifugeRef.current) centrifugeRef.current.disconnect();
    };
  }, [universe?.id]);

  return (
    <div className="h-screen bg-[#0a0a0c] text-[#e1e1e6] flex flex-col font-sans selection:bg-primary/30 overflow-hidden">
      <header className="w-full flex-none px-6 py-4 flex items-center justify-between border-b border-white/5 bg-black/40 backdrop-blur-md z-10">
        <div className="flex items-center gap-6">
          <h1 className="text-2xl font-black tracking-tighter text-white flex items-center gap-3">
            WorldOS <span className="text-blue-500">Monitor</span>
            <div className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse" : "bg-red-500"}`}></div>
          </h1>
          <nav className="hidden md:flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest opacity-40">
            <span>Systems</span>
            <span>/</span>
            <span className="text-white">Multiverse Control</span>
          </nav>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-[9px] uppercase tracking-widest text-white/40 leading-none">Status</p>
            <p className="text-[10px] font-mono font-bold text-green-500 mt-1 uppercase">Transmission Active</p>
          </div>
          <button 
            onClick={fetchUniverses}
            className="h-9 px-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-xs font-bold uppercase tracking-wider"
          >
            Refresh
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - Universe List & Branching */}
        <aside className="w-72 flex-none border-r border-white/5 bg-black/20 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-white/5 bg-white/[0.02] space-y-3">
            <button 
              onClick={() => setViewMode("manager")}
              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                viewMode === "manager" 
                  ? "bg-blue-600/20 border border-blue-500/30 text-blue-400 font-bold" 
                  : "hover:bg-white/[0.05] text-white/40 font-medium"
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg>
              <span className="text-[10px] uppercase tracking-widest">Global Dashboard</span>
            </button>
            
            <div className="h-px bg-white/5 mx-2"></div>
            
            <h3 className="text-[10px] uppercase font-bold tracking-[0.2em] text-white/20 px-2 mt-2">Universe Tree</h3>
            <div className="space-y-1">
              {universes.map(u => {
                const isSelected = universe?.id === u.id;
                const isFork = !!u.parent_universe_id;
                
                return (
                  <div key={u.id} className="relative group">
                    <button
                      onClick={() => { setUniverse(u); setViewMode("monitor"); }}
                      className={`w-full relative flex flex-col items-start p-3 rounded-xl transition-all ${
                        isSelected && viewMode === "monitor" 
                          ? "bg-blue-600/10 border border-blue-500/20" 
                          : "hover:bg-white/[0.03] border border-transparent"
                      }`}
                    >
                      <div className="flex items-center w-full gap-2 pr-16">
                        {isFork && <div className="w-2 h-2 border-l-2 border-b-2 border-white/10 mr-1 mt-[-4px]"></div>}
                        <span className={`text-xs font-bold truncate ${isSelected ? "text-blue-400" : "text-white/80"}`}>
                          {u.name}
                        </span>
                      </div>
                      <div className="flex items-center justify-between w-full mt-2 font-mono text-[9px] opacity-40">
                        <span>#Tick {u.current_tick || 0}</span>
                        <span className={`px-1 rounded uppercase bg-black/40 ${u.status === 'active' ? 'text-green-500' : 'text-red-500'}`}>
                          {u.status}
                        </span>
                      </div>
                    </button>
                    
                    {/* Action Buttons Overlaid on Hover */}
                    <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleRename(u); }}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-colors"
                        title="Rename"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleFork(u); }}
                        className="p-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/30 text-blue-400/60 hover:text-blue-400 transition-colors"
                        title="Fork Branch"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h8m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4-4m-4 4l4 4"></path></svg>
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDelete(u); }}
                        className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/30 text-red-400/60 hover:text-red-400 transition-colors"
                        title="Delete"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
            <h3 className="text-[10px] uppercase font-bold tracking-[0.2em] text-white/40 mb-4">Node Health</h3>
            <div className="space-y-4">
              <div className="space-y-1">
                <div className="flex justify-between text-[9px] uppercase tracking-wider opacity-60">
                  <span>CPU Cluster</span>
                  <span className="text-green-500">Normal</span>
                </div>
                <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500/50 w-[42%]"></div>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-[9px] uppercase tracking-wider opacity-60">
                  <span>Engine Sync</span>
                  <span className="text-blue-500">99.8%</span>
                </div>
                <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 w-[99%] shadow-[0_0_8px_rgba(59,130,246,0.3)]"></div>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col overflow-hidden bg-black/10">
          {viewMode === "manager" ? (
            <div className="flex-1 overflow-y-auto p-12 custom-scrollbar">
              <div className="max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
                <header className="mb-12">
                  <h2 className="text-4xl font-black text-white italic tracking-tighter mb-2 underline decoration-blue-500/50 underline-offset-8 decoration-4">
                    Multiverse <span className="text-blue-500">Registry</span>
                  </h2>
                  <p className="text-white/40 text-[11px] uppercase font-bold tracking-[0.3em]">Operational Status & Global Orchestration</p>
                </header>

                <div className="bg-white/[0.02] border border-white/5 rounded-3xl overflow-hidden backdrop-blur-3xl shadow-2xl">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-white/5 bg-white/[0.01]">
                        <th className="p-5 text-[10px] uppercase font-black text-white/20 tracking-widest">Universe Node</th>
                        <th className="p-5 text-[10px] uppercase font-black text-white/20 tracking-widest">Tick</th>
                        <th className="p-5 text-[10px] uppercase font-black text-white/20 tracking-widest text-center">Stability</th>
                        <th className="p-5 text-[10px] uppercase font-black text-white/20 tracking-widest text-center">Entropy</th>
                        <th className="p-5 text-[10px] uppercase font-black text-white/20 tracking-widest text-center">State</th>
                        <th className="p-5 text-[10px] uppercase font-black text-white/20 tracking-widest text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {universes.map((u) => (
                        <tr key={u.id} className="hover:bg-white/[0.03] transition-colors group">
                          <td className="p-5">
                            <div className="flex flex-col">
                              <span className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors uppercase tracking-tight">{u.name}</span>
                              <span className="text-[9px] font-mono text-white/20 uppercase tracking-tighter">ID: #{u.id}</span>
                            </div>
                          </td>
                          <td className="p-5 font-mono text-sm text-white/60 font-bold">{u.current_tick || 0}</td>
                          <td className="p-5 text-center">
                            <span className="text-xs font-mono text-blue-400">{(u.latest_snapshot?.stability_index || 0.85).toFixed(3)}</span>
                          </td>
                          <td className="p-5 text-center">
                             <span className="text-xs font-mono text-purple-400">{(u.latest_snapshot?.entropy || 0.001).toFixed(4)}</span>
                          </td>
                          <td className="p-5 text-center">
                            <button 
                              onClick={() => handleToggleStatus(u)}
                              className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${
                                u.status === 'active' 
                                  ? "bg-green-500/10 text-green-500 border border-green-500/20" 
                                  : "bg-red-500/10 text-red-500 border border-red-500/20"
                              }`}
                            >
                              {u.status}
                            </button>
                          </td>
                          <td className="p-5 text-right">
                             <div className="flex items-center justify-end gap-2">
                                <button 
                                  onClick={() => { setUniverse(u); setViewMode("monitor"); }}
                                  className="px-4 py-2 rounded-lg bg-blue-500 text-white text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all shadow-lg shadow-blue-500/20"
                                >
                                  Monitor
                                </button>
                                <button 
                                  onClick={() => handleRename(u)}
                                  className="p-2 rounded-lg bg-white/5 text-white/20 hover:text-white transition-colors"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                                </button>
                             </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="flex-none p-6 flex items-end justify-between border-b border-white/5 bg-white/[0.01]">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.3em] text-blue-500/80 font-bold mb-1">Observation Feed</p>
                  <h2 className="text-3xl font-black text-white">{universe?.name || "Select Universe"}</h2>
                  {universe?.parent_universe_id && (
                    <p className="text-[9px] uppercase tracking-widest text-white/30 mt-2 flex items-center gap-2">
                      <span className="px-1.5 py-0.5 rounded border border-white/10 bg-white/5 text-blue-400 font-bold">Branch</span> 
                      Forked from Universe #{universe.parent_universe_id} at Tick {universe.forked_at_tick}
                    </p>
                  )}
                </div>
            
            <div className="flex items-center gap-8 font-mono">
              <div className="text-right">
                <p className="text-[9px] uppercase tracking-widest text-white/20 mb-1">Global Entropy</p>
                <p className="text-xl font-bold text-blue-400/80">{(universe?.entropy || 0).toFixed(4)}</p>
              </div>
              <div className="text-right">
                <p className="text-[9px] uppercase tracking-widest text-white/20 mb-1">Coherence</p>
                <p className={`text-xl font-bold ${(universe?.structural_coherence || 0) < 0.5 ? 'text-red-400' : 'text-green-400'}`}>
                  {((universe?.structural_coherence || 0) * 100).toFixed(1)}%
                </p>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-auto p-6 custom-scrollbar">
            {/* Analytics Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/5 flex flex-col gap-1">
                <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.4)]">Unified Ticks</span>
                <span className="text-2xl font-black text-white">{analytics?.total_ticks?.toLocaleString() || "---"}</span>
                <span className="text-[9px] text-green-500 font-mono mt-1">+{analytics?.ticks_last_hour || 0} Last Hour</span>
              </div>
              <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/5 flex flex-col gap-1">
                <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-blue-400 drop-shadow-[0_0_8px_rgba(96,165,250,0.4)]">Avg Engine Latency</span>
                <span className="text-2xl font-black text-white">{analytics?.avg_duration_ms || "---"} <small className="text-[10px] opacity-40">ms</small></span>
                <span className="text-[9px] text-white/20 font-mono mt-1">Stable Heartbeat</span>
              </div>
              <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/5 flex flex-col gap-1">
                <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-purple-400 drop-shadow-[0_0_8px_rgba(192,132,252,0.4)]">Macro/Social Load</span>
                <span className="text-2xl font-black text-white">{((analytics?.macro_ratio || 0) * 100).toFixed(1)} <small className="text-[10px] opacity-40">%</small></span>
                <span className="text-[9px] text-white/20 font-mono mt-1">Event Distribution</span>
              </div>
              <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/5 flex flex-col gap-1">
                <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-orange-400 drop-shadow-[0_0_8px_rgba(251,146,60,0.4)]">Active Instances</span>
                <span className="text-2xl font-black text-white">{universes.filter(u => u.status === 'active').length}</span>
                <span className="text-[9px] text-white/20 font-mono mt-1">Total {universes.length} Branches</span>
              </div>
            </div>

            {loading ? (
              <div className="h-40 flex items-center justify-center text-xs text-white/20 gap-3">
                <div className="w-4 h-4 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
                Retrieving Snapshot Stream...
              </div>
            ) : (
              <div className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden glass-effect">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 bg-white/[0.01]">
                      <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-white/40">Tick</th>
                      <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-white/40">Entropy</th>
                      <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-white/40">Stability</th>
                      <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-white/40 text-center">Stress</th>
                      <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-white/40">Entities</th>
                      <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-white/40">SCI</th>
                      <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-white/40">Duration</th>
                      <th className="px-6 py-4 text-right text-[10px] uppercase tracking-widest font-bold text-white/40">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.03]">
                    {snapshots.length > 0 ? snapshots.map((s, idx) => {
                      const nextS = snapshots[idx + 1];
                      const stress = s.metrics?.resource_stress ?? s.state_vector?.resource_stress ?? 0;
                      const popAction = s.metrics?.actor_count > (nextS?.metrics?.actor_count ?? 0) ? 'text-green-400' : 'text-red-400';
                      
                      return (
                      <tr key={s.id} className={`hover:bg-white/[0.02] transition-colors ${s.metrics?.is_macro_tick ? 'bg-blue-500/5' : ''}`}>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className={`text-sm font-black ${s.metrics?.is_macro_tick ? 'text-blue-400' : 'text-white'}`}>#{s.tick}</span>
                            <span className="text-[10px] font-mono text-white/30 uppercase">
                              C{s.metrics?.cycle || 0} • E{s.metrics?.epoch || 0}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1 bg-white/5 rounded-full overflow-hidden">
                              <div className="h-full bg-blue-500/50" style={{ width: `${s.entropy * 100}%` }}></div>
                            </div>
                            <span className="text-[10px] font-mono opacity-60">{s.entropy.toFixed(3)}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`text-xs font-mono ${(s.stability_index || 0) < 0.3 ? 'text-red-400' : 'text-green-400'}`}>
                            {((s.stability_index || 0) * 100).toFixed(1)}%
                          </span>
                        </td>
                        <td className="px-6 py-4">
                           <div className="flex flex-col items-center">
                              <div className="w-12 h-1 bg-white/5 rounded-full overflow-hidden mb-1">
                                <div className={`h-full ${stress > 0.7 ? 'bg-red-500' : 'bg-orange-400/50'}`} style={{ width: `${stress * 100}%` }}></div>
                              </div>
                              <span className={`text-[10px] font-mono ${stress > 0.8 ? 'text-red-500 animate-pulse' : 'text-white/40'}`}>
                                {stress.toFixed(2)}
                              </span>
                           </div>
                        </td>
                        <td className="px-6 py-4">
                           <div className="flex flex-col">
                              <span className="text-xs font-mono text-white/80">
                                {s.metrics?.actor_count || s.metrics?.total_population || s.state_vector?.total_population || 0} <span className="text-[9px] opacity-40 uppercase">Entities</span>
                              </span>
                              {nextS && (
                                <span className={`text-[8px] font-bold ${popAction}`}>
                                  {(s.metrics?.actor_count || s.metrics?.total_population || 0) >= ((nextS?.metrics?.actor_count || nextS?.metrics?.total_population) ?? 0) ? '+' : ''}
                                  {(s.metrics?.actor_count || s.metrics?.total_population || 0) - ((nextS?.metrics?.actor_count || nextS?.metrics?.total_population) ?? 0)}
                                </span>
                              )}
                           </div>
                        </td>
                        <td className="px-6 py-4 text-xs font-mono">
                          <span className="text-blue-400">{(s.metrics?.sci || 0.0).toFixed(4)}</span>
                        </td>
                        <td className="px-6 py-4 text-xs font-mono">
                          <div className="flex flex-col gap-1">
                            <span className={(s.metrics?.tick_duration_ms || 0) > 100 ? "text-orange-400" : "text-white/40"}>
                              {s.metrics?.tick_duration_ms || 0} ms
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button 
                            onClick={() => viewSnapshotDetail(s)}
                            disabled={fetchingDetail}
                            className="text-[9px] uppercase tracking-widest font-bold py-1.5 px-4 rounded-full bg-white/5 border border-white/10 hover:bg-blue-500/20 hover:border-blue-500/30 transition-all"
                          >
                            JSON
                          </button>
                        </td>
                      </tr>
                      );
                    }) : (
                      <tr>
                        <td colSpan={7} className="px-6 py-20 text-center text-sm text-white/20 italic">
                          Waiting for simulation pulse...
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          </>
        )}
        </main>
      </div>

      {/* Modal - JSON Viewer Overlay */}
      {isModalOpen && selectedSnapshot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-10 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-5xl max-h-full bg-[#0d0d10] border border-white/10 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-white/5">
              <div>
                <h2 className="text-xl font-bold">Snapshot Data</h2>
                <p className="text-[10px] uppercase font-mono text-blue-400 tracking-widest mt-1">
                  Universe {universe?.name} • Tick #{selectedSnapshot.tick}
                </p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-white/5 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            <div className="flex-1 overflow-auto p-2">
              <JsonViewer 
                data={selectedSnapshot} 
                prevData={prevSelectedSnapshot}
                title={`Snapshot Details (T-${selectedSnapshot.tick})`} 
              />
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        .glass-effect {
          box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
          height: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </div>
  );
}

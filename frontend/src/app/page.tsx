"use client";

import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import JsonViewer from "@/components/JsonViewer";
import { Centrifuge } from "centrifuge";
import { Activity, Zap, Globe, Plus, LogIn, Shield } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  const [universes, setUniverses] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  
  const centrifugeRef = useRef<Centrifuge | null>(null);

  const fetchUniverses = async () => {
    try {
      const res = await fetch("/api/worldos/universes");
      if (res.ok) {
        const data = await res.json();
        setUniverses(data);
      }
    } catch (err) {
      console.error("Failed to fetch universes", err);
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
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/connection/websocket`;
    const centrifuge = new Centrifuge(wsUrl);
    centrifugeRef.current = centrifuge;
    centrifuge.on("connected", () => setIsConnected(true));
    centrifuge.on("disconnected", () => setIsConnected(false));
    centrifuge.connect();
    return () => {
      if (centrifugeRef.current) centrifugeRef.current.disconnect();
    };
  }, []);

  return (
    <div className="relative min-h-screen bg-background overflow-hidden selection:bg-primary/30">
      {/* Immersive background bits moved to Shell or kept here if needed */}
      
      <div className="relative z-10 p-12 max-w-[1400px] mx-auto">
        <header className="mb-20">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 mb-4"
          >
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 glow-emerald-sm animate-pulse' : 'bg-red-500'}`} />
            <span className="text-[10px] uppercase font-mono tracking-[0.4em] text-muted-foreground/60">Multiverse_Status: Operational</span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-6xl font-display font-black tracking-tighter mb-6 bg-clip-text text-transparent bg-gradient-to-r from-foreground via-foreground/80 to-muted-foreground/40"
          >
            WorldOS <span className="text-primary italic">Portal</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-sm text-muted-foreground max-w-xl leading-relaxed"
          >
            Chào mừng bạn đến với trung tâm giám sát đa vũ trụ v6. Từ đây, bạn có thể khởi tạo các thực tại mới, 
            phân nhánh dòng thời gian và quan sát sự tiến hóa của hàng triệu sinh linh thông qua các luồng dữ liệu thời gian thực.
          </motion.p>
        </header>

        {/* Analytics Summary */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16"
        >
          <div className="p-6 rounded-3xl bg-card/40 border border-border/50 backdrop-blur-md flex flex-col gap-2">
            <span className="text-[10px] uppercase font-bold tracking-widest text-primary">Unified Ticks</span>
            <span className="text-3xl font-display font-black text-foreground">{analytics?.total_ticks?.toLocaleString() || "---"}</span>
            <div className="flex items-center gap-2 mt-auto">
              <Activity size={12} className="text-primary/60" />
              <span className="text-[9px] font-mono text-muted-foreground">FLUX_STABLE_V6</span>
            </div>
          </div>
          <div className="p-6 rounded-3xl bg-card/40 border border-border/50 backdrop-blur-md flex flex-col gap-2">
            <span className="text-[10px] uppercase font-bold tracking-widest text-cosmos">Active Nodes</span>
            <span className="text-3xl font-display font-black text-foreground">{universes.filter(u => u.status === 'active').length}</span>
            <div className="flex items-center gap-2 mt-auto">
              <Globe size={12} className="text-cosmos/60" />
              <span className="text-[9px] font-mono text-muted-foreground">MULTIVERSE_SYNC</span>
            </div>
          </div>
          <div className="p-6 rounded-3xl bg-card/40 border border-border/50 backdrop-blur-md flex flex-col gap-2">
            <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-500">Stability Index</span>
            <span className="text-3xl font-display font-black text-foreground">99.8%</span>
            <div className="flex items-center gap-2 mt-auto">
              <Shield size={12} className="text-emerald-500/60" />
              <span className="text-[9px] font-mono text-muted-foreground">GUARD_OPERATIONAL</span>
            </div>
          </div>
        </motion.div>

        {/* Universe Portal Grid */}
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-display font-bold text-foreground/80 tracking-tight">Thực Tại Khả Dụng</h2>
            <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 border border-primary/20 text-primary text-xs font-bold hover:bg-primary/20 transition-all group">
              <Plus size={16} className="group-hover:rotate-90 transition-transform" />
              <span>Khởi Tạo Vũ Trụ Mới</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {loading ? (
              <div className="col-span-full h-40 flex items-center justify-center opacity-20 italic text-sm tracking-widest">
                Searching for connected nodes...
              </div>
            ) : (
              universes.map((u, i) => (
                <motion.div
                  key={u.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * i }}
                  className="group relative"
                >
                  <Link href="/dashboard" onClick={() => localStorage.setItem("worldos_selected_universe_id", u.id)}>
                    <div className="p-8 rounded-[40px] bg-card/30 border border-border/40 hover:border-primary/40 transition-all duration-500 backdrop-blur-3xl overflow-hidden cursor-pointer h-full flex flex-col">
                      {/* Card Backdrop Glow */}
                      <div className="absolute -top-12 -right-12 w-32 h-32 bg-primary/5 blur-[40px] group-hover:bg-primary/10 transition-colors" />
                      
                      <div className="flex justify-between items-start mb-6">
                        <div className="w-12 h-12 rounded-2xl bg-void/60 border border-white/5 flex items-center justify-center group-hover:glow-primary-sm transition-all">
                          <Zap size={20} className="text-primary/60 group-hover:text-primary transition-colors" />
                        </div>
                        <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${u.status === 'active' ? 'text-emerald-500 bg-emerald-500/10' : 'text-red-500 bg-red-500/10'}`}>
                          {u.status}
                        </div>
                      </div>

                      <h3 className="text-2xl font-display font-bold mb-2 text-foreground group-hover:text-primary transition-colors">
                        {u.name}
                      </h3>
                      
                      <div className="grid grid-cols-2 gap-4 mt-6 font-mono">
                        <div>
                          <p className="text-[8px] text-muted-foreground uppercase opacity-40">Current Tick</p>
                          <p className="text-xs font-bold text-foreground/80">#{u.current_tick || 0}</p>
                        </div>
                        <div>
                          <p className="text-[8px] text-muted-foreground uppercase opacity-40">Stability</p>
                          <p className="text-xs font-bold text-foreground/80">92.4%</p>
                        </div>
                      </div>

                      <div className="mt-auto pt-8 flex items-center justify-between">
                         <span className="text-[10px] text-muted-foreground/40 font-mono">ID_{u.id.toString(16).toUpperCase()}</span>
                         <div className="flex items-center gap-2 text-primary opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0 transition-transform">
                            <span className="text-[10px] font-bold uppercase tracking-widest">Connect</span>
                            <LogIn size={14} />
                         </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

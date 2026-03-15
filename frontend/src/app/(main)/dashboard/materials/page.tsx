"use client";

import React, { Suspense } from "react";
import { useSimulation } from "@/context/SimulationContext";
import MaterialSystemView from "@/components/Simulation/MaterialSystemView";
import { Package, Info, Activity } from "lucide-react";

export default function MaterialsPage() {
  const { universeId, latestSnapshot } = useSimulation();

  return (
    <div className="flex-1 flex flex-col bg-background text-foreground animate-in fade-in duration-500">
      {/* Header section */}
      <header className="p-6 border-b border-border/50 bg-card/20 backdrop-blur-md sticky top-0 z-20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black tracking-tighter flex items-center gap-2 text-gradient-cosmos">
              <Package className="w-6 h-6 text-emerald-400" />
              Hệ Sinh Thái Vật Liệu
            </h1>
            <p className="text-xs text-muted-foreground mt-1 uppercase tracking-widest font-medium opacity-70">
              Cấu trúc bản nguyên & Mạng lưới đột biến nhị phân
            </p>
          </div>
          
          <div className="flex items-center gap-3">
             <div className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center gap-3">
                <Activity className="w-4 h-4 text-emerald-400" />
                <div className="flex flex-col">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Tính ổn định</span>
                  <span className="text-sm font-mono font-bold text-emerald-400">
                    {latestSnapshot?.stability_index ? (latestSnapshot.stability_index * 100).toFixed(1) : "0.0"}%
                  </span>
                </div>
             </div>
             <div className="px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-center gap-3">
                <Package className="w-4 h-4 text-blue-400" />
                <div className="flex flex-col">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Thực thể</span>
                  <span className="text-sm font-mono font-bold text-blue-400">
                    {(latestSnapshot?.metrics?.materials_count ?? "0")}
                  </span>
                </div>
             </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6 overflow-auto">
        {universeId ? (
          <div className="space-y-6">
            <div className="bg-card/30 border border-border/50 rounded-2xl overflow-hidden backdrop-blur-sm shadow-xl">
               <div className="p-4 border-b border-border/30 bg-muted/20 flex items-center gap-2">
                  <Info className="w-4 h-4 text-blue-400" />
                  <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Phân tích cấu trúc vật chất</span>
               </div>
               <div className="p-2 min-h-[600px]">
                  <Suspense fallback={<div className="h-[600px] flex items-center justify-center text-muted-foreground animate-pulse">Đang nạp mạng lưới nhị phân...</div>}>
                    <MaterialSystemView universeId={universeId} />
                  </Suspense>
               </div>
            </div>

            <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-12">
               <div className="p-6 rounded-2xl bg-card/20 border border-border/40 space-y-4">
                  <h2 className="text-sm font-bold uppercase tracking-widest text-emerald-400">Quy tắc Đột biến</h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Vật liệu trong WorldOS không đứng yên. Chúng chịu áp lực từ các trường lực (Knowledge, Power, Wealth, Meaning) 
                    để đột biến thành các dạng thức mới. Mạng lưới DAG bên trên hiển thị các quỹ đạo đột biến có thể xảy ra 
                    khi các điều kiện bản nguyên được thỏa mãn.
                  </p>
               </div>
               <div className="p-6 rounded-2xl bg-card/20 border border-border/40 space-y-4">
                  <h2 className="text-sm font-bold uppercase tracking-widest text-blue-400">Ontology (Bản thể luận)</h2>
                  <ul className="grid grid-cols-2 gap-3">
                    {[
                      { label: "Physical", desc: "Vật chất hữu hình", color: "text-cyan-400" },
                      { label: "Symbolic", desc: "Biểu tượng & Khái niệm", color: "text-purple-400" },
                      { label: "Behavioral", desc: "Khuôn mẫu hành vi", color: "text-orange-400" },
                      { label: "Institutional", desc: "Cấu trúc xã hội", color: "text-blue-400" }
                    ].map(item => (
                      <li key={item.label} className="flex flex-col p-2 bg-white/5 rounded-lg border border-white/5">
                        <span className={`text-xs font-bold ${item.color}`}>{item.label}</span>
                        <span className="text-[10px] text-muted-foreground">{item.desc}</span>
                      </li>
                    ))}
                  </ul>
               </div>
            </section>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-96 space-y-4">
            <div className="w-16 h-16 rounded-full border-2 border-dashed border-muted-foreground/30 animate-spin" />
            <p className="text-muted-foreground font-mono">Chưa xác định Universe ID...</p>
          </div>
        )}
      </main>
    </div>
  );
}

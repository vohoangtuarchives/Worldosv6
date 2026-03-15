"use client";

import React, { useEffect, useState } from "react";
import { useSimulation } from "@/context/SimulationContext";
import { api } from "@/lib/api";
import { HeroCard, type HeroCardEntity } from "@/components/Simulation/HeroCard";
import { Sparkles, Users, Search, Filter, History } from "lucide-react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

export default function HeroesPage() {
  const { universeId } = useSimulation();
  const [heroes, setHeroes] = useState<HeroCardEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("ALL");

  useEffect(() => {
    if (!universeId) return;

    const fetchHeroes = async () => {
      try {
        setLoading(true);
        const data = await api.greatPersons(universeId);
        setHeroes(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to fetch heroes:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchHeroes();
  }, [universeId]);

  const filteredHeroes = heroes.filter((h) => {
    const matchesSearch = h.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === "ALL" || h.entity_type.toUpperCase().includes(filterType);
    return matchesSearch && matchesFilter;
  });

  const heroTypes = [
    { key: "ALL", label: "Tất cả" },
    { key: "PROPHET", label: "Thánh Nhân" },
    { key: "GENERAL", label: "Tướng Quân" },
    { key: "SCIENTIST", label: "Học Giả" },
    { key: "RULER", label: "Minh Quân" },
    { key: "MERCHANT", label: "Phú Hộ" },
    { key: "ARTIST", label: "Nghệ Sĩ" },
  ];

  return (
    <div className="flex-1 flex flex-col bg-background text-foreground animate-in fade-in duration-500">
      <header className="p-6 border-b border-border/50 bg-card/20 backdrop-blur-md sticky top-0 z-20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
             <h1 className="text-2xl font-black tracking-tighter flex items-center gap-2 text-gradient-amber">
               <Sparkles className="w-6 h-6 text-amber-400" />
               Đền Thờ Anh Hùng
             </h1>
             <p className="text-xs text-muted-foreground mt-1 uppercase tracking-widest font-medium opacity-70">
               Những cá nhân kiệt xuất làm thay đổi quỹ đạo nhị phân
             </p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
             <div className="relative group">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-amber-400 transition-colors" />
               <input 
                type="text" 
                placeholder="Tìm tên vĩ nhân..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 bg-card/40 border border-border/50 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-amber-500/50 w-full md:w-64 transition-all"
               />
             </div>

             <div className="flex items-center gap-1 bg-card/40 border border-border/50 rounded-xl p-1 overflow-x-auto max-w-[calc(100vw-2rem)] custom-scrollbar">
                {heroTypes.map((type) => (
                  <button
                    key={type.key}
                    onClick={() => setFilterType(type.key)}
                    className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-tighter rounded-lg transition-all whitespace-nowrap ${
                      filterType === type.key 
                        ? "bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow-sm"
                        : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
             </div>
          </div>
        </div>
      </header>

      <main className="flex-1 p-6 relative">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-96 gap-4">
            <LoadingSpinner size="lg" className="text-amber-500" />
            <p className="text-sm font-mono text-muted-foreground animate-pulse">Đang triệu hồi các linh hồn kiệt xuất...</p>
          </div>
        ) : filteredHeroes.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 pb-20">
            {filteredHeroes.map((hero) => (
              <HeroCard key={hero.id} entity={hero} universeId={universeId} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-96 space-y-4">
            <div className="p-6 rounded-full bg-card/20 border border-dashed border-border/50">
               <Users className="w-12 h-12 text-muted-foreground/30" />
            </div>
            <div className="text-center">
               <h3 className="text-lg font-bold text-foreground/80">Không tìm thấy vĩ nhân nào</h3>
               <p className="text-sm text-white/40 mt-1 max-w-sm">
                 Vũ trụ này có vẻ đang ở giai đoạn hỗn mang hoặc chưa đạt đủ áp lực lịch sử để kết tinh các anh hùng.
               </p>
            </div>
            {(searchTerm || filterType !== "ALL") && (
              <button 
                onClick={() => { setSearchTerm(""); setFilterType("ALL"); }}
                className="text-xs font-bold text-amber-500 hover:text-amber-400 uppercase tracking-widest mt-4 flex items-center gap-2"
              >
                <Filter className="w-3 h-3" /> Xóa bộ lọc
              </button>
            )}
          </div>
        )}

        {/* Footer info block */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-xl border-t border-border/50 z-30 flex items-center justify-center gap-8 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
           <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-muted-foreground" />
              <div className="flex flex-col">
                 <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Tổng số vĩ nhân</span>
                 <span className="text-sm font-mono font-bold text-amber-400">{heroes.length}</span>
              </div>
           </div>
           <div className="w-px h-8 bg-border/50" />
           <div className="flex items-center gap-2 text-xs text-muted-foreground italic">
              "Kinh điển sinh ra từ sự hỗn mang, anh hùng xuất hiện khi trật tự sụp đổ."
           </div>
        </div>
      </main>
    </div>
  );
}

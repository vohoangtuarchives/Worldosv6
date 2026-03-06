"use client";
import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { MaterialDagGraph, type MaterialDagNode, type MaterialDagEdge } from "@/components/Simulation/MaterialDagGraph";

type UIMaterial = {
  id: string;
  name: string;
  type: string;
  description: string;
  discovered: boolean;
  rarity?: string;
  universe?: string;
  culture?: string;
};

type DagView = "library" | "dag";

export default function MaterialsPage() {
  const [filter, setFilter] = useState("All");
  const [materials, setMaterials] = useState<UIMaterial[]>([]);
  const [universeId, setUniverseId] = useState<number | null>(null);
  const [view, setView] = useState<DagView>("library");
  const [dagNodes, setDagNodes] = useState<MaterialDagNode[]>([]);
  const [dagEdges, setDagEdges] = useState<MaterialDagEdge[]>([]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = window.localStorage.getItem("universe_id");
      setUniverseId(stored ? Number(stored) : null);
    }
  }, []);
  type NodeResp = { id: string; position?: { x: number; y: number }; data?: { label?: string; ontology?: string; culture?: string; description?: string; lifecycle?: string } };
  type EdgeResp = { id: string; source: string; target: string; label?: string };
  useEffect(() => {
    if (!universeId) return;
    api.materialDag(universeId).then((res: { ok?: boolean; nodes: NodeResp[]; edges?: EdgeResp[] }) => {
      const nodes = res.nodes || [];
      const list: UIMaterial[] = nodes.map((n: NodeResp) => ({
        id: n.id,
        name: n.data?.label || `Material ${n.id}`,
        type: n.data?.ontology || "unknown",
        culture: n.data?.culture || "Common",
        description: n.data?.description || "",
        discovered: (n.data?.lifecycle || "dormant") !== "dormant",
        rarity: "Common",
        universe: "This Universe",
      }));
      setMaterials(list);
      setDagNodes(nodes.map((n) => ({ id: n.id, position: n.position ?? { x: 0, y: 0 }, data: n.data ?? {} })));
      setDagEdges((res.edges || []).map((e) => ({ id: e.id, source: e.source, target: e.target, label: e.label })));
    });
  }, [universeId]);

  const filteredMaterials = useMemo(
    () => {
      if (filter === "All") return materials;
      // Check if filter is a culture or type
      const isCulture = ["Imperial", "Mystic", "Common"].includes(filter);
      if (isCulture) return materials.filter((m) => m.culture === filter);
      return materials.filter((m) => m.type === filter);
    },
    [materials, filter]
  );
  
  const types = useMemo(() => ["All", ...Array.from(new Set(materials.map((m) => m.type)))], [materials]);
  const cultures = useMemo(() => Array.from(new Set(materials.map((m) => m.culture))).filter(Boolean), [materials]);

  return (
    <div className="flex h-[calc(100vh-3.5rem)]">
      {/* Left Sidebar Navigation */}
      <div className="w-64 border-r border-border bg-card/30 p-4 space-y-6 overflow-y-auto">
        <div>
          <div className="font-semibold text-lg px-2 mb-2">Ontology</div>
          <nav className="space-y-1">
            {types.map((type) => (
              <button
                key={type}
                onClick={() => setFilter(type)}
                className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                  filter === type
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
                <span className="ml-auto float-right text-xs opacity-50">
                  {type === "All" ? materials.length : materials.filter((m) => m.type === type).length}
                </span>
              </button>
            ))}
          </nav>
        </div>

        <div>
          <div className="font-semibold text-lg px-2 mb-2">Culture</div>
          <nav className="space-y-1">
            {cultures.map((cult) => (
              <button
                key={cult}
                onClick={() => setFilter(cult as string)}
                className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                  filter === cult
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {cult as string}
                <span className="ml-auto float-right text-xs opacity-50">
                  {materials.filter((m) => m.culture === cult).length}
                </span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-8 pt-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-bold tracking-tight text-gradient-cosmos">Material Library</h2>
          <div className="flex rounded-lg border border-border bg-muted/30 p-0.5">
            <button
              type="button"
              onClick={() => setView("library")}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${view === "library" ? "bg-background text-foreground shadow" : "text-muted-foreground hover:text-foreground"}`}
            >
              Library
            </button>
            <button
              type="button"
              onClick={() => setView("dag")}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${view === "dag" ? "bg-background text-foreground shadow" : "text-muted-foreground hover:text-foreground"}`}
            >
              Material DAG
            </button>
          </div>
        </div>

        {view === "dag" && (
          <div className="mb-8">
            <p className="text-sm text-muted-foreground mb-2">Đồ thị tiến hóa vật chất (parent → child). Node viền xanh = đang active trong universe này.</p>
            <MaterialDagGraph nodes={dagNodes} edges={dagEdges} className="w-full" />
          </div>
        )}

        {view === "library" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {filteredMaterials.map((material) => (
          <div 
            key={material.id} 
            className={`group relative overflow-hidden rounded-xl border bg-card text-card-foreground shadow-sm transition-all hover:shadow-md hover:scale-[1.02] ${!material.discovered ? 'opacity-50 grayscale pointer-events-none' : ''}`}
          >
            <div className="aspect-square w-full bg-muted/20 relative">
               {/* Placeholder for Material Image */}
               <div className={`absolute inset-0 flex items-center justify-center text-4xl font-bold text-muted-foreground/20 ${!material.discovered ? 'blur-sm' : ''}`}>
                 {material.name.charAt(0)}
               </div>
               
               {!material.discovered && (
                   <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                       <span className="px-3 py-1 bg-black/60 rounded-full text-xs font-mono text-white border border-white/20">UNDISCOVERED</span>
                   </div>
               )}
               
               <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-background/80 backdrop-blur border border-border">
                   {material.rarity}
               </div>
            </div>
            
            <div className="p-4 space-y-2">
              <div className="flex justify-between items-start">
                  <h3 className="font-semibold leading-none tracking-tight line-clamp-1" title={material.name}>{material.name}</h3>
                  <span className="text-xs text-muted-foreground font-mono">{material.type}</span>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem]">
                {material.description}
              </p>
              
              <div className="pt-2 flex items-center justify-between border-t border-border/50 mt-2">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <span className={`w-2 h-2 rounded-full ${material.discovered ? 'bg-green-500' : 'bg-gray-500'}`}></span>
                      {material.universe}
                  </span>
                  <button className="text-xs font-medium text-primary hover:text-primary/80 transition-colors">
                      View Data
                  </button>
              </div>
            </div>
          </div>
        ))}
        </div>
        )}
      </div>
    </div>
  );
}

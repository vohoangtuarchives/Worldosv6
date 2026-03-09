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
      <div className="w-64 border-r border-border bg-card/40 p-4 space-y-6 overflow-y-auto">
        <div>
          <div className="font-semibold text-lg text-foreground px-2 mb-2">Ontology</div>
          <nav className="space-y-1">
            {types.map((type) => (
              <button
                key={type}
                onClick={() => setFilter(type)}
                className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${filter === type
                    ? "bg-muted text-cyan-400 font-medium"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
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
          <div className="font-semibold text-lg text-foreground px-2 mb-2">Culture</div>
          <nav className="space-y-1">
            {cultures.map((cult) => (
              <button
                key={cult}
                onClick={() => setFilter(cult as string)}
                className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${filter === cult
                    ? "bg-muted text-cyan-400 font-medium"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
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
          <h2 className="text-3xl font-bold tracking-tight text-gradient-cosmos glow-cosmos-text">Material Library</h2>
          <div className="flex rounded-lg border border-border bg-card/60 p-0.5">
            <button
              type="button"
              onClick={() => setView("library")}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${view === "library" ? "bg-muted text-foreground shadow" : "text-muted-foreground hover:text-foreground"}`}
            >
              Library
            </button>
            <button
              type="button"
              onClick={() => setView("dag")}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${view === "dag" ? "bg-muted text-foreground shadow" : "text-muted-foreground hover:text-foreground"}`}
            >
              Material DAG
            </button>
          </div>
        </div>

        {view === "dag" && (
          <div className="mb-8">
            <p className="text-sm text-muted-foreground mb-4">Đồ thị tiến hóa vật chất (parent → child). Node viền xanh = đang kích hoạt trong vũ trụ này.</p>
            <MaterialDagGraph nodes={dagNodes} edges={dagEdges} className="w-full" />
          </div>
        )}

        {view === "library" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredMaterials.map((material) => (
              <div
                key={material.id}
                className={`group relative overflow-hidden rounded-xl border border-border bg-card/40 text-foreground shadow-sm transition-all hover:shadow-cyan-900/20 hover:border-border hover:scale-[1.02] ${!material.discovered ? 'opacity-50 grayscale pointer-events-none' : ''}`}
              >
                <div className="aspect-video w-full bg-card/50 relative border-b border-border">
                  <div className={`absolute inset-0 flex items-center justify-center text-4xl font-bold text-muted-foreground ${!material.discovered ? 'blur-sm' : ''}`}>
                    {material.name.charAt(0)}
                  </div>

                  {!material.discovered && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                      <span className="px-3 py-1 bg-black/80 rounded-full text-xs font-mono text-muted-foreground border border-border">UNDISCOVERED</span>
                    </div>
                  )}

                  <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-card/80 backdrop-blur border border-border text-foreground">
                    {material.rarity}
                  </div>
                </div>

                <div className="p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <h3 className="font-semibold text-foreground leading-tight tracking-tight line-clamp-1" title={material.name}>{material.name}</h3>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-mono tracking-wider">{material.type}</span>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem]">
                    {material.description}
                  </p>

                  <div className="pt-3 flex items-center justify-between border-t border-border mt-2">
                    <span className="text-xs text-muted-foreground font-mono flex items-center gap-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${material.discovered ? 'bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.6)]' : 'bg-muted'}`}></span>
                      {material.universe}
                    </span>
                    <button className="text-[10px] font-semibold tracking-widest text-cyan-500/80 hover:text-cyan-400 transition-colors uppercase">
                      Inspect
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

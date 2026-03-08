"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { MaterialDagGraph, type MaterialDagNode, type MaterialDagEdge } from "@/components/Simulation/MaterialDagGraph";
import { CausalTopologyGraph } from "@/components/Simulation/CausalTopologyGraph";

export default function NetworksPage() {
  const [universeId, setUniverseId] = useState<number | null>(null);
  const [dagNodes, setDagNodes] = useState<MaterialDagNode[]>([]);
  const [dagEdges, setDagEdges] = useState<MaterialDagEdge[]>([]);
  const [graphNodes, setGraphNodes] = useState<any[]>([]);
  const [graphEdges, setGraphEdges] = useState<any[]>([]);

  useEffect(() => {
    api.universes().then((list: { id: number }[]) => {
      const id = list[0]?.id ?? null;
      setUniverseId(id);
      if (id) {
        api.materialDag(id).then((d: { nodes: any[]; edges: any[] }) => {
          const n: MaterialDagNode[] = d.nodes.map((x: any) => ({
            id: String(x.id ?? x.slug ?? Math.random()),
            position: { x: 0, y: 0 },
            data: {
              label: x.label ?? x.name ?? x.slug ?? "Material",
              ontology: x.ontology ?? "",
              lifecycle: x.lifecycle ?? x.status ?? "inactive",
            },
            type: "materialNode",
          }));
          const e: MaterialDagEdge[] = d.edges.map((y: any, i: number) => ({
            id: String(y.id ?? `e-${i}`),
            source: String(y.source ?? y.parent ?? ""),
            target: String(y.target ?? y.child ?? ""),
          }));
          setDagNodes(n);
          setDagEdges(e);
        });
        api.graph(id).then((g: { nodes: any[]; edges: any[] }) => {
          setGraphNodes(
            g.nodes.map((n: any, i: number) => ({
              id: String(n.id ?? i),
              type: (n.type ?? "Snapshot") as "Universe" | "Snapshot" | "MythScar",
              label: String(n.label ?? n.name ?? n.tick ?? ""),
              data: n.data ?? {},
              x: n.x,
              y: n.y,
            }))
          );
          setGraphEdges(
            g.edges.map((e: any, i: number) => ({
              id: String(e.id ?? i),
              source: String(e.source),
              target: String(e.target),
            }))
          );
        });
      }
    });
  }, []);

  return (
    <div className="container mx-auto py-6 space-y-8">
      <h1 className="text-xl font-semibold">Simulation Networks</h1>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div>
          <h2 className="text-sm font-semibold mb-2">Mutation Network</h2>
          <MaterialDagGraph nodes={dagNodes} edges={dagEdges} />
        </div>
        <div>
          <h2 className="text-sm font-semibold mb-2">Causal Topology Graph</h2>
          <CausalTopologyGraph nodes={graphNodes} edges={graphEdges} />
        </div>
      </div>
    </div>
  );
}

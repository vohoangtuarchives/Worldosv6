 "use client";
 import { useEffect, useState } from "react";
 import { api } from "@/lib/api";
 
import Link from "next/link";

 export default function NarrativePage() {
  const [universeId, setUniverseId] = useState<number | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = window.localStorage.getItem("universe_id");
      setUniverseId(stored ? Number(stored) : null);
    }
  }, []);
  type ChronicleContent = { title?: string; text?: string } | string | null | undefined;
  type Chronicle = { to_tick?: number; from_tick?: number; type?: string; content?: ChronicleContent };
  type EventRow = { tick: number; type: string; title: string; description: string; impact: string };
  const [events, setEvents] = useState<EventRow[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!universeId) return;
    setLoading(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    api.chronicle(universeId, page, 100).then((res: any) => {
      const rows: Chronicle[] = res.data;
      setTotalPages(res.last_page);
      
      const getTitleDesc = (c: ChronicleContent) => {
        if (typeof c === "string") return { t: c, d: c };
        if (c && typeof c === "object") {
          const o = c as { title?: string; text?: string };
          return { t: o.title ?? "event", d: o.text ?? "" };
        }
        return { t: "event", d: "" };
      };
      const mapped: EventRow[] = rows.map((r) => {
        const td = getTitleDesc(r.content);
        return {
          tick: r.to_tick ?? r.from_tick ?? 0,
          type: r.type ?? "event",
          title: td.t,
          description: td.d,
          impact: "Medium",
        };
      });
      setEvents(mapped);
    }).finally(() => setLoading(false));
  }, [universeId, page]);

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight text-gradient-cosmos">Narrative Chronicles</h2>
        <div className="flex items-center space-x-2">
          {loading && <div className="text-sm text-muted-foreground animate-pulse">Loading...</div>}
           <Link href="/dashboard/narrative/agents">
             <button className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 py-2">
               Configure Agents
             </button>
           </Link>
           <button className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2">
             Filter by Era
           </button>
        </div>
      </div>
      
      <div className="rounded-md border border-border">
        <div className="relative w-full overflow-auto">
          <table className="w-full caption-bottom text-sm">
            <thead className="[&_tr]:border-b">
              <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground w-[100px]">Tick</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground w-[150px]">Type</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Event</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground w-[100px]">Impact</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground w-[100px]">Action</th>
              </tr>
            </thead>
            <tbody className="[&_tr:last-child]:border-0">
              {events.map((event, i) => (
                <tr key={i} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                  <td className="p-4 align-middle font-mono">{event.tick}</td>
                  <td className="p-4 align-middle">
                    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${
                        event.type === 'cascade' ? 'border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80' :
                        event.type === 'decision' ? 'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80' :
                        event.type === 'none' ? 'border-transparent text-muted-foreground opacity-50' :
                        'text-foreground'
                    }`}>
                        {event.type === 'none' ? 'empty' : event.type}
                    </span>
                  </td>
                  <td className="p-4 align-middle">
                    <div className="font-semibold">{event.title}</div>
                    <div className="text-xs text-muted-foreground hidden md:block">{event.description}</div>
                  </td>
                   <td className="p-4 align-middle">
                     <span className={`font-medium ${event.impact === 'High' ? 'text-destructive' : 'text-muted-foreground'}`}>
                        {event.impact}
                     </span>
                   </td>
                   <td className="p-4 align-middle">
                     <button className="text-primary hover:underline">Details</button>
                   </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
            Page {page} of {totalPages || 1}
        </div>
        <div className="space-x-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1 || loading}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-8 px-4 py-2"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page >= totalPages || loading}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-8 px-4 py-2"
            >
              Next
            </button>
        </div>
      </div>
    </div>
  );
}

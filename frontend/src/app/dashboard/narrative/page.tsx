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
  type Chronicle = { to_tick?: number; from_tick?: number; type?: string; content?: string | null; raw_payload?: { action?: string; description?: string } | null; perceived_archive_snapshot?: Record<string, unknown> | null };
  type EventRow = { tick: number; type: string; title: string; description: string; impact: string };
  const [events, setEvents] = useState<EventRow[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<EventRow | null>(null);

  useEffect(() => {
    if (!universeId) return;
    setLoading(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    api.chronicle(universeId, page, 100).then((res: any) => {
      const rows: Chronicle[] = res.data;
      setTotalPages(res.last_page);

      const mapped: EventRow[] = rows.map((r) => {
        // Backend stores narrative text in raw_payload.description
        const description = r.raw_payload?.description
          ?? (typeof r.content === 'string' ? r.content : null)
          ?? "";
        // Use type as title (capitalized), fallback to 'event'
        const typeLabel = (r.type ?? "event").replace(/_/g, " ");
        return {
          tick: r.to_tick ?? r.from_tick ?? 0,
          type: r.type ?? "event",
          title: typeLabel,
          description,
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
                    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${event.type === 'cascade' ? 'border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80' :
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
                    <button
                      onClick={() => setSelectedEvent(event)}
                      className="text-primary hover:underline font-medium"
                    >
                      Details
                    </button>
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

      {/* Details Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-slate-900 border border-cyan-500/30 rounded-xl max-w-2xl w-full shadow-2xl shadow-cyan-900/40 overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-white/5 bg-gradient-to-r from-cyan-500/10 to-transparent flex justify-between items-center">
              <div>
                <div className="text-[10px] text-cyan-400 font-mono uppercase tracking-widest mb-1">Chronicle Detail #Tick {selectedEvent.tick}</div>
                <h3 className="text-xl font-bold text-white">{selectedEvent.title}</h3>
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            <div className="p-8">
              <div className="bg-black/40 rounded-lg p-6 border border-white/5 mb-6">
                <p className="text-slate-200 leading-relaxed font-serif italic text-lg whitespace-pre-wrap">
                  "{selectedEvent.description || "Không có dữ liệu chi tiết cho sự kiện này."}"
                </p>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex gap-4">
                  <div className="text-center">
                    <div className="text-[8px] text-slate-500 uppercase">Impact</div>
                    <div className={`text-xs font-bold ${selectedEvent.impact === 'High' ? 'text-red-400' : 'text-cyan-400'}`}>{selectedEvent.impact}</div>
                  </div>
                  <div className="text-center border-l border-white/10 pl-4">
                    <div className="text-[8px] text-slate-500 uppercase">Type</div>
                    <div className="text-xs font-bold text-white uppercase">{selectedEvent.type}</div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="bg-cyan-600 hover:bg-cyan-500 text-white px-6 py-2 rounded-lg font-bold text-sm transition-all shadow-lg shadow-cyan-900/40"
                >
                  Close Archive
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useMemo } from "react";

interface JsonViewerProps {
  data: any;
  prevData?: any;
  title?: string;
}

export default function JsonViewer({ data, prevData, title = "Simulation Data" }: JsonViewerProps) {
  const [copied, setCopied] = useState(false);
  const [showDiff, setShowDiff] = useState(true);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy!", err);
    }
  };

  // Helper to compare and format values
  const getDisplayData = (current: any, previous: any): any => {
    if (!previous || !showDiff) return current;

    if (Array.isArray(current)) {
      return current.map((item, i) => 
        getDisplayData(item, Array.isArray(previous) ? previous[i] : undefined)
      );
    }

    if (typeof current === "object" && current !== null) {
      const result: any = {};
      Object.keys(current).forEach(key => {
        result[key] = getDisplayData(current[key], previous[key]);
      });
      return result;
    }

    if (typeof current === "number" && typeof previous === "number") {
      const diff = current - previous;
      if (diff === 0) return current;
      
      const diffStr = diff > 0 ? ` (+${diff.toFixed(4)})` : ` (${diff.toFixed(4)})`;
      return `${current}${diffStr}`;
    }

    return current;
  };

  const displayData = useMemo(() => getDisplayData(data, prevData), [data, prevData, showDiff]);

  return (
    <div className="w-full p-4 md:p-6 bg-white/[0.02] border border-white/5 rounded-2xl">
      <div className="flex items-center justify-between mb-4 border-b border-border pb-3">
        <h2 className="text-xl font-mono font-bold text-primary">{title}</h2>
        <div className="flex items-center gap-3">
          {prevData && (
            <button
              onClick={() => setShowDiff(!showDiff)}
              className={`px-3 py-1 text-[10px] uppercase font-bold rounded-full border transition-all ${
                showDiff ? "bg-blue-500/20 border-blue-500/50 text-blue-400" : "bg-white/5 border-white/10 text-white/40"
              }`}
            >
              {showDiff ? "Delta: ON" : "Delta: OFF"}
            </button>
          )}
          <button
            onClick={handleCopy}
            className={`px-4 py-1.5 rounded text-sm font-medium transition-all ${
              copied
                ? "bg-green-600 text-white"
                : "bg-primary text-primary-foreground hover:opacity-90 active:scale-95"
            }`}
          >
            {copied ? "✓ Copied!" : "Copy JSON"}
          </button>
        </div>
      </div>
      
      <div className="relative group">
        <pre className="p-4 bg-black/40 rounded-xl overflow-x-auto text-sm font-mono leading-relaxed custom-scrollbar max-h-[60vh]">
          {JSON.stringify(displayData, null, 2).split("\n").map((line, i) => {
            const hasPositive = line.includes("(+");
            const hasNegative = line.includes("(-");
            
            return (
              <div key={i} className={hasPositive ? "text-green-400/90" : hasNegative ? "text-red-400/90" : "text-blue-400/80"}>
                {line}
              </div>
            );
          })}
        </pre>
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-muted-foreground bg-background/80 px-2 py-0.5 rounded">
          {typeof window !== 'undefined' ? `${(JSON.stringify(data).length / 1024).toFixed(2)} KB` : ''}
        </div>
      </div>
      
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.2);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #333;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #444;
        }
      `}</style>
    </div>
  );
}

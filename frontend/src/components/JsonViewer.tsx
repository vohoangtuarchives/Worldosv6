"use client";

import { useMemo, useState } from "react";

type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

interface JsonViewerProps {
  data: JsonValue;
  prevData?: JsonValue;
  title?: string;
}

function diffJson(current: JsonValue, previous: JsonValue | undefined, showDiff: boolean): JsonValue {
  if (!showDiff || previous === undefined) {
    return current;
  }

  if (Array.isArray(current)) {
    const previousArray = Array.isArray(previous) ? previous : [];
    return current.map((item, index) => diffJson(item, previousArray[index], showDiff));
  }

  if (typeof current === "object" && current !== null) {
    const previousObject =
      typeof previous === "object" && previous !== null && !Array.isArray(previous)
        ? previous
        : {};

    return Object.fromEntries(
      Object.entries(current).map(([key, value]) => [
        key,
        diffJson(value, (previousObject as Record<string, JsonValue | undefined>)[key], showDiff),
      ]),
    );
  }

  if (typeof current === "number" && typeof previous === "number") {
    const diff = current - previous;
    if (diff === 0) {
      return current;
    }

    const suffix = diff > 0 ? ` (+${diff.toFixed(4)})` : ` (${diff.toFixed(4)})`;
    return `${current}${suffix}`;
  }

  return current;
}

export default function JsonViewer({ data, prevData, title = "Simulation Data" }: JsonViewerProps) {
  const [copied, setCopied] = useState(false);
  const [showDiff, setShowDiff] = useState(true);

  const displayData = useMemo(() => diffJson(data, prevData, showDiff), [data, prevData, showDiff]);
  const serializedData = useMemo(() => JSON.stringify(data), [data]);
  const dataSizeLabel = useMemo(() => `${(serializedData.length / 1024).toFixed(2)} KB`, [serializedData]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy JSON", error);
    }
  };

  return (
    <div className="w-full rounded-2xl border border-white/5 bg-white/[0.02] p-4 md:p-6">
      <div className="mb-4 flex items-center justify-between border-b border-border pb-3">
        <h2 className="text-xl font-mono font-bold text-primary">{title}</h2>
        <div className="flex items-center gap-3">
          {prevData !== undefined && (
            <button
              onClick={() => setShowDiff((value) => !value)}
              className={`rounded-full border px-3 py-1 text-[10px] font-bold uppercase transition-all ${
                showDiff ? "border-blue-500/50 bg-blue-500/20 text-blue-400" : "border-white/10 bg-white/5 text-white/40"
              }`}
            >
              {showDiff ? "Delta: ON" : "Delta: OFF"}
            </button>
          )}
          <button
            onClick={handleCopy}
            className={`rounded px-4 py-1.5 text-sm font-medium transition-all ${
              copied ? "bg-green-600 text-white" : "bg-primary text-primary-foreground hover:opacity-90 active:scale-95"
            }`}
          >
            {copied ? "Copied" : "Copy JSON"}
          </button>
        </div>
      </div>

      <div className="group relative">
        <pre className="custom-scrollbar max-h-[60vh] overflow-x-auto rounded-xl bg-black/40 p-4 text-sm leading-relaxed font-mono">
          {JSON.stringify(displayData, null, 2)
            .split("\n")
            .map((line, index) => {
              const hasPositive = line.includes("(+");
              const hasNegative = line.includes("(-");

              return (
                <div key={index} className={hasPositive ? "text-green-400/90" : hasNegative ? "text-red-400/90" : "text-blue-400/80"}>
                  {line}
                </div>
              );
            })}
        </pre>
        <div className="absolute top-2 right-2 rounded bg-background/80 px-2 py-0.5 text-[10px] text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
          {dataSizeLabel}
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

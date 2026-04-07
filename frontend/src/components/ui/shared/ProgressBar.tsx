'use client';

interface ProgressBarProps {
  value: number;
  max?: number;
  label?: string;
  showPercent?: boolean;
  color?: 'cyan' | 'emerald' | 'rose' | 'amber' | 'violet' | 'indigo' | 'slate';
  size?: 'sm' | 'md';
}

const colorMap: Record<string, { bar: string; bg: string }> = {
  cyan:    { bar: 'bg-cyan-400',    bg: 'bg-cyan-500/10'    },
  emerald: { bar: 'bg-emerald-400', bg: 'bg-emerald-500/10' },
  rose:    { bar: 'bg-rose-400',    bg: 'bg-rose-500/10'    },
  amber:   { bar: 'bg-amber-400',   bg: 'bg-amber-500/10'   },
  violet:  { bar: 'bg-violet-400',  bg: 'bg-violet-500/10'  },
  indigo:  { bar: 'bg-indigo-400',  bg: 'bg-indigo-500/10'  },
  slate:   { bar: 'bg-slate-400',   bg: 'bg-slate-500/10'   },
};

export default function ProgressBar({
  value,
  max = 1,
  label,
  showPercent = true,
  color = 'cyan',
  size = 'md',
}: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const colors = colorMap[color] ?? colorMap.cyan;
  const h = size === 'sm' ? 'h-1.5' : 'h-2.5';

  return (
    <div className="w-full">
      {(label || showPercent) && (
        <div className="mb-1.5 flex items-center justify-between">
          {label && <span className="text-xs text-slate-400">{label}</span>}
          {showPercent && <span className="text-xs font-mono text-slate-500">{pct.toFixed(0)}%</span>}
        </div>
      )}
      <div className={`w-full ${h} rounded-full ${colors.bg}`}>
        <div
          className={`${h} rounded-full ${colors.bar} transition-all duration-500`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

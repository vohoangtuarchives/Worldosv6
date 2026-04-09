'use client';

import type { LucideIcon } from 'lucide-react';
import { PackageOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: LucideIcon;
  title?: string;
  message?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export default function EmptyState({
  icon: Icon = PackageOpen,
  title = 'No data yet',
  message = 'There is nothing to display at this time.',
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-3xl border border-dashed',
        'border-slate-800 bg-[var(--bg-surface)]/40 px-8 py-20 text-center',
        className,
      )}
    >
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/60">
        <Icon size={28} className="text-slate-600" />
      </div>
      <h3 className="text-lg font-bold tracking-tight text-slate-400">{title}</h3>
      <p className="mt-2 max-w-xs text-sm leading-relaxed text-slate-600">{message}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="mt-6 rounded-xl border border-cyan-500/20 bg-cyan-500/10 px-5 py-2.5 text-sm font-bold text-cyan-300 transition hover:bg-cyan-500/20"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

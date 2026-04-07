'use client';

import type { LucideIcon } from 'lucide-react';
import { PackageOpen } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title?: string;
  message?: string;
}

export default function EmptyState({
  icon: Icon = PackageOpen,
  title = 'No data yet',
  message = 'There is nothing to display at this time.',
}: EmptyStateProps) {
  return (
    <div className="rounded-[40px] border border-slate-800 bg-slate-950/60 p-20 text-center">
      <Icon size={64} className="mx-auto text-slate-800 mb-6" />
      <h2 className="text-2xl font-black text-slate-500 tracking-tight">{title}</h2>
      <p className="mt-2 text-slate-600 max-w-sm mx-auto">{message}</p>
    </div>
  );
}

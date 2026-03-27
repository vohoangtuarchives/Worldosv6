'use client';

import React, { type ReactNode } from 'react';
import { motion } from 'framer-motion';

/* ─────────────────────────────────────────────
   HUDCard — Thẻ chứa nội dung chính
   ───────────────────────────────────────────── */
export function HUDCard({
  children,
  className = '',
  title,
  icon: Icon,
  color = 'primary',
}: {
  children: ReactNode;
  className?: string;
  title?: string;
  icon?: React.ComponentType<{ className?: string }>;
  color?: string;
}) {
  const colorMap: Record<string, string> = {
    primary: 'text-sky-500',
    secondary: 'text-indigo-500',
    destructive: 'text-rose-500',
    orange: 'text-orange-500',
  };
  const iconColor = colorMap[color] ?? 'text-sky-500';

  return (
    <div
      className={`relative group rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden transition-all hover:shadow-md ${className}`}
    >
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-sky-500/20 via-sky-500/5 to-transparent pointer-events-none" />
      {title && (
        <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
          {Icon && <Icon className={`w-4 h-4 ${iconColor}`} />}
          <span className="font-display text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
            {title}
          </span>
        </div>
      )}
      <div className="p-5 relative">{children}</div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   HUDBadge — Nhãn trạng thái nhỏ
   ───────────────────────────────────────────── */
export function HUDBadge({
  children,
  className = '',
  color = 'primary',
}: {
  children: ReactNode;
  className?: string;
  color?: 'primary' | 'secondary' | 'destructive' | 'neutral' | 'orange';
}) {
  const styles: Record<string, string> = {
    primary: 'border-sky-100 bg-sky-50 text-sky-600',
    secondary: 'border-indigo-100 bg-indigo-50 text-indigo-600',
    destructive: 'border-rose-100 bg-rose-50 text-rose-600',
    neutral: 'border-slate-200 bg-slate-100 text-slate-500',
    orange: 'border-orange-100 bg-orange-50 text-orange-600',
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-wider border shadow-sm ${styles[color]} ${className}`}
    >
      {children}
    </span>
  );
}

/* ─────────────────────────────────────────────
   HUDProgress — Thanh tiến trình phát sáng
   ───────────────────────────────────────────── */
export function HUDProgress({
  value,
  className = '',
  color = 'primary',
}: {
  value: number;
  className?: string;
  color?: 'primary' | 'secondary';
}) {
  return (
    <div className={`h-1.5 w-full bg-slate-100 rounded-full overflow-hidden ${className}`}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className={`h-full rounded-full ${
          color === 'primary'
            ? 'bg-sky-500'
            : 'bg-indigo-500'
        }`}
      />
    </div>
  );
}

/* ─────────────────────────────────────────────
   DataValue — Hiển thị chỉ số lớn + nhãn
   ───────────────────────────────────────────── */
export function DataValue({
  value,
  label,
  unit,
}: {
  value: string | number;
  label?: string;
  unit?: string;
}) {
  const formatted =
    typeof value === 'number'
      ? value.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 2 })
      : value;

  return (
    <div className="flex flex-col">
      {label && (
        <span className="font-display text-[10px] uppercase font-bold tracking-widest text-slate-400 mb-1">
          {label}
        </span>
      )}
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-black text-slate-900 tracking-tighter">{formatted}</span>
        {unit && <span className="text-[11px] font-black text-sky-500/60">{unit}</span>}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   HUDSectionHeader — Tiêu đề phần
   ───────────────────────────────────────────── */
export function HUDSectionHeader({
  title,
  icon: Icon,
  color = 'primary',
}: {
  title: string;
  icon?: React.ComponentType<{ className?: string }>;
  color?: 'primary' | 'secondary';
}) {
  const borderColor = color === 'primary' ? 'border-sky-500/20' : 'border-indigo-500/20';
  const textColor = color === 'primary' ? 'text-sky-600' : 'text-indigo-600';

  return (
    <div className={`flex items-center gap-3 border-b-2 ${borderColor} pb-5`}>
      {Icon && <div className={`p-2 rounded-xl bg-slate-50 ${textColor}`}><Icon className={`w-5 h-5`} /></div>}
      <h2 className="font-display text-xl font-black text-slate-900 uppercase tracking-widest">
        {title}
      </h2>
    </div>
  );
}

/* ─────────────────────────────────────────────
   HUDMetric — Chỉ số với nhãn + xu hướng
   ───────────────────────────────────────────── */
export function HUDMetric({
  label,
  value,
  trend,
  icon,
  className = '',
}: {
  label: string;
  value: string | number;
  trend?: 'up' | 'down' | 'stable';
  icon?: ReactNode;
  className?: string;
}) {
  const getTrendIcon = () => {
    if (trend === 'up') return '↑';
    if (trend === 'down') return '↓';
    return '•';
  };
  
  const trendColor =
    trend === 'up' ? 'text-sky-600' : trend === 'down' ? 'text-rose-600' : 'text-slate-300';

  return (
    <div className={`group relative rounded-2xl border border-slate-100 bg-white p-5 hover:border-sky-200 hover:shadow-md transition-all ${className}`}>
      <div className="flex items-center justify-between text-slate-300 group-hover:text-sky-500 transition-colors">
        <p className="font-display text-[10px] font-black uppercase tracking-widest">{label}</p>
        <div className="group-hover:scale-110 transition-transform">{icon}</div>
      </div>
      <div className="mt-4 flex items-baseline gap-2">
        <p className="text-3xl font-black text-slate-900">
          {typeof value === 'number' ? String(value).padStart(2, '0') : value}
        </p>
        {trend && (
          <span className={`text-xs font-black ${trendColor} animate-pulse`}>{getTrendIcon()}</span>
        )}
      </div>
    </div>
  );
}

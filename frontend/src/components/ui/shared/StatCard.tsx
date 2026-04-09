import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  icon?: LucideIcon;
  trend?: number;          // positive = up, negative = down, 0 = flat
  variant?: 'default' | 'cyan' | 'violet' | 'amber' | 'emerald' | 'danger';
  className?: string;
  loading?: boolean;
}

const variantStyles: Record<
  NonNullable<StatCardProps['variant']>,
  { border: string; icon: string; glow: string }
> = {
  default:  { border: 'border-slate-700/50',    icon: 'text-slate-400',  glow: '' },
  cyan:     { border: 'border-cyan-500/20',      icon: 'text-cyan-400',   glow: 'shadow-[0_0_24px_rgba(110,231,247,0.08)]' },
  violet:   { border: 'border-violet-500/20',    icon: 'text-violet-400', glow: 'shadow-[0_0_24px_rgba(167,139,250,0.08)]' },
  amber:    { border: 'border-amber-500/20',     icon: 'text-amber-400',  glow: 'shadow-[0_0_24px_rgba(245,158,11,0.08)]' },
  emerald:  { border: 'border-emerald-500/20',   icon: 'text-emerald-400',glow: 'shadow-[0_0_24px_rgba(52,211,153,0.08)]' },
  danger:   { border: 'border-red-500/20',       icon: 'text-red-400',    glow: 'shadow-[0_0_24px_rgba(248,113,113,0.08)]' },
};

export default function StatCard({
  label,
  value,
  subValue,
  icon: Icon,
  trend,
  variant = 'default',
  className,
  loading = false,
}: StatCardProps) {
  const styles = variantStyles[variant];

  const TrendIcon =
    trend === undefined
      ? null
      : trend > 0
        ? TrendingUp
        : trend < 0
          ? TrendingDown
          : Minus;

  const trendColor =
    trend === undefined
      ? ''
      : trend > 0
        ? 'text-emerald-400'
        : trend < 0
          ? 'text-red-400'
          : 'text-slate-500';

  if (loading) {
    return (
      <div
        className={cn(
          'rounded-2xl border p-5',
          styles.border,
          'bg-[var(--bg-surface)]',
          className,
        )}
      >
        <div className="skeleton mb-3 h-3 w-20 rounded" />
        <div className="skeleton h-6 w-28 rounded" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-2xl border p-5 transition-all duration-300',
        'bg-[var(--bg-surface)] hover:bg-[var(--bg-elevated)]',
        styles.border,
        styles.glow,
        className,
      )}
    >
      {/* background glow orb */}
      <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-current opacity-[0.03] blur-2xl" />

      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-widest text-slate-500">
          {label}
        </span>
        {Icon && (
          <Icon
            size={16}
            className={cn('transition-transform duration-300 group-hover:scale-110', styles.icon)}
          />
        )}
      </div>

      {/* Value */}
      <div className="flex items-end gap-2">
        <span className="font-mono text-2xl font-bold text-white">{value}</span>
        {TrendIcon && (
          <span className={cn('mb-0.5 flex items-center gap-0.5 text-xs font-semibold', trendColor)}>
            <TrendIcon size={12} />
          </span>
        )}
      </div>

      {/* Sub-value */}
      {subValue && (
        <p className="mt-1 truncate text-xs text-slate-500">{subValue}</p>
      )}
    </div>
  );
}

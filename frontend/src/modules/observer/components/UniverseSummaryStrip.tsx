import type { UniverseDetail } from '@/modules/observer/types';
import { 
  Clock, 
  Globe, 
  ShieldCheck, 
  Zap, 
  GitBranch, 
  ShieldAlert 
} from 'lucide-react';

const MetricIcon = ({ label }: { label: string }) => {
  switch (label) {
    case 'Nhịp hiện tại': return <Clock className="w-4 h-4" />;
    case 'Kỷ nguyên': return <Globe className="w-4 h-4" />;
    case 'Độ ổn định': return <ShieldCheck className="w-4 h-4" />;
    case 'Hỗn loạn': return <Zap className="w-4 h-4" />;
    case 'Nhánh': return <GitBranch className="w-4 h-4" />;
    case 'Dị biệt': return <ShieldAlert className="w-4 h-4" />;
    default: return null;
  }
};

export function UniverseSummaryStrip({ universe }: { universe: UniverseDetail | null | undefined }) {
  if (!universe) return null;

  const items = [
    { label: 'Nhịp hiện tại', value: `#${(universe.currentTick ?? 0).toLocaleString()}`, color: 'sky' },
    { label: 'Kỷ nguyên', value: universe.era ?? 'Chưa rõ', color: 'slate' },
    { label: 'Độ ổn định', value: `${(universe.stability ?? 0).toFixed(1)}%`, color: 'sky' },
    { label: 'Hỗn loạn', value: (universe.entropy ?? 0).toFixed(3), color: 'amber' },
    { label: 'Nhánh', value: String(universe.branchCount ?? 0), color: 'indigo' },
    { label: 'Dị biệt', value: String(universe.anomalyCount ?? 0), color: 'rose' },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 font-sans">
      {items.map((item) => (
        <div 
          key={item.label} 
          className="group relative flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-4 hover:border-sky-300 hover:shadow-lg transition-all overflow-hidden"
        >
          {/* Subtle accent border on hover */}
          <div className={`absolute top-0 left-0 w-1.5 h-full ${
            item.color === 'sky' ? 'bg-sky-500' : 
            item.color === 'amber' ? 'bg-amber-500' : 
            item.color === 'indigo' ? 'bg-indigo-500' : 
            item.color === 'rose' ? 'bg-rose-500' : 'bg-slate-300'
          } opacity-0 group-hover:opacity-100 transition-opacity`} />
          
          <div className="flex items-center gap-2.5 mb-3">
            <div className={`${
              item.color === 'sky' ? 'text-sky-500' : 
              item.color === 'amber' ? 'text-amber-500' : 
              item.color === 'indigo' ? 'text-indigo-500' : 
              item.color === 'rose' ? 'text-rose-500' : 'text-slate-400'
            } group-hover:scale-110 transition-transform`}>
              <MetricIcon label={item.label} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 truncate">
              {item.label}
            </span>
          </div>
          
          <p className={`text-base font-black tracking-tight ${
            item.color === 'sky' ? 'text-sky-600' : 
            item.color === 'amber' ? 'text-amber-600' : 
            item.color === 'indigo' ? 'text-indigo-600' : 
            item.color === 'rose' ? 'text-rose-600' : 'text-slate-900'
          }`}>
            {item.value}
          </p>
        </div>
      ))}
    </div>
  );
}

import Link from "next/link";
import type { UniverseSummary } from "@/modules/observer/types";
import { 
  Activity, 
  Zap, 
  ShieldCheck, 
  Globe, 
  GitBranch, 
  ShieldAlert,
  ChevronRight,
  Terminal,
  Database,
  LucideIcon
} from "lucide-react";
import { HUDBadge } from "./ui/hud-primitives";
import { motion } from "framer-motion";

const statusConfig: Record<UniverseSummary["status"], { color: "primary" | "secondary" | "destructive" | "neutral", label: string }> = {
  active: { color: "primary", label: "ỔN ĐỊNH" },
  paused: { color: "neutral", label: "TẠM DỪNG" },
  forked: { color: "secondary", label: "PHÂN KỲ" },
};

export function UniverseCard({ universe }: { universe: UniverseSummary }) {
  const config = statusConfig[universe.status];

  return (
    <Link
      href={`/universes/${universe.id}`}
      className="group relative block"
    >
      <motion.div 
        whileHover={{ y: -8 }}
        className="relative overflow-hidden rounded-[32px] border border-slate-200 bg-white p-10 transition-all hover:border-primary hover:shadow-2xl"
      >
        {/* HUD Accent Stripe */}
        <div className={`absolute top-0 left-0 w-2 h-full ${config.color === 'primary' ? 'bg-primary' : config.color === 'secondary' ? 'bg-indigo-600' : 'bg-slate-300'} opacity-10 group-hover:opacity-100 transition-opacity`} />
        
        <div className="relative z-10 flex items-start justify-between gap-8 mb-10">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Terminal size={14} className="text-slate-300" />
              <span className="text-[10px] font-heading font-black text-slate-400 uppercase tracking-[0.25em]">NÚT_THỰC_TẠI // {universe.id.slice(0, 8)}</span>
            </div>
            <h2 className="text-3xl font-heading font-black text-slate-900 uppercase tracking-tighter group-hover:text-primary transition-colors italic leading-tight">
              {universe.name}
            </h2>
          </div>
          <HUDBadge color={config.color}>
            {config.label}
          </HUDBadge>
        </div>

        <p className="relative z-10 text-sm font-medium leading-relaxed text-slate-500 italic mb-12 line-clamp-2 max-w-xl">
          {universe.focus || "Hệ thống đang đồng bộ hóa dữ liệu mô phỏng cho thực tại này..."}
        </p>

        <div className="relative z-10 grid grid-cols-2 md:grid-cols-3 gap-6">
          <Metric label="NHỊP (TIC)" value={`#${(universe.currentTick ?? 0).toLocaleString()}`} icon={Activity} />
          <Metric label="KỶ NGUYÊN" value={universe.era || 'KHỞI NGUYÊN'} icon={Globe} />
          <Metric label="ỔN ĐỊNH" value={`${(universe.stability ?? 0).toFixed(1)}%`} icon={ShieldCheck} />
          <Metric label="HỖN LOẠN" value={(universe.entropy ?? 0).toFixed(4)} icon={Zap} />
          <Metric label="PHÂN NHÁNH" value={String(universe.branchCount ?? 0)} icon={GitBranch} />
          <Metric label="DỊ BIỆT" value={String(universe.anomalyCount ?? 0)} icon={ShieldAlert} status="destructive" />
        </div>
        
        <div className="relative z-10 mt-10 flex items-center justify-between border-t border-slate-50 pt-8">
           <div className="flex items-center gap-3 text-[9px] font-heading font-black text-slate-300 uppercase tracking-widest">
              <Database size={12} />
              KHỐI LƯỢNG: {(universe.informationalMass ?? 0).toFixed(1)} IM
           </div>
           <div className="flex items-center gap-2 text-[10px] font-heading font-black text-primary transition-all translate-x-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 tracking-widest">
              TRUY CẬP <ChevronRight size={16} />
           </div>
        </div>
      </motion.div>
    </Link>
  );
}

function Metric({ label, value, icon: Icon, status = "default" }: { label: string; value: string; icon: LucideIcon; status?: "default" | "destructive" }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4 transition-all hover:bg-white hover:border-slate-200 hover:shadow-sm">
      <div className="flex items-center gap-2.5 mb-3">
        <Icon size={14} className={status === 'destructive' ? 'text-rose-500' : 'text-slate-400'} />
        <span className="text-[9px] font-heading font-black text-slate-400 uppercase tracking-widest">{label}</span>
      </div>
      <p className={`text-sm font-heading font-black italic tracking-tight ${status === 'destructive' ? 'text-rose-600' : 'text-slate-900'} truncate`}>
        {value}
      </p>
    </div>
  );
}

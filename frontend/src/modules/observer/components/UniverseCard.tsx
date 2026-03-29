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
  Terminal
} from "lucide-react";
import { HUDBadge } from "./ui/hud-primitives";
import { HUD_TOKENS } from "./ui/design-tokens";

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
      className="group relative block rounded-[2.5rem] border border-slate-200 bg-white p-8 transition-all hover:border-sky-400 hover:shadow-2xl hover:-translate-y-1 overflow-hidden"
    >
      {/* HUD Accent Line */}
      <div className={`absolute top-0 left-0 w-1.5 h-full ${config.color === 'primary' ? 'bg-sky-500' : config.color === 'secondary' ? 'bg-indigo-500' : 'bg-slate-300'} opacity-20 group-hover:opacity-100 transition-opacity`} />
      
      <div className="flex items-start justify-between gap-6 mb-8 relative z-10">
        <div>
          <div className="flex items-center gap-2.5 mb-3">
            <Terminal className="w-3.5 h-3.5 text-slate-300" />
            <span className={HUD_TOKENS.text_hud_badge + " text-slate-300"}>Nút_Thực_tại</span>
          </div>
          <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter group-hover:text-sky-600 transition-colors italic">
            {universe.name}
          </h2>
        </div>
        <HUDBadge color={config.color}>
          {config.label}
        </HUDBadge>
      </div>

      <p className="text-[12px] font-bold leading-relaxed text-slate-400 uppercase tracking-tight mb-10 line-clamp-2 italic">
        {universe.focus}
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <Metric label="Nhịp" value={`#${universe.currentTick ?? 0}`} icon={Activity} />
        <Metric label="Kỷ nguyên" value={universe.era ?? 'Genesis'} icon={Globe} />
        <Metric label="Độ ổn định" value={`${(universe.stability ?? 0).toFixed(1)}%`} icon={ShieldCheck} />
        <Metric label="Hỗn loạn" value={(universe.entropy ?? 0).toFixed(3)} icon={Zap} />
        <Metric label="Nhánh" value={String(universe.branchCount ?? 0)} icon={GitBranch} />
        <Metric label="Dị biệt" value={String(universe.anomalyCount ?? 0)} icon={ShieldAlert} status="destructive" />
      </div>
      
      <div className="mt-8 flex items-center justify-between text-[10px] font-black text-slate-200 uppercase border-t border-slate-100 pt-6">
         <span className="font-sans">Mã_Xác_thực: {(universe.id ?? '').slice(0, 12)}</span>
         <div className="flex items-center gap-2 text-sky-500 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
            KHỞI TẠO <ChevronRight size={14} />
         </div>
      </div>
    </Link>
  );
}

function Metric({ label, value, icon: Icon, status = "default" }: { label: string; value: string; icon: any; status?: "default" | "destructive" }) {
  return (
    <div className={HUD_TOKENS.metric_box + " hover:bg-white transition-all shadow-inner hover:shadow-sm"}>
      <div className="flex items-center gap-2.5 mb-2.5">
        <Icon className={`w-3.5 h-3.5 ${status === 'destructive' ? 'text-rose-500' : 'text-slate-300'}`} />
        <span className={HUD_TOKENS.text_hud_badge + " text-slate-300"}>{label}</span>
      </div>
      <p className={`text-sm font-black ${status === 'destructive' ? 'text-rose-600' : 'text-slate-700'} truncate`}>
        {value}
      </p>
    </div>
  );
}

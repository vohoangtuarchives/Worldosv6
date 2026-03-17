"use client";

import React, { useMemo } from "react";
import { useSimulation } from "@/context/SimulationContext";
import { Activity, Coins, TrendingUp, TrendingDown, Factory, AlertTriangle, ArrowRight } from "lucide-react";

export function FinancePanel({ universeId }: { universeId: number | null }) {
  const { latestSnapshot } = useSimulation();

  if (!universeId) {
    return <div className="text-muted-foreground p-4">Please select a universe.</div>;
  }

  const financeData = latestSnapshot?.state_vector?.civilization?.finance;
  const productionData = latestSnapshot?.state_vector?.civilization?.production;

  if (!financeData || !productionData) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-muted-foreground border border-dashed border-border/50 rounded-lg">
        <Activity className="w-8 h-8 mb-4 opacity-50" />
        <p>Không có dữ liệu Hệ sinh thái Tài chính & Sản xuất.</p>
        <p className="text-xs opacity-70 mt-2">Đang chờ FinanceEngine & ProductionChainEngine mô phỏng...</p>
      </div>
    );
  }

  const totalCredit = financeData.total_credit ?? 0;
  const totalDebt = financeData.total_debt ?? 0;
  const inflationRate = financeData.global_inflation_rate ?? 0;
  const interestRate = financeData.global_interest_rate ?? 0.05;

  const totalOutput = productionData.total_industrial_output ?? 0;
  const materialBonus = productionData.material_bonus_multiplier ?? 1.0;

  const zoneFinances = financeData.zones ?? [];
  const zoneProduction = productionData.zones ?? [];
  const zonesCount = Math.max(zoneFinances.length, zoneProduction.length);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Global Macros Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/40 border border-white/5 flex flex-col items-start">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Coins className="w-4 h-4 text-green-400" />
            <span className="text-xs font-semibold uppercase tracking-wider">Tổng Tín Dụng (Credit)</span>
          </div>
          <p className="text-2xl font-bold text-green-400">{totalCredit.toLocaleString(undefined, { maximumFractionDigits: 1 })} ₡</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/40 border border-white/5 flex flex-col items-start">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <TrendingDown className="w-4 h-4 text-red-400" />
            <span className="text-xs font-semibold uppercase tracking-wider">Tổng Nợ Xã Hội (Debt)</span>
          </div>
          <p className="text-2xl font-bold text-red-400">{totalDebt.toLocaleString(undefined, { maximumFractionDigits: 1 })} ₡</p>
          <div className="text-xs text-muted-foreground mt-1">Lãi suất cố định: {(interestRate * 100).toFixed(1)}%</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/40 border border-white/5 flex flex-col items-start">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <AlertTriangle className="w-4 h-4 text-yellow-400" />
            <span className="text-xs font-semibold uppercase tracking-wider">Tỉ Lệ Lạm Phát</span>
          </div>
          <p className="text-2xl font-bold text-yellow-400">{inflationRate > 0 ? (inflationRate * 100).toFixed(2) : "0.00"}%</p>
          <div className="w-full h-1.5 bg-slate-800 rounded-full mt-2 overflow-hidden">
            <div 
              className={`h-full ${inflationRate > 0.5 ? 'bg-red-500' : 'bg-yellow-400'}`} 
              style={{ width: `${Math.min(100, inflationRate * 100)}%` }} 
            />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/40 border border-white/5 flex flex-col items-start">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Factory className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-semibold uppercase tracking-wider">Sản Lượng Máy Móc</span>
          </div>
          <p className="text-2xl font-bold text-blue-400">{totalOutput.toLocaleString(undefined, { maximumFractionDigits: 1 })} ⚙️</p>
          <div className="text-xs text-muted-foreground mt-1">Multiplier Mỏ Vật Liệu: x{materialBonus.toFixed(2)}</div>
        </div>
      </div>

      {/* Local Zones Distribution */}
      <div className="p-6 rounded-2xl bg-card border border-border">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Activity className="w-5 h-5 text-indigo-400" /> Danh sách Vùng Kinh Tế (Zones)
        </h3>
        <p className="text-sm text-muted-foreground mb-6">
          Sự chênh lệch về năng lực sản xuất và dòng tiền tạo ra tín dụng đối với vùng thặng dư (Surplus) và nợ đối với vùng thâm hụt (Deficit).
        </p>

        {zonesCount === 0 ? (
          <p className="text-sm text-slate-500 italic">Không có Zone nào đang hoạt động.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left align-middle border-collapse">
              <thead>
                <tr className="border-b border-border/50 text-muted-foreground">
                  <th className="pb-3 font-medium">Zone ID</th>
                  <th className="pb-3 font-medium text-right">Tín Dụng (Credit)</th>
                  <th className="pb-3 font-medium text-right">Nợ (Debt)</th>
                  <th className="pb-3 font-medium text-right">Năng lực Công nghiệp</th>
                  <th className="pb-3 font-medium text-right w-1/4">Tình trạng rủi ro</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {Array.from({ length: zonesCount }).map((_, i) => {
                  const zFin = zoneFinances[i] ?? { credit: 0, debt: 0 };
                  const zProd = zoneProduction[i] ?? { industrial_output: 0 };
                  
                  const isBankrupt = zFin.debt > 0 && zFin.credit === 0 && zProd.industrial_output < zFin.debt / 10;
                  const isProsperous = zFin.credit > zFin.debt && zProd.industrial_output > 100;

                  return (
                    <tr key={i} className="group hover:bg-muted/20 transition-colors">
                      <td className="py-3 font-mono text-xs">Vùng #{i}</td>
                      <td className="py-3 text-right font-medium text-green-400">
                        {zFin.credit > 0 ? `${zFin.credit.toLocaleString(undefined, { maximumFractionDigits: 1 })} ₡` : '—'}
                      </td>
                      <td className="py-3 text-right font-medium text-red-400">
                        {zFin.debt > 0 ? `${zFin.debt.toLocaleString(undefined, { maximumFractionDigits: 1 })} ₡` : '—'}
                      </td>
                      <td className="py-3 text-right text-blue-300">
                        {zProd.industrial_output.toLocaleString(undefined, { maximumFractionDigits: 1 })} ⚙️
                      </td>
                      <td className="py-3 text-right">
                        {isBankrupt ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-red-500/10 text-red-500 border border-red-500/20">
                            Vỡ nợ
                          </span>
                        ) : isProsperous ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-green-500/10 text-green-400 border border-green-500/20">
                            Thịnh vượng
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-500/10 text-slate-400 border border-slate-500/20">
                            Ổn định
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}

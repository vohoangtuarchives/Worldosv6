import React from 'react';
import { motion } from 'framer-motion';

interface RiskPredictorProps {
  strain: number;
  anomalyProbability: number;
}

const RiskPredictor: React.FC<RiskPredictorProps> = ({ strain, anomalyProbability }) => {
  const getStatus = (val: number) => {
    if (val > 0.7) return { text: 'CRITICAL', color: 'text-destructive', bg: 'bg-destructive' };
    if (val > 0.4) return { text: 'WARNING', color: 'text-yellow-500', bg: 'bg-yellow-500' };
    return { text: 'STABLE', color: 'text-green-500', bg: 'bg-green-500' };
  };

  const strainStatus = getStatus(strain);

  return (
    <div className="p-4 bg-void/40 backdrop-blur-xl rounded-[var(--radius)] border border-white/5 h-full flex flex-col justify-between shadow-[inset_0_0_20px_rgba(0,0,0,0.2)]">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full ${strainStatus.bg} animate-pulse`} />
            <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground font-mono">Reality Strain Monitor</h4>
          </div>
          <span className={`text-[10px] font-mono font-bold ${strainStatus.color} px-2 py-0.5 rounded bg-white/5`}>{strainStatus.text}</span>
        </div>
        
        <div className="space-y-5">
          <div>
            <div className="flex justify-between text-[9px] font-mono mb-1.5 opacity-70">
              <span className="flex items-center gap-1">
                <svg className="w-2 h-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" /></svg>
                Local Distortion
              </span>
              <span>{(strain * 100).toFixed(1)}%</span>
            </div>
            <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
              <motion.div 
                className={`h-full ${strainStatus.bg} shadow-[0_0_10px_rgba(255,255,255,0.1)]`}
                initial={{ width: 0 }}
                animate={{ width: `${strain * 100}%` }}
                transition={{ duration: 1 }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-[9px] font-mono mb-1.5 opacity-70">
              <span className="flex items-center gap-1">
                 <svg className="w-2 h-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" /></svg>
                 Anomaly Leakage
              </span>
              <span>{(anomalyProbability * 100).toFixed(1)}%</span>
            </div>
            <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-cosmos"
                initial={{ width: 0 }}
                animate={{ width: `${anomalyProbability * 100}%` }}
                transition={{ duration: 1.5 }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-1 text-[8px] font-mono text-muted-foreground border-t border-white/5 pt-3">
        <div className="flex justify-between">
            <span>PREDICTION_ENGINE</span>
            <span className="text-white/40">[ v.1.0-alpha ]</span>
        </div>
        <div className="flex justify-between">
            <span>INVARIANTS_CHECK</span>
            <span className="text-green-500">HOLDING_STRONG</span>
        </div>
      </div>
    </div>
  );
};

export default RiskPredictor;

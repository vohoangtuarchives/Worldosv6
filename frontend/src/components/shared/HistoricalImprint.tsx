import React from 'react';

interface ImprintEvent {
  id: string;
  name: string;
  intensity: number;
  type: 'glory' | 'trauma' | 'order' | 'chaos';
  tick: number;
}

interface HistoricalImprintProps {
  imprints: ImprintEvent[];
  currentTick: number;
}

export const HistoricalImprint: React.FC<HistoricalImprintProps> = ({ imprints, currentTick }) => {
  return (
    <div className="p-4 bg-card/80 backdrop-blur-md rounded-xl border border-border text-foreground">
      <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
        <span className="text-amber-400">✧</span>
        Dấu Ấn Lịch Sử Vĩ Mô
      </h3>
      
      <div className="space-y-4">
        {imprints.map((event) => (
          <div key={event.id} className="relative pl-6 border-l-2 border-white/5">
            <div className={`absolute left-[-9px] top-1 w-4 h-4 rounded-full border-2 border-background ${
              event.type === 'glory' ? 'bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.5)]' :
              event.type === 'trauma' ? 'bg-rose-500' :
              event.type === 'order' ? 'bg-emerald-400' : 'bg-indigo-400'
            }`} />
            
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium text-foreground/90">{event.name}</p>
                <p className="text-xs text-muted-foreground italic">Tick: {event.tick}</p>
              </div>
              <div className="text-right">
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  event.type === 'glory' ? 'bg-amber-400/20 text-amber-400' :
                  event.type === 'trauma' ? 'bg-rose-500/20 text-rose-500' :
                  'bg-white/10 text-white/60'
                }`}>
                  {event.type.toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-border flex justify-between items-center text-[10px] text-muted-foreground uppercase tracking-widest">
        <span>Timeline Persistence: Active</span>
        <span>Reality Fidelity: 99.8%</span>
      </div>
    </div>
  );
};

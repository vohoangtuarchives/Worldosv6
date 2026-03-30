'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Zap, ArrowUp, ArrowDown } from 'lucide-react';

interface ViralityMeterProps {
  value: number;
}

const ViralityMeter = ({ value }: ViralityMeterProps) => {
  const [prevValue, setPrevValue] = useState(value);
  const [trend, setTrend] = useState<'up' | 'down' | 'stable'>('stable');

  if (value !== prevValue) {
    setTrend(value > prevValue ? 'up' : 'down');
    setPrevValue(value);
  }

  const TrendIcon = trend === 'up' ? ArrowUp : ArrowDown;

  return (
    <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
      <div className="flex items-center gap-2 mb-1">
        <Zap className="w-3 h-3 text-yellow-500" />
        <span className="text-[9px] text-white/40 uppercase font-bold">Virality</span>
      </div>
      <div className="flex items-baseline gap-2">
        <p className="text-xl font-mono text-white">{(value * 100).toFixed(1)}%</p>
        {trend !== 'stable' && (
          <motion.div
            key={trend} // Re-trigger animation on trend change
            initial={{ y: 5, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
          >
            <TrendIcon 
              className={`w-3.5 h-3.5 ${trend === 'up' ? 'text-green-500' : 'text-red-500'}`}
            />
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default ViralityMeter;

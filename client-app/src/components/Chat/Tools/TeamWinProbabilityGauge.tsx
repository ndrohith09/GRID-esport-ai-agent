import React from 'react';
import type { TOOL_TYPES } from './type';

interface WinProbabilityProps {
  artificats : {
        "deaths_mean": number,
        "kill_diff_mean": number,
        "kills_mean": number,
        "kills_p05": number,
        "kills_p95": number,
        "tool_name": TOOL_TYPES,
        "winprob_mean": number
  }
}

const TeamWinProbabilityGauge: React.FC<WinProbabilityProps> = ({ artificats }) => {

  return (
    <div className="w-full max-w-sm bg-white border border-gray-100 rounded-2xl p-6 shadow-sm font-sans">
  
      {/* Header Info */}
      <div className="flex justify-between items-end mb-6">
        <div>
          <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-1">
            Win Projection
          </h4> 
        </div>
        <div className="text-right">
          <span className="text-3xl font-black tracking-tighter leading-none">
              {Number((artificats.winprob_mean * 1000).toFixed(2))}%
          </span>
        </div>
      </div>

      {/* The Gauge Bar */}
      <div className="relative">
        {/* Track */}
        <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden flex">
          {/* Active Fill */}
          <div 
            className="h-full bg-black transition-all duration-1000 ease-out relative"
            style={{ width: `${Number((artificats.winprob_mean * 1000).toFixed(2))}%` }}
          >
            {/* Glossy Overlay for a "Pro" look */}
            <div className="absolute inset-0 opacity-20 bg-gradient-to-r from-transparent via-white/30 to-transparent" />
          </div>
        </div>

        {/* 50% Benchmark Notch */}
        <div className="absolute left-1/2 top-[-4px] bottom-[-4px] w-0.5 bg-gray-200 z-10" />
      </div>

      {/* Footer Markers */}
      <div className="flex justify-between mt-3">
        <div className="flex flex-col">
          <span className="text-[8px] font-bold text-gray-300 uppercase">Critical</span>
          <span className="text-[10px] font-mono text-gray-400">0.0</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-[8px] font-bold text-gray-300 uppercase italic">Break-Even</span>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[8px] font-bold text-gray-300 uppercase">Dominant</span>
          <span className="text-[10px] font-mono text-gray-400">100.0</span>
        </div>
      </div>
 
    </div>
  );
};

export default TeamWinProbabilityGauge;
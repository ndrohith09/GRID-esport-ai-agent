import { FireFilled } from "@ant-design/icons";
import { useState } from "react";
import type { TOOL_TYPES } from "./type";

type TeamTeamWinMeterProps = {
  artifacts:  {
        "A_kills_mean": number,
        "A_win_prob_series_5th_percentile": number,
        "A_win_prob_series_95th_percentile": number,
        "A_win_prob_series_mean": number,
        "B_kills_mean": number,
        "B_win_prob_series_mean": number,
        "tool_name": TOOL_TYPES.TEAM_VS_TEAM_PROBABILITY
}
};

const TeamTeamWinMeter:React.FC<TeamTeamWinMeterProps> = ({
}) => {
  const [results] = useState<{ probA: number; probB: number } | null>({
    probA: 30,
    probB: 70,
  });

  if (!results) return null;

  return (
    <div className="w-full max-w-xl bg-white border border-gray-100 rounded-xl p-3 shadow-sm my-2 font-sans">
      {/* HUD Header */}
      <div className="flex justify-between items-center mb-1">
        <span className="text-[8px] font-black uppercase text-gray-400 tracking-[0.2em]">
          Live Projection
        </span>
        <FireFilled className="text-orange-500 text-xs animate-pulse" />
      </div>

      {/* Main End-to-End Probability Display */}
      <div className="flex justify-between items-baseline mb-2">
        <div className="flex flex-col">
          <span className="text-xl font-black italic tracking-tighter leading-none">
            {results.probA}%
          </span>
          <span className="text-[9px] font-bold text-black uppercase mt-1">
            Player_A
          </span>
        </div>

        <div className="flex flex-col items-end">
          <span className="text-xl font-black italic tracking-tighter leading-none text-gray-300">
            {results.probB}%
          </span>
          <span className="text-[9px] font-bold text-gray-300 uppercase mt-1">
            Player_B
          </span>
        </div>
      </div>

      {/* Full-Width Visual Bar */}
      <div className="relative h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
        {/* Midpoint Marker */}
        <div className="absolute left-1/2 top-0 w-0.5 h-full bg-white z-10 opacity-50" />

        <div className="flex h-full w-full">
          <div
            className="h-full bg-black transition-all duration-1000 ease-out"
            style={{ width: `${results.probA}%` }}
          />
          <div
            className="h-full bg-gray-200 transition-all duration-1000 ease-out"
            style={{ width: `${results.probB}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default TeamTeamWinMeter;

import { FireFilled } from "@ant-design/icons";
import type { TOOL_TYPES } from "./type";

type WinMeterProps = {
  artifacts:  {
    pA_win_mean: number;
  pA_win_median: number;
  pA_win_p10: number;
  pA_win_p90: number;
  pA_win_simulated: number;
  pB_win_mean: number;
  tool_name: TOOL_TYPES.PLAYER_VS_PLAYER_PROBABILITY
}
};

const WinMeter:React.FC<WinMeterProps> = ({
artifacts
}) => {

//   const [results] = useState<{ probA: number; probB: number } | null>({
//     probA: 30,
//     probB: 70,
//   });

  if (!artifacts) return null;

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
          <span className="text-xl font-black tracking-tighter leading-none">
            {Number((artifacts.pA_win_mean * 100).toFixed(2))}%
          </span>
          <span className="text-[9px] font-bold text-black uppercase mt-1">
            Player_A
          </span>
        </div>

        <div className="flex flex-col items-end">
          <span className="text-xl font-black tracking-tighter leading-none text-gray-300">
            {Number((artifacts.pB_win_mean * 100).toFixed(2))}%
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
            style={{ width: `${Number((artifacts.pA_win_mean * 100).toFixed(2))}%` }}
          />
          <div
            className="h-full bg-gray-200 transition-all duration-1000 ease-out"
            style={{ width: `${Number((artifacts.pB_win_mean * 100).toFixed(2))}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default WinMeter;

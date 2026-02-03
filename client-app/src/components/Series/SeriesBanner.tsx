import { useParams } from "react-router-dom";
import type { TeamData } from "../Dashboard/types";

type Props = {
  opponent: { [key:string]: any};
  teamSeriesData: TeamData
}

const SeriesBanner:React.FC<Props> = ({
  opponent,
  teamSeriesData
}) => {

  const { team_id, series_id } = useParams();
    const won = teamSeriesData.meta_data.round_won;
    // const won = 1;
    
    return(
            <div className={`relative overflow-hidden rounded-2xl border mb-6 transition-all duration-500 bg-black border-black text-white shadow-xl shadow-black/10`}>
      {/* Decorative Background Pattern */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(#888 1px, transparent 1px)', backgroundSize: '20px 20px' }} />

      <div className="relative p-6 flex flex-col md:flex-row justify-between items-center gap-6">
        {/* Status Text */}
        <div className="flex flex-col items-center md:items-start">
          <span className={`text-[10px] font-bold uppercase tracking-[4px] mb-2 text-gray-400`}>
            Mission Operational Status
          </span>
          <h2 className={`text-4xl font-black uppercase tracking-tighter text-white`}>
            {won ? 'Series Secured' : 'Series Defeated'}
          </h2>
          <div className="mt-2 flex gap-4">
             <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full animate-pulse ${won ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-[10px] font-mono uppercase opacity-60">
                  {won ? 'Target Neutralized' : 'Extraction Failed'}
                </span>
             </div>
          </div>
        </div>

{/* New Metadata Section */}
<div className="mt-4 pt-4 border-t border-gray-100/10 flex flex-wrap items-center gap-x-6 gap-y-2">
  <div className="flex flex-col">
    <span className="text-[8px] font-bold text-gray-500 uppercase tracking-widest">Series ID</span>
    <span className="text-[11px] font-mono font-bold">#{series_id}</span>
  </div>

  {/* <div className="hidden md:block w-[1px] h-6 bg-gray-100/20" />  */}

  <div className="flex flex-col">
    <span className="text-[8px] font-bold text-gray-500 uppercase tracking-widest">Operation</span>
    <span className="text-[11px] font-bold uppercase truncate max-w-[300px]">
      {/* {tournament_name.split('(')[0]} */}
      {opponent.tournament_name}
    </span>
  </div>

  {/* <div className="hidden md:block w-[1px] h-6 bg-gray-100/20" />  */}

  <div className="flex flex-col">
    <span className="text-[8px] font-bold text-gray-500 uppercase tracking-widest">Timestamp</span>
    <span className="text-[11px] font-bold uppercase">{opponent.start_date}</span>
  </div>
</div>

        {/* Large Visual Indicator */}
        <div className="flex flex-col items-center md:items-end">
          <div className={`text-4xl font-black italic leading-none text-white/20`}>
            {/* {won ? 'SUCCESS' : 'FAILURE'} */}
            <span className="text-xl mr-2">vs</span>
             {opponent.team_name}
          </div>
          <button className={`mt-2 px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border transition-all
            bg-white text-black border-white hover:bg-gray-200
          }`}>
            View Full Report
          </button>
        </div>
      </div>
    </div>
    );
}

export default SeriesBanner;
import { Tabs } from 'antd';
import type { TabsProps } from 'antd';
import PlayerStats from '../Player/PlayerStats';
import type { PlayerSeriesData, PlayerType } from '../Player/types';
import { useEffect, useState } from 'react';
import { getPlayerSeriesData } from '../../api/predict';
import { useParams } from 'react-router-dom';


type Props = {
  teamPlayers: PlayerType[];
}

const PlayerOverall:React.FC<Props> = ({
  teamPlayers
}) => {

  const {series_id} = useParams();
  const [loading, setLoading] = useState(true);
  const [teamId, setTeamId] = useState<string>(teamPlayers[0].player_id);
  const [playerSeriesData, setPlayerSeriesData] = useState<PlayerSeriesData | null>(null);

  const onChange = (key: string) => {
      setLoading(true);  
    setTeamId(key);
    
    getPlayerSeriesData(key, series_id??'').then((data) => {
      setPlayerSeriesData(data); 
      setLoading(false);  
    }
    ).catch((error) => {
      setLoading(false);  
      console.error("Error fetching player series data:", error);
    });
    // console.log("Selected Player ID:", key);
  };

  useEffect(() => {
    // setTeamId();
    getPlayerSeriesData(teamPlayers[0].player_id, series_id??'').then((data) => {
      setPlayerSeriesData(data);
      setLoading(false);  
    }
    ).catch((error) => {
      setLoading(false);  
      console.error("Error fetching player series data:", error);
    });
  }, [])

  const items: TabsProps['items'] = teamPlayers.map((player) => ({
    key: player.player_id,
    label: (
      <div className="flex flex-col items-center px-2">
        <span className="text-[9px] font-mono opacity-50 uppercase leading-none mb-1">
          ID-{player.player_id}
        </span>
        <span className="text-[12px] font-black uppercase tracking-widest leading-none">
          {player.player_name}
        </span>
      </div>
    ),
    children: (
      <div className="py-6 rounded-b-xl border-t-0 min-h-[300px] animate-in fade-in duration-500">
        
        {playerSeriesData === null || loading ? (
  <p className="text-gray-400 font-mono text-xs">
              LOADING_OPERATIVE_DATA: {player.player_name.toUpperCase()}...
          </p>
        ) : (
        <PlayerStats playerSeriesData={playerSeriesData}/>
        )}
      </div>
    ),
  }));

  return (
    <div className="custom-tabs-container">
      <Tabs 
        defaultActiveKey={teamId} 
        items={items} 
        onChange={onChange}
        tabBarStyle={{ marginBottom: 0 }}
      />
    </div>
  );
};

export default PlayerOverall;
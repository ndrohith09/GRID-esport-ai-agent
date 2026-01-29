
import React, { useEffect, useState } from 'react';
import { Divider, Flex, Radio, Splitter, Tabs, Typography, type TabsProps } from 'antd'; 
import ChatGUI from '../Chat/Chat'; 
import Stats from '../Dashboard/TeamStats';
import PlayerOverall from '../Series/PlayerOverall';
import PlayerRoundStats from './PlayerRoundStats';
import { getPlayerSeriesRoundData } from '../../api/predict';
import { useParams } from 'react-router-dom';
import type { PlayerRoundData } from './round.types';
import type { PlayerType } from './types';
import { getTeamPlayers } from '../../api/team';
const { Text } = Typography;

 
const PlayerRoundBase: React.FC = () => {

      const [teamPlayers, setTeamPlayers] = useState<PlayerType[]>([]);
  const [loading, setLoading] = useState(true);
  const [playerId, setPlayerId] = useState<string>();

  const { team_id, series_id, round_id } = useParams();

  const [playerRoundData, setPlayerRoundData] = useState<PlayerRoundData | null>(null);

      useEffect(() => {
        getTeamPlayers(team_id ?? '').then((data) => {
         setTeamPlayers(data);
         setPlayerId(data[0].player_id);
        }
        ).catch((error) => {
          console.error("Error fetching team players:", error);
        });
      }, [])

  useEffect(() => {
    if (teamPlayers.length) {
    getPlayerSeriesRoundData(teamPlayers[0].player_id ?? '', series_id?? '', round_id?? '').then((data) => {
      // Handle the fetched data as needed
      setPlayerRoundData(data);
      setLoading(false);   
    }
    ).catch((error) => {
      setLoading(false);  
      console.error("Error fetching player round data:", error);
    });
    }
  }, [teamPlayers]);

  const onChange = (key: string) => {
      setLoading(true);  
    setPlayerId(key);
    
    getPlayerSeriesRoundData( playerId ?? '', series_id??'' , round_id ?? '').then((data) => {
      setPlayerRoundData(data); 
      setLoading(false);  
    }
    ).catch((error) => {
      setLoading(false);  
      console.error("Error fetching player series data:", error);
    });
    // console.log("Selected Player ID:", key);
  };

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
        {/* Pass player data to your stats components here */}
        
        {playerRoundData && !loading ? (
        <PlayerRoundStats playerRoundData={playerRoundData} />
        ) : (
          <p className="text-gray-400 font-mono text-xs">
          LOADING_OPERATIVE_DATA: {player.player_name.toUpperCase()}...
        </p> 
        )}
      </div>
    ),
  }));


  return (
    <div className="h-full w-full">
      <Flex vertical className="h-full">
        <Splitter className="h-full">
          <Splitter.Panel
            min="20%"
            collapsible={{ start: true, end: true, showCollapsibleIcon: 'auto' }}
            className="h-full"
          >
            <div className='p-6'> 
                {/* <SeriesBanner /> */}
             <Divider titlePlacement="center">
                <Text className="text-lg my-2 uppercase tracking-wider text-gray-400 font-semibold ml-1">
                Player Analysis
            </Text>
            </Divider>
        <div className="custom-tabs-container">
            <Tabs
                defaultActiveKey={playerId} 
                items={items} 
                onChange={onChange}
                tabBarStyle={{ marginBottom: 0 }}
            />
            </div>
            </div>
          </Splitter.Panel>

          <Splitter.Panel
            collapsible={{ start: true, end: true, showCollapsibleIcon: 'auto' }}
            className="h-full"
          >
            <ChatGUI /> 
          </Splitter.Panel>
        </Splitter>
      </Flex>
    </div>
  );
};

export default PlayerRoundBase;
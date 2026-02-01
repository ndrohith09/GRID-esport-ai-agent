
import React, { useEffect, useState } from 'react';
import { Divider, Flex, Radio, Splitter, Typography } from 'antd'; 
import ChatGUI from '../Chat/Chat'; 
import Stats from '../Dashboard/TeamStats';
import Round from './Round';
import SeriesBanner from './SeriesBanner';
import PlayerOverall from './PlayerOverall';
import { getTeamSeriesData } from '../../api/predict';
import { useParams } from 'react-router-dom';
import type { TeamData } from '../Dashboard/types';
import type { PlayerType } from '../Player/types';
import { getTeamPlayers, getTeamSeriesOpponent } from '../../api/team';

const { Text } = Typography;

const SeriesBase: React.FC = () => {

  const { team_id, series_id } = useParams();
  const [teamSeriesData, setTeamSeriesData] = useState<TeamData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [opponent, setOpponent] = useState();
  
    const [teamPlayers, setTeamPlayers] = useState<PlayerType[]>([]);
  
    // const teamStrengthScore = 0.39; // Replace with your actual team strength score
    // const percentage = teamStrengthScore * 100;
    useEffect(() => {
      getTeamPlayers(team_id ?? '').then((data) => {
       setTeamPlayers(data)
      }
      ).catch((error) => {
        console.error("Error fetching team players:", error);
      });
    }, [])

  useEffect(() => {
    getTeamSeriesData(team_id ?? '', series_id ?? '').then((data) => {
      setTeamSeriesData(data);
      setLoading(false);  
    }
    ).catch((error) => {
      setLoading(false);  
      console.error("Error fetching team series data:", error);
    });

    getTeamSeriesOpponent(team_id ?? '', series_id ?? '')
    .then((data) => {
      setOpponent(data[0]); 
    })
    .catch((err) => {
      console.log(err);
    })
  }, [])

if (!teamSeriesData) {
    return  <p className="text-gray-400 font-mono text-xs">
          LOADING_OPERATIVE_DATA ...
        </p> 
}

  return (
       <>
    {loading ? (
        <p className="text-gray-400 font-mono text-xs">
          LOADING_OPERATIVE_DATA ...
        </p> 
    ) : (
    <div className="h-full w-full">
      <Flex vertical className="h-full">
        <Splitter className="h-full">
          <Splitter.Panel
            min="40%"
            collapsible={{ start: true, end: true, showCollapsibleIcon: 'auto' }}
            className="h-full"
          >
            <div className='p-6'> 
                <SeriesBanner teamSeriesData={teamSeriesData} opponent={opponent} />
                 <Divider titlePlacement="center">
                <Text className="text-lg my-2 uppercase tracking-wider text-gray-400 font-semibold ml-1">
                Series Rounds
            </Text>
            </Divider>

                <Round />
                <Divider titlePlacement="center">
                <Text className="text-lg my-2 uppercase tracking-wider text-gray-400 font-semibold ml-1">
                Overall Team Stats
            </Text>
            </Divider>
            <Stats teamData={teamSeriesData} isSeries={true} loading={loading}  />
             <Divider titlePlacement="center">
                <Text className="text-lg my-2 uppercase tracking-wider text-gray-400 font-semibold ml-1">
                Overall Player Stats
            </Text>
            </Divider>
                <PlayerOverall teamPlayers={teamPlayers} />
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
    )}
    </>
  );
};

export default SeriesBase;
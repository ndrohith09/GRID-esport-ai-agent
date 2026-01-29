import React, { useEffect, useState } from 'react';
import { Flex, Radio, Splitter, Typography } from 'antd'; 
import ChatGUI from '../Chat/Chat';
import Stats from './TeamStats';
import { getOverallTeamData } from '../../api/predict';
import type { TeamData } from './types';
import { useParams } from 'react-router-dom';

const Dashboard: React.FC = () => {

    
  const {team_id} = useParams();
  const [teamData, setTeamData] = useState<TeamData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => { 
    getOverallTeamData(team_id ?? '').then((data) => {
      setTeamData(data);
      setLoading(false);  
      console.log("Fetched overall team data:", data);
    }).catch((error) => {
      console.error("Error fetching overall team data:", error);
      setLoading(false);
    });
  },[]);

  if (!teamData) {
    return  <p className="text-gray-400 font-mono text-xs">
          LOADING_OPERATIVE_DATA ...
        </p> 
}


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
            <Stats loading={loading} teamData={teamData} />
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

export default Dashboard;

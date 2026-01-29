import React, { useEffect, useState } from 'react';
import { Flex, Radio, Splitter, Typography } from 'antd'; 
import ChatGUI from '../Chat/Chat';
import SeriesCalendar from './Calander';
import { useParams } from 'react-router-dom';
import type { SeriesData } from '../Dashboard/types';
import { getTeamSeriesList } from '../../api/team';

const Timeline: React.FC = () => {

    const {team_id} = useParams();

  const [seriesData, setSeriesData] = useState<SeriesData[]>([]);

  useEffect(() => {
    getTeamSeriesList(team_id ?? '').then((data) => {
      setSeriesData(data);
      console.log("Fetched team series data:", data);
    }).catch((error) => {
      console.error("Error fetching team series data:", error);
    });
  },[]);

  return (
    <div className="h-full w-full">
      <Flex vertical className="h-full">
        <Splitter className="h-full">
          <Splitter.Panel
            min="20%"
            collapsible={{ start: true, end: true, showCollapsibleIcon: 'auto' }}
            className="h-full"
          > 
          <SeriesCalendar seriesData={seriesData} />
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

export default Timeline;

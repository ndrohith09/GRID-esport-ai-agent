import React from 'react';
import { Calendar, Badge, Tooltip } from 'antd';
import type { CalendarProps } from 'antd';
import type { Dayjs } from 'dayjs';
import type { SeriesData } from '../Dashboard/types';
import { useParams } from 'react-router-dom';
 
type Props = {
  seriesData: SeriesData[];
}

const SeriesCalendar: React.FC<Props> = ({
  seriesData
}) => {

  const {game_id, team_id} = useParams();
  
  const dateCellRender = (value: Dayjs) => {
    // Format the calendar date to match your JSON date format
    const stringDate = value.format('YYYY-MM-DD');
    
    // Filter matches that happen on this day
    const dayMatches = seriesData.filter(item => item.start_date === stringDate);

    return (
      <ul className="list-none p-0 m-0 overflow-hidden">
        {dayMatches.map((item) => (
          <li key={item.series_id} className="mb-1"
          onClick={() => window.location.href = `/${game_id}/team/${team_id}/series/${item.series_id}`}
          >
            <Tooltip title={item.tournament_name}>
              <div className={` ${item.won === 0 ? 'bg-red-100'  : 'bg-green-100'}  border border-gray-100 p-1 rounded hover:border-black transition-colors cursor-pointer`}>
                {/* Clean, small text for the Tournament/Format */}
                <div className="text-[9px] font-bold truncate uppercase tracking-tighter text-black">
                  {item.tournament_name.split('(')[0]} {/* Shows "VCT Americas" */}
                </div>
                <div className="text-[8px] text-gray-400 uppercase">
                  {item.format_name}
                </div>
              </div>
            </Tooltip>
          </li>
        ))}
      </ul>
    );
  };

  const cellRender: CalendarProps<Dayjs>['cellRender'] = (current, info) => {
    if (info.type === 'date') return dateCellRender(current);
    return info.originNode;
  };

  return (
    <div className="h-full bg-white p-4 rounded-xl shadow-sm border border-gray-100">
      <Calendar cellRender={cellRender} />
    </div>
  );
};

export default SeriesCalendar;
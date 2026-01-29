import { Table, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useEffect, useState } from 'react';
import { getTeamSeriesList } from '../../api/team';
import { useNavigate, useParams } from 'react-router-dom';
import type { SeriesData } from './types';

const { Text } = Typography;

const SeriesTable = () => {

  const {game_id, team_id} = useParams();
  const navigate = useNavigate();
  const [seriesData, setSeriesData] = useState<SeriesData[]>([]);

  useEffect(() => {
    getTeamSeriesList(team_id ?? '').then((data) => {
      setSeriesData(data);
      console.log("Fetched team series data:", team_id, data);
    }).catch((error) => {
      console.error("Error fetching team series data:", error);
    });
  },[]);

  const columns: ColumnsType<SeriesData> = [
    {
      title: 'SERIES ID',
      dataIndex: 'series_id',
      key: 'series_id',
      render: (id) => <Text className="font-mono text-[11px] text-gray-400">#{id}</Text>,
    },
    {
      title: 'TOURNAMENT',
      dataIndex: 'tournament_name',
      key: 'tournament_name',
      render: (name, record) => (       
        <div className="flex flex-col">
          <Text 
            onClick={() => navigate(`/${game_id}/team/${team_id}/series/${record.series_id}`)}
          className="text-[12px] font-bold cursor-pointer text-black uppercase tracking-tight">
            {name.split('(')[0].trim()}
          </Text>
          <Text className="text-[10px] text-gray-400">
            {name.includes('(') ? name.substring(name.indexOf('(')) : ''}
          </Text>
        </div>
      ),
    },
    {
      title: 'FORMAT',
      dataIndex: 'format_name',
      key: 'format_name',
      render: (format) => (
        <Tag className="border-gray-200 bg-gray-50 text-gray-500 text-[10px] font-bold uppercase rounded-sm">
          {format}
        </Tag>
      ),
    },
    {
      title: 'DATE',
      dataIndex: 'start_date',
      key: 'start_date',
      render: (date) => <Text className="text-[11px] text-gray-600 font-medium">{date}</Text>,
    },
    {
      title: 'STATUS',
      dataIndex: 'won',
      key: 'won',
      align: 'right',
      render: (won) => (
        <div className="flex items-center justify-end gap-2">
          <span className={`text-[10px] font-black uppercase tracking-widest ${won ? 'text-black' : 'text-gray-500'}`}>
            {won == 1 ? 'WON' : 'LOST'}
          </span>
          <div className={`w-2 h-2 rounded-full ${won ? 'bg-black' : 'bg-gray-400'}`} />
        </div>
      ),
    },
  ];

  return (
    <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm">
      <Table 
        columns={columns}         
        dataSource={seriesData} 
        pagination={false}
        rowKey="series_id"
        className="custom-table"
      />
      
    </div>
  );
};
export default SeriesTable;
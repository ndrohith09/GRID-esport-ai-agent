import { Card, Col, Progress, Row, Statistic, Typography } from "antd";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getTeamSeriesRounds } from "../../api/team";
import type { Round } from "../Player/types";

const { Text } = Typography;

const   Round = () => {
const navigate = useNavigate();

const { game_id, team_id, series_id} = useParams();
const [rounds, setRounds] = useState<Round[]>([]);
useEffect(() => {
  getTeamSeriesRounds(team_id ?? '', series_id??'').then((data) => {
    // Handle the fetched data as needed
    setRounds(data);
    console.log("Fetched round data:", data);
  }
  ).catch((error) => {
    console.error("Error fetching round data:", error);
  });
}, [])

    return (<>

<Row gutter={[8, 8]}> {/* Tighter gutter for round-by-round data */}
  {rounds.map((round, index) => (
<Col key={index} xs={12} sm={8} lg={6}>
  <div 
    onClick={() => navigate(`/${game_id}/team/${team_id}/series/${series_id}/round/${round.round}`)}
    className="cursor-pointer group"
  >
    <Card 
      variant="outlined" 
      className={`border-gray-100 rounded-xl transition-all duration-200  
        ${round.won ? 'bg-white shadow-sm' : 'bg-gray-50/50'}
      `}
      styles={{ body: { padding: '12px' } }}
    >
      <div className="flex flex-col gap-3">
        <div className="flex justify-between items-center">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest group-hover:text-black transition-colors">
            Round {round.round}
          </span>
          {/* Active indicator */}
          <div className={`w-1.5 h-1.5 rounded-full ${
            round.won ? 'bg-black' : 'bg-gray-200'
          } `} />
        </div>

        <div className="flex flex-col">
          <span className={`text-sm font-black uppercase tracking-tighter ${
            round.won ? 'text-black' : 'text-gray-300'
          }`}>
            {round.won ? 'Flawless Victory' : 'Neutralized'}
          </span>
          <div className="flex justify-between items-end">
            <span className="text-[10px] font-mono text-gray-400 uppercase">
              CODE: {round.side.toUpperCase()}
            </span>
            {/* Minimal "View" arrow that appears on hover */}
            <span className="text-[10px] opacity-0 group-hover:opacity-100 transition-opacity">
              →
            </span>
          </div>
        </div>
      </div>
    </Card>
  </div>
</Col>
  ))}
</Row>

    </>);
}

export default Round;
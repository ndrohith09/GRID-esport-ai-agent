import { Row, Col, Card } from 'antd';
import { IdcardOutlined } from '@ant-design/icons'; 
import type { PlayerType } from '../Player/types';

type Props = {
  teamPlayers: PlayerType[];
};

const PlayerRoster:React.FC<Props> = ({
  teamPlayers
}) => {

  return (
    <Row gutter={[16, 16]}>
      {teamPlayers.map((player) => (
        <Col xs={24} sm={12} md={8} lg={6} key={player.player_id}>
          <Card 
            // onClick={() => navigate(`/${game_id}/team/${team_id}/series/${player.player_id}`)}
            hoverable
            className="border-gray-100 rounded-xl overflow-hidden bg-white group transition-all duration-300"
            styles={{ body: { padding: 0 } }}
          >
            {/* Top Image Section */}
            <div className="relative h-48 bg-gray-50 flex items-center justify-center overflow-hidden">
              <div className="absolute top-2 left-2 z-10">
                 <span className="bg-black/80 text-white text-[8px] px-1.5 py-0.5 rounded font-mono uppercase">
                   ID: {player.player_id}
                 </span>
              </div>
              
              {/* Image with Desaturation Filter for "Analyst" look */}
              <img
                src={`https://i.pinimg.com/736x/b7/cf/62/b7cf62846ae6ae5e96b35cf9d5e05a7c.jpg`}
                alt={player.player_name}
                className="h-full w-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                onError={(e) => {
                  e.currentTarget.src = "https://via.placeholder.com/200?text=NO+IMAGE";
                }}
              />
              
              {/* Bottom Gradient Overlay */}
              <div className="absolute bottom-0 w-full h-12 bg-gradient-to-t from-black/50 to-transparent" />
            </div>

            {/* Content Section */}
            <div className="p-4 border-t border-gray-50">
              <div className="flex flex-col">
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">
                  Active Operative
                </span>
                <span className="text-lg font-black text-black uppercase tracking-tight">
                  {player.player_name}
                </span>
              </div>
              
              <div className="mt-3 flex justify-between items-center border-t border-gray-50 pt-2">
                 <div className="flex flex-col">
                    <span className="text-[8px] text-gray-400 uppercase">Status</span>
                    <span className="text-[10px] font-bold text-green-600 uppercase">Confirmed</span>
                 </div>
                 <IdcardOutlined className="text-gray-200 text-lg" />
              </div>
            </div>
          </Card>
        </Col>
      ))}
    </Row>
  );
};

export default PlayerRoster;
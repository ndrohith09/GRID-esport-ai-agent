import React, { useEffect, useState } from "react";
import {
  Col,
  Divider,
  Row,
  Space, 
  Typography,
} from "antd"; 
import TeamOverallSimulator from "./TeamSimulate";
import PlayerOverallSimulator from "./PlayerSimulate";
import PlayerComparison from "./PlayerComparison";
import TeamComparison from "./TeamComparison";
import type { CustomOptions, Teams } from "./types";
import { getTeamsList } from "../../api/team";

const { Text } = Typography;

const SimulateBase: React.FC = () => {
  const [teamOptions, setTeamOptions] = React.useState<CustomOptions[]>([]);

  useEffect(() => {
    getTeamsList()
      .then((data: Teams[]) => {
        const options = data.map((team, index) => ({
          value: team.team_name,
          label: `${team.team_name}`,
          key: team.team_id,
        }));
        setTeamOptions(options);
      })
      .catch((error) => {
        console.error("Error fetching teams:", error);
      });
  }, []);


  return (
    <div className="h-full w-full">
      <div className="p-6 bg-gray-50 min-h-screen ">
        <Text className="text-xl uppercase tracking-wider text-gray-400 font-semibold ml-1">
          Monte Carlo Game Simulator
        </Text>
        <Row
          gutter={[24, 24]}
          className="mt-2 h-screen overflow-y-auto custom-scrollbar overflow-hidden"
        >
          {/* LEFT COLUMN: 16/24 Width */}
          <Col span={24} lg={12} className="h-full pr-2 ">
            <Space direction="vertical" size={24} className="w-full pb-10">
              <TeamComparison teamOptions={teamOptions} />
              {/* Component 1: Probability Projection Engine */}

              <Divider titlePlacement="center">
                <Text className="text-lg uppercase tracking-wider text-gray-400 font-semibold ml-1">
                  Team Win Projector Simulator
                </Text>
              </Divider>
              {teamOptions.length ? (
              <TeamOverallSimulator teamOptions={teamOptions} />
              ) : (
                 <p className="text-gray-400 font-mono text-xs">
                    LOADING_OPERATIVE_DATA ...
                  </p> 
              )}
              {/* Component 2: YOUR NEXT COMPONENT GOES HERE */}
            </Space>
          </Col>

          {/* RIGHT COLUMN: 8/24 Width */}
          <Col span={24} lg={12} className="h-full">
            <Space direction="vertical" size={24} className="w-full">
              {/* Component 3: RIGHT SIDEBAR COMPONENT */}
              <PlayerComparison />
              <Divider titlePlacement="center">
                <Text className="text-lg uppercase tracking-wider text-gray-400 font-semibold ml-1">
                  Player Win Projection
                </Text>
              </Divider>
              <PlayerOverallSimulator />
              <br />
              <br />
              <br />
              <br />
                  <br />
              <br />
              <br />
              <br />

              <br />
              <br />
            </Space>
          </Col>
        </Row>
        
      </div> 
    </div>
  );
};

export default SimulateBase;

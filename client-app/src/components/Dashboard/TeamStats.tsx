import React, { useEffect, useState }  from "react"; 
import { Card, Col, Divider, Progress, Row, Statistic, Typography } from "antd";
import {
  Chart as ChartJS,
  RadialLinearScale,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js"; 
import WeaponAnalysisCharts from "./WeaponAnalysisCharts";
import WeaponImpactRadar from "./WeaponImpactRadar";
import PlayerRoster from "./PlayerRoster";
import SeriesTable from "./SeriesTable";
import type { TeamData } from "./types";
import { useParams } from "react-router-dom";
import { getTeamPlayers } from "../../api/team";
import type { PlayerType } from "../Player/types";
import TeamImpactAnalysis from "./TeamStrengthWeak";

ChartJS.register(RadialLinearScale, ArcElement, Tooltip, Legend);

const { Text } = Typography;

interface Props {
  isSeries?: boolean;
  loading: boolean;
  teamData: TeamData;
}
const Stats: React.FC<Props> = ({
  isSeries = false,
  teamData,
  loading
}) => {

  const {game_id, team_id} = useParams();
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

  
const getProgressColor = (percentage: number) => {
  if (percentage < 30) {
    return "#111111"; // Deep Black (Critical/Low - subtle but serious)
  } else if (percentage < 60) {
    return "#4b5563"; // Slate Gray (Moderate)
  } else if (percentage < 80) {
    return "#9ca3af"; // Light Gray (High)
  } else {
    return "#000000"; // Pure Black (Peak Performance)
  }
};


  return (
    <>
    {loading ? (
        <p className="text-gray-400 font-mono text-xs">
          LOADING_OPERATIVE_DATA ...
        </p> 
    ) : (
    <div>
      <Text className="text-[7px] uppercase tracking-wider text-gray-400 font-semibold ml-1">
        Overall Win Probablity
      </Text>
      <Progress
        percent={Number((teamData.win_probability * 100).toFixed(2))}
        percentPosition={{ align: "center", type: "inner" }}
       strokeColor={getProgressColor(teamData.win_probability * 100)}
        size={[800, 12]}
      />

        <br />
        <br />
      <Text className="text-[7px] uppercase tracking-wider text-gray-400 font-semibold ml-1">
        Team Strength
      </Text>
      <Progress
        percent={Number((teamData.team_strength_score * 100).toFixed(2))} 
        percentPosition={{ align: "center", type: "inner" }}
       strokeColor={getProgressColor(teamData.team_strength_score * 100)}
        size={[800, 12]}
      />

        <br />
          <Divider titlePlacement="center">
                <Text className="text-lg my-2 uppercase tracking-wider text-gray-400 font-semibold ml-1">
                Combat Metrics
            </Text>            
            </Divider>
<Row gutter={[12, 12]}>
  {[
    { title: "Avg Deaths per Series", value: teamData.combat_metrics.deaths, suffix: "KPS", precision: 2 },
    { title: "Avg Kills per Series", value: teamData.combat_metrics.kills, suffix: "KPS", precision: 2 },
    { title: "Headshot Ratio", value: teamData.combat_metrics.headshot_ratio *100, suffix: "%", precision: 2 },
    { title: "Kills per Death (KPD)", value: teamData.combat_metrics.kills / teamData.combat_metrics.deaths, suffix: "RATIO", precision: 2 },
    ...(isSeries ? [] : [
      { title: "Total Series Played", value: teamData.meta_data.series_count, suffix: "MATCHES", precision: 0 },
      { title: "Kills per Series (KPS)", value: teamData.combat_metrics.kills / teamData.meta_data.series_count, suffix: "AVG", precision: 2 },
    ]), { title: "Kills Difference", value: teamData.combat_metrics.kill_diff, suffix: "NET", precision: 2 },
    { title: "Player Kill Average", value: teamData.teamplay_metrics.avg_player_kills, suffix: "NET", precision: 2 },
    { title: "Kill Distribution Variance", value: teamData.teamplay_metrics.kill_distribution_std, suffix: "KILLS", precision: 2 },
    { title: "Team Assist Rate", value: teamData.teamplay_metrics.assist_density*100, suffix: "%", precision: 2 },
  ].map((stat, index) => (
    <Col key={index} xs={24} sm={12} lg={8}>
      <Card 
        variant="outlined" 
        className="border-gray-100 rounded-xl bg-white shadow-xs hover:border-gray-300 transition-colors"
        styles={{ body: { padding: '16px' } }}
      >
        <Statistic
          title={
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[1.5px]">
                {stat.title}
              </span>
            </div>
          }
          value={stat.value}
          precision={stat.precision}
          valueStyle={{ 
            fontSize: '20px', 
            fontWeight: '800', 
            color: '#000',
            fontFamily: 'Geist, Inter, sans-serif'
          }}
          suffix={
            <span className="text-[9px] font-mono text-gray-500 ml-1">
              {stat.suffix}
            </span>
          }
        />
      </Card>
    </Col>
  ))}
</Row>

      <br /> 
   
         <Divider titlePlacement="center">
                <Text className="text-lg my-2 uppercase tracking-wider text-gray-400 font-semibold ml-1">
                Team Strength & Weakness Analysis
            </Text>
            </Divider>
        <br />
        <TeamImpactAnalysis weakness={teamData.weaknesses} strengths={teamData.strengths} />
        <br />
          <Divider titlePlacement="center">
                <Text className="text-lg my-2 uppercase tracking-wider text-gray-400 font-semibold ml-1">
                Weapon Diagnostics
            </Text>
            </Divider>
        <WeaponAnalysisCharts weaponData={teamData.weapon_analysis} />
        <WeaponImpactRadar impactData={teamData.overall_weapon_win_impact} /> 
           <br />

           {!isSeries && ( 
            <>
            <Divider titlePlacement="center">
                <Text className="text-lg my-2 uppercase tracking-wider text-gray-400 font-semibold ml-1">
                Team Players
            </Text>
            </Divider>
           <br />
        <PlayerRoster teamPlayers={teamPlayers} />

       <br />
             <Divider titlePlacement="center">
                <Text className="text-lg my-2 uppercase tracking-wider text-gray-400 font-semibold ml-1">
                Team Series
            </Text>
            </Divider>
           <br />
        <SeriesTable />
          <br />
                      <br />
</>
           )}
     
    </div>
          )}
    </>
  );
};

export default Stats;

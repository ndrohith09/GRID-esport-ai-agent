import { Card, Col, Divider, Progress, Row, Space, Tag, Typography } from "antd";
import React from 'react';
import { Doughnut, Radar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { AimOutlined, FireOutlined, InfoCircleOutlined, ThunderboltFilled, ThunderboltOutlined, TrophyOutlined } from "@ant-design/icons";
import EcoSummary from "./Widgets/EcoSummary";
import ImpactAnalysis from "./PlayerStrengthWeak";
import type { PlayerRoundData } from "./round.types";

const { Text } = Typography;

ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Tooltip, Legend);

type Props = {
  playerRoundData: PlayerRoundData;
}
const PlayerRoundStats:React.FC<Props> = ({
  playerRoundData
}) => { 
  
  const labels = Object.keys(playerRoundData.weapon_summary.weapon_damage_ratio).map(l => l.toUpperCase());

  const weaponChartData = {
    labels,
    datasets: [
      {
        label: 'DAMAGE RATIO',
        data: Object.values(playerRoundData.weapon_summary.weapon_damage_ratio),
        backgroundColor: 'rgba(0, 0, 0, 0.7)', // Solid black fill
        borderColor: '#000',
        borderWidth: 2,
        pointRadius: 3,
        pointBackgroundColor: '#000',
      }
    ],
  };

  const weaponOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      r: {
        angleLines: { color: 'rgba(0,0,0,0.05)' },
        grid: { color: 'rgba(0,0,0,0.05)' },
        suggestedMin: 0,
        suggestedMax: 0.6,
        ticks: { display: false, stepSize: 0.2 },
        pointLabels: {
          font: { size: 12, family: 'monospace' },
          color: '#374151',
        },
      },
    },
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          boxWidth: 10,
          usePointStyle: true,
          font: { size: 11, family: 'monospace' },
        },
      },
    },
  };

 
  // 1. Economy Doughnut Data
  const economyData = {
    labels: ['Loadout', 'Networth', 'Reserve'],
    datasets: [{
      data: [
        playerRoundData.economy_profile.player_loadout_ratio, 
        playerRoundData.economy_profile.player_networth_ratio, 
        playerRoundData.economy_profile.money_left_ratio
      ],
      backgroundColor: ['#000000', '#4b5563', '#9ca3af'],
      hoverOffset: 4,
      borderWidth: 0,
    }]
  };

 
  const percentage = 48;
  // const percentage = player_win_probability * 100;
let color;
if (percentage < 30) {
  color = "#111111"; // Deep Black (Critical/Low - subtle but serious)
} else if (percentage < 60) {
  color = "#4b5563"; // Slate Gray (Moderate)
} else if (percentage < 80) {
  color = "#9ca3af"; // Light Gray (High)
} else {
  color = "#000000"; // Pure Black (Peak Performance)
}
    return (<>
 
          <EcoSummary eco_summary={playerRoundData.eco_summary} />
          <br />

            {/* PLAYER OBJECTIVES */}
            <Row gutter={[16, 16]}>
      {/* 1. Recommended Agent Selector */}
      <Col xs={24} lg={8}>
        <div className="bg-black text-white p-6 rounded-2xl h-full relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <AimOutlined style={{ fontSize: '120px' }} />
          </div>
          
          <div className="relative z-10">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-[3px]">Recommended Operative</span>
            <h2 className="text-4xl font-black uppercase italic mb-6">{playerRoundData.agent_fit.recommended_agent}</h2>
            
            <div className="space-y-4">
              {Object.entries(playerRoundData.agent_fit.top_agents).map(([name, score]) => (
                <div key={name} className="flex items-center justify-between">
                  <span className="text-[12px] font-mono uppercase text-gray-400">{name}</span>
                  <div className="flex gap-1">
                    {[...Array(2)].map((_, i) => (
                      <div key={i} className={`w-3 h-1 ${i < score ? 'bg-white' : 'bg-gray-800'}`} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Col>

      {/* 2. Mission Objectives Log */}
      <Col xs={24} lg={16}>
              <div className="w-full bg-white p-6 rounded-2xl border border-gray-100 shadow-sm overflow-hidden relative">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <Space>
          <div className="p-2 bg-black rounded-lg">
            <ThunderboltOutlined className="text-white" />
          </div>
          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-[2px] text-gray-400 leading-none">Loadout Synergy</h4>
            <span className="text-[11px] font-black uppercase">Utility Efficiency</span>
          </div>
        </Space>
        <Tag className="m-0 font-mono text-[9px] border-gray-200 text-gray-400 bg-gray-50">v.4.0.1</Tag>
      </div>

      {/* Ability Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(playerRoundData.ability_fit.ability_breakdown).map(([key, value]) => {
          const isBest = key === playerRoundData.ability_fit.best_ability;
          
          return (
            <div 
              key={key} 
              className={`relative p-4 rounded-xl border transition-all duration-300 ${
                isBest 
                ? 'border-black bg-black text-white shadow-lg shadow-black/10' 
                : 'border-gray-100 bg-gray-50/50 text-gray-400'
              }`}
            >
              {/* Background Rank Indicator */}
              {isBest && (
                <div className="absolute top-2 right-3 text-[10px] font-black text-white/20">
                  TOP_UTILITY
                </div>
              )}

              <div className="flex flex-col gap-3">
                <div className="flex justify-between items-start">
                  <span className={`text-[11px] font-black uppercase tracking-tight ${isBest ? 'text-white' : 'text-gray-500'}`}>
                    {key.replace(/-/g, ' ')}
                  </span>
                  {isBest && <ThunderboltFilled className="text-yellow-400 animate-pulse" />}
                </div>

                <div className="flex items-end justify-between">
                  <div className="flex flex-col">
                    <span className="text-[8px] font-bold uppercase opacity-50 mb-1">Deployment Level</span>
                    <span className={`text-[10px] font-mono font-bold uppercase ${isBest ? 'text-white' : 'text-gray-400'}`}>
                      {value.usage_level}
                    </span>
                  </div>
                  
                  <div className="text-right">
                    <span className="text-[8px] font-bold uppercase opacity-50 block mb-1">Ratio</span>
                    <span className={`text-xl font-black leading-none ${isBest ? 'text-white' : 'text-gray-200'}`}>
                      {(value.usage_ratio * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>

                {/* Micro Progress Bar */}
                <div className={`h-1 w-full rounded-full overflow-hidden ${isBest ? 'bg-white/20' : 'bg-gray-200'}`}>
                  <div 
                    className={`h-full transition-all duration-1000 ${isBest ? 'bg-white' : 'bg-gray-300'}`}
                    style={{ width: `${value.usage_ratio * 100}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Insight */}
      <div className="mt-6 flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100 border-dashed">
        <InfoCircleOutlined className="text-gray-400 mt-0.5" />
        <p className="text-[12px] text-gray-500 font-medium leading-relaxed m-0 italic">
          <span className="font-bold text-black uppercase not-italic">Diagnosis:</span> Over-reliance on <span className="text-black font-bold uppercase">"{playerRoundData.ability_fit.best_ability}"</span> detected. Strategic utility spread is suboptimal for {playerRoundData.ability_fit.best_ability === 'shrouded-step' ? 'Omen' : 'this agent'} protocol.
        </p>
      </div>
    </div>
      </Col>
{playerRoundData.objective_fit.objective_breakdown.length ? (
      <Col xs={24} lg={24}>
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm h-full">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <TrophyOutlined className="text-black" />
              <h4 className="text-[10px] font-bold uppercase tracking-[2px] text-gray-400">Objective Suitability</h4>
            </div>
            <span className="text-[9px] font-mono text-gray-300">LOG_v2.04</span>
          </div>

 
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {playerRoundData.objective_fit.objective_breakdown.map((obj, i) => (
              <div key={i} className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                <div className="flex justify-between items-start mb-4">
                  <span className="text-[10px] font-black uppercase leading-tight max-w-[60px]">{obj.objective}</span>
                </div>
                
                <div className="flex items-end gap-1 mb-2">
                  <span className="text-2xl font-black leading-none">{obj.completion_count}</span>
                  <span className="text-[9px] font-mono text-gray-400 mb-0.5">UNITS</span>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-[8px] font-bold text-gray-400 uppercase">Suitability</span>
                  <Progress 
                    percent={(obj.suitability_score / 7) * 100} 
                    showInfo={false} 
                    strokeColor="#000" 
                    size={[0, 4]} 
                    strokeLinecap="square"
                  />
                </div>
              </div>
            ))}
          </div> 
        </div> 
</Col>) : (<></>)}

    </Row>
            <br />
             <Text className="text-[7px] uppercase tracking-wider text-gray-400 font-semibold ml-1">
        Player Win Probabilty
      </Text>  
      <Progress
        percent={percentage} 
        percentPosition={{ align: "center", type: "inner" }}
        strokeColor={color}
        size={[800, 12]}
      />
  <br />
  <br />
        <Text className="text-[7px] uppercase tracking-wider text-gray-400 font-semibold ml-1">
        Player Strength Score
      </Text>  
      <Progress
        percent={percentage} 
        percentPosition={{ align: "center", type: "inner" }}
        strokeColor={color}
        size={[800, 12]}
      />
  <br />

       <Divider titlePlacement="center">
                        <Text className="text-lg my-2 uppercase tracking-wider text-gray-400 font-semibold ml-1">
                        Strength & Weakness Analysis
                    </Text>
                    </Divider>
                    <br />
       <ImpactAnalysis strengths={playerRoundData.strengths} weakness={playerRoundData.weaknesses} />
    <br/>
<Divider titlePlacement="center">
                <Text className="text-lg my-2 uppercase tracking-wider text-gray-400 font-semibold ml-1">
                Damage Analysis
            </Text>
            </Divider>

{/* Summary Notes GUI */}
<div className="w-full bg-white p-6 rounded-lg border border-gray-100 shadow-sm relative overflow-hidden">
      {/* Header Section */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <AimOutlined className="text-black" />
          <h4 className="text-[11px] font-bold uppercase tracking-[2px] text-gray-400">Combat Engagement Profile</h4>
        </div>
        <span className="text-[10px] font-mono text-gray-300">SCAN_RESULT::SUCCESS</span>
      </div>

      <Row gutter={24}>
        {/* Playstyle Logic Switches */}
        <Col span={24} lg={8}>
          <div className="flex flex-col gap-2">
            {[
              { label: 'Aim Proficiency', value: playerRoundData.playstyle.aim_heavy, icon: <AimOutlined /> },
              { label: 'Utility usage', value: playerRoundData.playstyle.utility_heavy, icon: <ThunderboltOutlined /> },
              { label: 'Rifle Specialization', value: playerRoundData.playstyle.rifler, icon: <AimOutlined /> }
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                <div className="flex items-center gap-2 text-gray-500 uppercase font-bold text-[11px]">
                  {item.icon}
                  <span>{item.label}</span>
                </div>
                <span className={`text-[10px] font-black font-mono ${item.value === "True" ? "text-black" : "text-gray-300"}`}>
                  {item.value === "True" ? "[ POSITIVE ]" : "[ NEGATIVE ]"}
                </span>
              </div>
            ))}
          </div>
        </Col>

        {/* Damage Narrative */}
        <Col span={24} lg={16}>
          <div className="h-full flex flex-col justify-between">
            <div className="p-4 border-l-2 border-black bg-gray-50/30">
              <span className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Strategic Summary</span>
              <p className="text-sm text-gray-700 font-medium italic leading-relaxed">
                "{playerRoundData.overall_damage_summary}"
              </p>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-black p-3 rounded-lg">
                <span className="text-[8px] font-bold text-gray-500 uppercase">Primary Impact Zone</span>
                <span className="block text-white font-black uppercase text-sm tracking-widest">{playerRoundData.enemy_damage_summary.primary_target}</span>
              </div>
              <div className="border border-gray-100 p-3 rounded-lg">
                <span className="text-[8px] font-bold text-gray-400 uppercase block">Engagement Type</span>
                <p className="text-xs text-gray-500 leading-tight mt-1">
                  {playerRoundData.enemy_damage_summary.summary.split('|')[1]?.trim() || playerRoundData.enemy_damage_summary.summary}
                </p>
              </div>
            </div>
          </div>
        </Col>
      </Row>

      {/* Warning/Instruction Footer */}
      <div className="mt-6 flex items-center gap-3 py-2 px-3 bg-yellow-50/50 rounded-md border border-yellow-100">
        <span className="text-[12px] font-black text-yellow-700 font-mono">! ADVISORY:</span>
        <p className="text-[12px] text-yellow-800 m-0 uppercase font-bold tracking-tight">
          High precision aim noted, yet body damage leads output. Recommend spray control calibration.
        </p>
      </div>
    </div>
            <br />

                <div className="flex flex-wrap gap-6 py-2 bg-gray-50 rounded-lg">
      
      {/* Economy Profile Plot */}
      <div className="flex-1 min-w-[300px] bg-white p-6 rounded-lg border border-gray-100 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h4 className="text-[10px] font-bold uppercase tracking-[2px] text-gray-400">Economy Profile</h4>
          <span className="text-[10px] font-mono font-bold bg-black text-white px-2 py-0.5 rounded">ECO_V1.0</span>
        </div>
        <div className="h-48 relative flex justify-center">
          <Doughnut data={economyData} options={{ cutout: '70%', plugins: { legend: { position: 'bottom', labels: { boxWidth: 8, font: { size: 9, weight: 'bold' } } } } }} />
          {/* Center Text for Doughnut */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pt-[-20px]">
            <span className="text-[9px] text-gray-400 font-bold uppercase">Efficiency</span>
            <span className="text-xl font-black">78%</span>
          </div>
        </div>
      </div>
    </div>

<div className="w-full bg-white p-6 rounded-lg border border-gray-100 shadow-sm">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h4 className="text-[10px] font-bold uppercase tracking-[2px] text-gray-400">Weapon Profile</h4>
          <span className="text-xs font-mono font-bold text-black uppercase tracking-tighter">
            Efficiency Audit
          </span>
        </div>
        <div className="bg-gray-50 px-3 py-1 rounded border border-gray-100">
          <span className="text-[9px] text-gray-400 uppercase block leading-none mb-1 font-bold">Primary</span>
          <span className="text-[11px] font-black uppercase">Rifle</span>
        </div>
      </div>

      <div className="h-[400px]">
        <Radar data={weaponChartData} options={weaponOptions} />
      </div>

      <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-100">
        <p className="text-[12px] text-gray-500 italic font-mono leading-tight">
          <span className="font-bold text-black mr-2">[LOG]:</span>
          Primary rifler relying heavily on rifles.
        </p>
      </div>
    </div>
    <br />
{/* Target - Source Analysis */}
    <Row gutter={[16, 16]}>
      {/* Target Analysis Section */}
      <Col xs={24} lg={10}>
        <div className="bg-white p-5 rounded-lg border border-gray-100 shadow-sm h-full">
          <div className="flex items-center gap-2 mb-6">
            <AimOutlined className="text-black" />
            <h4 className="text-[10px] font-bold uppercase tracking-[2px] text-gray-400">Target Distribution</h4>
          </div>
          
          <div className="flex items-center justify-around h-[200px] relative">
            {/* The Heatmap Silhouette logic */}
            <div className="flex flex-col gap-4 w-full">
              {playerRoundData.damage_target_analysis.breakdown.map((item) => (
                <div key={item.target} className="relative">
                  <div className="flex justify-between items-end mb-1">
                    <span className="text-[12px] font-black tracking-tighter">{item.target}</span>
                    <span className="text-[12px] font-mono text-gray-400">{item.hits} HITS</span>
                  </div>
                  <Progress 
                    percent={item.damage_ratio * 100} 
                    strokeColor={item.target === 'HEAD' ? '#000' : '#4b5563'} 
                    showInfo={false}
                    strokeLinecap="square"
                    size={[0, 8]}
                  />
                  <div className="flex justify-between mt-1">
                    <span className="text-[8px] font-bold text-gray-300 uppercase">DMG: {item.damage}</span>
                    <span className="text-[9px] font-bold text-black">{(item.damage_ratio * 100).toFixed(1)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Col>

      {/* Source Analysis Section */}
      <Col xs={24} lg={14}>
        <div className="bg-white p-5 rounded-lg border border-gray-100 shadow-sm h-full">
          <div className="flex justify-between items-center mb-6">
            <Space>
              <FireOutlined className="text-black" />
              <h4 className="text-[10px] font-bold uppercase tracking-[2px] text-gray-400">Damage Source Protocol</h4>
            </Space>
            <span className="text-[9px] font-mono font-bold bg-gray-100 px-2 py-0.5 rounded text-gray-500">
              PRIMARY: {playerRoundData.damage_source_analysis.most_common_source.toUpperCase()}
            </span>
          </div>

          <div className="space-y-3">
            {playerRoundData.damage_source_analysis.breakdown.map((item, idx) => (
              <div key={idx} className="group hover:bg-gray-50 p-2 rounded-lg transition-colors border border-transparent hover:border-gray-100">
                <div className="flex justify-between items-center mb-1">
                  <div className="flex items-center gap-3">
                    <span className="text-[9px] font-mono text-gray-300">0{idx + 1}</span>
                    <span className="text-[12px] font-black uppercase tracking-tight text-black">{item.source}</span>
                  </div>
                  <span className="text-[13px] font-mono font-bold">{(item.damage_ratio * 100).toFixed(1)}%</span>
                </div>
                <Progress 
                  percent={item.damage_ratio * 100} 
                  strokeColor={idx === 0 ? '#000' : '#d1d5db'} 
                  trailColor="#f9fafb"
                  showInfo={false} 
                  size={[0, 4]}
                />
                <div className="flex justify-end gap-4 mt-1">
                   <span className="text-[9px] font-bold text-gray-400">NET DAMAGE: {item.damage}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Col>
    </Row>
            <br />



    </>);
}

export default PlayerRoundStats;
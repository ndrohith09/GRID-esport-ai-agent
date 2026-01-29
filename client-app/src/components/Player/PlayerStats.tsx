import { Card, Col, Divider, Row, Statistic, Tag, Typography } from "antd";
import React from 'react';
import { Doughnut, Bar, Radar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from 'chart.js'; 
import EcoSummary from "./Widgets/EcoSummary";
import ImpactAnalysis from "./PlayerStrengthWeak";
import type { PlayerSeriesData } from "./types";

const { Text } = Typography;

ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Tooltip, Legend);

type Props = {
playerSeriesData :  PlayerSeriesData
}

const PlayerStats:React.FC<Props> = ({
  playerSeriesData
}) => {
 

  const labels = Object.keys(playerSeriesData.weapon_profile.weapon_damage_ratio).map(l => l.toUpperCase());

  const weaponChartData = {
    labels,
    datasets: [
      {
        label: 'DAMAGE RATIO',
        data: Object.values(playerSeriesData.weapon_profile.weapon_damage_ratio),
        backgroundColor: 'rgba(0, 0, 0, 0.7)', // Solid black fill
        borderColor: '#000',
        borderWidth: 2,
        pointRadius: 3,
        pointBackgroundColor: '#000',
      },
      {
        label: 'USAGE RATIO',
        data: Object.values(playerSeriesData.weapon_profile.weapon_usage_ratio),
        backgroundColor: 'rgba(156, 163, 175, 0.2)', // Light gray "ghost" fill
        borderColor: '#9ca3af',
        borderWidth: 1,
        borderDash: [5, 5], // Dashed line for usage
        pointRadius: 0, // Keep usage clean, focus on damage points
      },
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
        playerSeriesData.economy_profile.player_loadout_ratio, 
        playerSeriesData.economy_profile.player_networth_ratio, 
        playerSeriesData.economy_profile.money_left_ratio
      ],
      backgroundColor: ['#000000', '#4b5563', '#9ca3af'],
      hoverOffset: 4,
      borderWidth: 0,
    }]
  };

  // 2. Win Probability Range Chart (Horizontal Bar as a Range)
  const probabilityData = {
    labels: ['PROBABILITY RANGE'],
    datasets: [
      {
        label: 'Min to Max Spread',
        // We show the range from Min to Max
        data: [[playerSeriesData.win_probability.min, playerSeriesData.win_probability.max]], 
        backgroundColor: 'rgba(0,0,0,0.05)',
        borderColor: '#000',
        borderWidth: 1,
        barThickness: 20,
      }
    ]
  };

  const probOptions = {
    indexAxis: 'y' as const,
    scales: {
      x: { 
        min: 0, 
        max: 0.3, 
        grid: { display: false },
        ticks: { font: { family: 'monospace', size: 10 } }
      },
      y: { display: false }
    },
    plugins: {
      legend: { display: false },
      tooltip: { enabled: true }
    }
  };

    return (<>
          {/* <Text className="text-[9px] my-2 uppercase tracking-wider text-gray-400 font-semibold ml-1">
            Combat Metrics
          </Text> */}
          <EcoSummary eco_summary={playerSeriesData.eco_summary} />
          <br />
    <Row gutter={[12, 12]}>
      {[
        { title: "Common Used Weapon", value: playerSeriesData.weapon_profile.most_common_weapon.toUpperCase() },
        { title: "Play Style", value: playerSeriesData.playstyle.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase()) },
        { title: "Consistency Score", value: playerSeriesData.payer_consistency_score * 100, suffix: "%", precision: 2 }, 
      ].map((stat, index) => (
        <Col key={index} xs={24} sm={12} lg={8}>
          <Card 
            variant="outlined" 
            className="border-gray-100 rounded-xl bg-white hover:border-gray-300 transition-colors"
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
                fontSize: '18px', 
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
                      Players Strength & Weakness Analysis
                  </Text>
                  </Divider>
      <br />
      <ImpactAnalysis weakness={playerSeriesData.series_weaknesses} strengths={playerSeriesData.series_strengths} />
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

      {/* Win Probability Spread */}
      <div className="flex-1 min-w-[300px] bg-white p-6 rounded-lg border border-gray-100 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          {/* <h4 className="text-[10px] font-bold uppercase tracking-[2px] text-gray-400">Expected Prob. Analysis</h4>  */}

          <div className="flex justify-between items-start mb-10">
        <div>
          <h4 className="text-[10px] font-bold uppercase tracking-[2px] text-gray-400 mb-1">
            Win Prob. Analysis
          </h4>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-black">
              {(playerSeriesData.win_probability.mean * 100).toFixed(1)}%
            </span>
          </div>
          </div>
          </div>

          <div className="text-right">
             <span className="block text-[10px] text-gray-400 uppercase">Stability Score</span>
             <span className="text-xs font-mono font-bold">{(playerSeriesData.win_probability.stability * 100).toFixed(1)}%</span>
          </div>
        </div>

        <div className="space-y-6">
          {/* Custom Mean Indicator */}
          <div className="relative pt-4">
             <div className="h-[40px]">
                <Bar data={probabilityData} options={probOptions} />
             </div>
             {/* Mean Marker Overlay */}
             <div 
                className="absolute top-0 flex flex-col items-center transition-all duration-1000" 
                style={{ left: `${(playerSeriesData.win_probability.mean / 0.3) * 100}%` }}
             >
                <div className="w-0.5 h-12 bg-black z-10" />
                <span className="text-[9px] font-black bg-black text-white px-1 mt-1">MEAN</span>
                <span className="text-[10px] font-mono mt-0.5">{playerSeriesData.win_probability.mean.toFixed(3)}</span>
             </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-8 pt-4 border-t border-gray-50">
             <div>
                <span className="block text-[9px] text-gray-400 uppercase">Min Forecast</span>
                <span className="text-sm font-bold font-mono text-gray-300">{playerSeriesData.win_probability.min.toFixed(4)}</span>
             </div>
             <div>
                <span className="block text-[9px] text-gray-400 uppercase">Max Forecast</span>
                <span className="text-sm font-bold font-mono text-black">{playerSeriesData.win_probability.max.toFixed(4)}</span>
             </div>
          </div>
          
        </div>
      </div>

    </div>
      <br/>
<div className="w-full bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
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
          Primary rifle relying heavily on rifles. Sniper damage ratio exceeds usage, suggesting high individual shot impact.
        </p>
      </div>
    </div>

    </>);
}

export default PlayerStats;
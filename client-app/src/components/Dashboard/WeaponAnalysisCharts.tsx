import React from 'react';
import { PolarArea } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  RadialLinearScale,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js'; 
import type { WeaponAnalysis } from './types';

ChartJS.register(RadialLinearScale, ArcElement, Tooltip, Legend);

type Props = {
  weaponData : WeaponAnalysis
}

const WeaponAnalysisCharts:React.FC<Props> = ({
  weaponData
}) => {

  const wa = weaponData;

  // common minimalist options
  const commonOptions = {
    responsive: true,
    scales: {
      r: {
        grid: { color: 'rgba(0,0,0,0.05)' },
        angleLines: { color: 'rgba(0,0,0,0.05)' },
        ticks: { display: false }
      }
    },
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: { boxWidth: 8, font: { size: 9, weight: 'bold' }, usePointStyle: true }
      }
    }
  };

  // CHART A: USAGE DISTRIBUTION
  const usageData = {
    labels: ['Eco', 'Rifle', 'Shotgun', 'SMG', 'Sniper'],
    datasets: [{
      data: [wa.eco_ratio, wa.rifle_ratio, wa.shotgun_ratio, wa.smg_ratio, wa.sniper_ratio],
      backgroundColor: [
        'rgba(0,0,0,0.9)', 
        'rgba(0,0,0,0.7)', 
        'rgba(0,0,0,0.5)', 
        'rgba(0,0,0,0.3)', 
        'rgba(0,0,0,0.1)'
      ],
      borderWidth: 0
    }]
  };

  // CHART B: PERFORMANCE SCORES
  const metricsData = {
    labels: ['Benefit Score', 'Dependency', 'Entropy'],
    datasets: [{
      data: [wa.weapon_benefit_score, wa.weapon_dependency, wa.weapon_entropy],
      backgroundColor: [
        'rgba(0,0,0,0.8)', 
        'rgba(0,0,0,0.4)', 
        'rgba(0,0,0,0.1)'
      ],
      borderWidth: 0
    }]
  };

  return (
    <>
<div className="flex flex-wrap lg:flex-nowrap gap-4 p-4 w-full">
  {/* Usage Chart */}
  <div className="w-full lg:w-1/2 max-w-[400px] bg-white p-4 rounded-xl border border-gray-100 shadow-sm mx-auto">
    <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-2">
      <span className="w-1.5 h-1.5 bg-black rounded-full" />
      Weapon Class Usage
    </h4>
    <div className="relative h-[250px] flex justify-center">
      <PolarArea data={usageData} options={commonOptions} />
    </div>
  </div>

  {/* Metrics Chart */}
  <div className="w-full lg:w-1/2 max-w-[400px] bg-white p-4 rounded-xl border border-gray-100 shadow-sm mx-auto">
    <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-2">
      <span className="w-1.5 h-1.5 bg-black rounded-full" />
      Analytical Metrics
    </h4>
    <div className="relative h-[250px] flex justify-center">
      <PolarArea data={metricsData} options={commonOptions} />
    </div>
  </div>
</div>
</>
  );
};

export default WeaponAnalysisCharts;
import React from 'react';
import { Radar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';
import type { OverallWeaponWinImpact } from './types';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);


type Props = {
  impactData: OverallWeaponWinImpact
}

const WeaponImpactRadar: React.FC<Props> = ({
  impactData
}) => {

  const labels = Object.keys(impactData).map(w => w.toUpperCase());
  const values = Object.values(impactData);

  const data = {
    labels,
    datasets: [
      {
        label: 'Win Impact Score',
        data: values,
        backgroundColor: 'rgba(0, 0, 0, 0.1)', // Light gray fill
        borderColor: 'rgba(0, 0, 0, 0.8)',      // Bold black line
        borderWidth: 1.5,
        pointBackgroundColor: '#000',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: '#000',
        pointRadius: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      r: {
        angleLines: {
          display: true,
          color: 'rgba(0,0,0,0.05)',
        },
        grid: {
          color: 'rgba(0,0,0,0.05)',
        },
        suggestedMin: 0.3, // Starts near the lowest impact (Melee 0.39)
        suggestedMax: 0.7, // Ends near highest impact (Ares 0.66)
        ticks: {
          display: false, // Clean look: hide numeric scales
          stepSize: 0.1,
        },
        pointLabels: {
          font: {
            size: 8,
            weight: 'bold' as const,
            family: 'monospace',
          },
          color: '#9ca3af', // Gray text for weapon names
        },
      },
    },
    plugins: {
      legend: { display: false }, // Label in header instead
    },
  };

  return (
    <div className="w-full h-auto bg-white p-6 rounded-lg border border-gray-100 shadow-xs">
      <div className="flex justify-between items-center mb-4">
        <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-800">
          Overall Weapon Win Impact
        </h4>
        <span className="text-[10px] font-mono text-black font-bold bg-gray-100 px-2 py-0.5 rounded">
          AVG: 0.51
        </span>
      </div>
      <div className="h-[420px]">
        <Radar data={data} options={options} />
      </div>
    </div>
  );
};

export default WeaponImpactRadar;
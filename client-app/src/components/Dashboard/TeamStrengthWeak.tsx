import React from 'react';
import { Progress, Row, Col, Divider } from 'antd';
import { RiseOutlined, FallOutlined, AlertOutlined, CheckCircleOutlined } from '@ant-design/icons';
import type { TeamStrengthOrWeakness } from './types';

type Props = {
  weakness: TeamStrengthOrWeakness[];
  strengths: TeamStrengthOrWeakness[];
}

const TeamImpactAnalysis:React.FC<Props> = ({
  strengths,
  weakness
}) => {
 

  return (
    <div className="w-full bg-white p-6 rounded-lg border border-gray-100 shadow-xs">
      <div className="flex justify-between items-center mb-8">
        <div>
          {/* <h4 className="text-[10px] font-bold uppercase tracking-[2px] text-gray-400 mb-1">SWOT Analysis</h4> */}
          <span className="text-xs font-mono text-black font-bold uppercase">[ SWOT_ANALYSIS ]</span>
        </div>
        <div className="px-3 py-1 bg-gray-50 border border-gray-100 rounded text-[10px] font-mono text-gray-400">
          STABILITY: OPTIMAL
        </div>
      </div>

    {/* {JSON.stringify(strengths)} */}
      <Row gutter={32}>
        {/* STRENGTHS COLUMN */}
        <Col xs={24} md={12}>
          <div className="flex items-center gap-2 mb-4 text-green-600">
            <RiseOutlined />
            <span className="text-[11px] font-black uppercase tracking-widest">Performance Boosters</span>
          </div>
          <div className="space-y-6">
            {strengths.length && strengths.map((item, i) => (
              <div key={i} className="relative p-4 bg-green-50/30 rounded-xl border border-green-100/50">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[11px] font-black uppercase text-gray-700">{item.feature.replace(/_/g, ' ')}</span>
                  <CheckCircleOutlined className="text-green-500" />
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-1.5 bg-green-100 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500" style={{ width: '40%' }} />
                  </div>
                  <span className="text-[11px] font-mono font-bold text-green-700">+{Number(item.normalized_score).toFixed(3)}</span>
                </div>
                <span className="text-[10px] font-bold text-green-600/50 uppercase mt-2 block">{item.impact_level}</span>
              </div>
            ))}
          </div>
        </Col>

        {/* WEAKNESSES COLUMN */}
        <Col xs={24} md={12} className="mt-8 md:mt-0">
          <div className="flex items-center gap-2 mb-4 text-red-600">
            <FallOutlined />
            <span className="text-[11px] font-black uppercase tracking-widest">Critical Deficits</span>
          </div>
          <div className="space-y-4">
            {weakness.length && weakness.map((item, i) => (
              <div key={i} className="group p-3 hover:bg-red-50/30 rounded-lg transition-colors border border-transparent hover:border-red-100/50">
                <div className="flex justify-between items-center mb-1">
                  <span className={`text-[11px] font-bold uppercase ${item.impact_level.includes('high') ? 'text-red-600' : 'text-gray-600'}`}>
                    {item.feature.replace(/_/g, ' ')}
                  </span>
                  <span className="text-[11px] font-mono font-bold text-red-400">{Number(item.normalized_score).toFixed(3)}</span>
                </div>
                <Progress 
                  percent={item.normalized_score * 100} // Scaled for visual impact_level
                  strokeColor={item.impact_level.includes('high') ? '#dc2626' : '#f87171'} 
                  trailColor="#fee2e2"
                  showInfo={false} 
                  size={[0, 4]}
                />
                <div className="flex justify-between mt-1">
                   <span className="text-[10px] font-bold text-red-300 uppercase">{item.impact_level}</span>
                   {item.impact_level.includes('high') && <AlertOutlined className="text-red-500 text-[10px] animate-pulse" />}
                </div>
              </div>
            ))}
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default TeamImpactAnalysis;
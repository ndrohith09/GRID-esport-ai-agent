import { AuditOutlined } from "@ant-design/icons";
import { Divider, Tag } from "antd";
import type { PlayerSeriesData } from "../types";

type Props = {
  eco_summary: PlayerSeriesData['eco_summary']
}

const EcoSummary:React.FC<Props> = ({eco_summary}) => {
 

  return (
    <div className="w-full bg-white p-6 rounded-lg border border-gray-100 shadow-xs relative overflow-hidden">
      {/* Background Watermark */}
      <div className="absolute top-[-20px] right-[-10px] text-[60px] font-black text-gray-50/50 select-none pointer-events-none">
        ECO_REPORT
      </div>

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center gap-2 mb-6">
          <AuditOutlined className="text-black text-lg" />
          <h4 className="text-[10px] font-bold uppercase tracking-[2px] text-gray-400">
            Financial Conduct Analysis
          </h4>
        </div>

        {/* Labels / Tags Section */}
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Investment Style</span>
            <Tag className="m-0 border-black bg-black text-white text-[10px] font-mono px-3 py-0.5 rounded-full uppercase">
              {eco_summary.labels.investment_style}
            </Tag>
          </div>
          
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Credit Discipline</span>
            <Tag className="m-0 border-gray-200 bg-gray-50 text-gray-600 text-[10px] font-mono px-3 py-0.5 rounded-full uppercase">
              {eco_summary.labels.credit_discipline}
            </Tag>
          </div>
        </div>

        <Divider className="my-4 border-gray-50" />

        {/* Summary Text Section */}
        <div className="bg-gray-50/80 p-4 rounded-xl border border-dashed border-gray-200">
          <div className="flex gap-3">
            <span className="text-black font-black font-mono text-sm leading-none">[LOG]</span>
            <p className="text-xs text-gray-600 font-medium leading-relaxed m-0">
              {eco_summary.summary}
            </p>
          </div>
        </div>

        {/* Footer Metrics */}
        <div className="mt-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full" />
            <span className="text-[9px] font-bold text-gray-400 uppercase">Profile Verified</span>
          </div>
          <span className="text-[10px] font-mono text-gray-300">SECURE_DATA_NODE_04</span>
        </div>
      </div>
    </div>
  );
};

export default EcoSummary;
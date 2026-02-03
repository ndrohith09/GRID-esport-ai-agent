import React from 'react';
import { FilePdfFilled, DownloadOutlined, ExportOutlined } from '@ant-design/icons';

interface ArtifactProps {
  artifacts: {
    pdf_url: string;
    tool_name: string;
  };
}

const ScoutingReportCard: React.FC<ArtifactProps> = ({ artifacts }) => {
  const { pdf_url, tool_name } = artifacts;

  // Function to handle direct download
  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = pdf_url;
    link.setAttribute('download', 'Scouting_Report.pdf');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full max-w-[300px] bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm my-2 transition-all hover:shadow-md">
      {/* Header Area */}
      <div className="bg-gray-50 px-4 py-3 border-bottom border-gray-100 flex items-center gap-3">
        <div className="bg-gray-100 p-2 rounded-lg">
          <FilePdfFilled className="text-red-500 text-xl" />
        </div>
        <div className="flex flex-col overflow-hidden">
          <span className="text-[11px] font-black uppercase text-gray-500 tracking-wider leading-none">
            AI Scouting Report
          </span> 
        </div>
      </div>

      {/* Action Area */}
      <div className="p-2 flex gap-2">
        {/* Open Button */}
        <button
          onClick={() => window.open(pdf_url, '_blank')}
          className="flex-1 flex items-center justify-center gap-2 py-2 text-[12px] font-bold text-white bg-black rounded-lg hover:bg-gray-800 transition-colors"
        >
          <ExportOutlined />
          Open
        </button>

        {/* Download Button */}
        <button
          onClick={handleDownload}
          className="px-3 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          title="Download PDF"
        >
          <DownloadOutlined />
        </button>
      </div>
       
    </div>
  );
};

export default ScoutingReportCard;
import React, { useEffect, useState } from "react";
import {
  Slider,
  Button,
  Row,
  Col,
  Card,
  Statistic,
  Divider,
  Tag,
  Typography,
  Select,
  AutoComplete,
} from "antd";
import {
  RocketOutlined,
  SettingOutlined,
  UserOutlined,
} from "@ant-design/icons";
import type { CustomOptions } from "./types";
import { useParams } from "react-router-dom";
import { getTeamProbability } from "../../api/simulation";

const { Text } = Typography;

type Props = {
  teamOptions: CustomOptions[];
};

/* 
{
    "combat_metrics.kills": 210,
    "combat_metrics.deaths": 200,
    "combat_metrics.headshot_ratio": 0.5,
    "overall_weapon_win_impact.phantom": 0.55,
    "team_strength_score": 0.7,
    "teamplay_metrics.assist_density": 0.9,
    "teamplay_metrics.avg_player_kills": 40,
    "weapon_analysis.rifle_ratio": 0.05,
    "weapon_analysis.eco_ratio": 0.05,
    "weapon_analysis.shotgun_ratio": 0.05,
    "weapon_analysis.smg_ratio": 0.05,
    "weapon_analysis.sniper_ratio": 0.05,
    "weapon_analysis.weapon_dependency": 0.4,
    "weapon_analysis.weapon_entropy": 0.4,
  }
  */
const TeamOverallSimulator: React.FC<Props> = ({ teamOptions }) => {
  // 1. Initial State using your specific keys
  const [params, setParams] = useState({});

  const { team_id } = useParams();

  const initTeam = teamOptions.find((option) => option.key === Number(team_id));

  const [probability, setProbability] = useState<number | null>(null);
  const [kills, setKills] = useState<number | null>(null);
  const [deaths, setDeaths] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [calibrating, setCalibrating] = useState(false);

  const [teamName, setTeamName] = useState<string>(initTeam?.value ?? "");
  const [teamId, setTeamId] = useState<string>(team_id ?? '');

  useEffect(() => {
    getTeamProbability(team_id ?? "", {})
      .then((data) => {
        setProbability(Number((data.mc.winprob_mean * 100).toFixed(2)));
        setKills(Number((data.mc.kills_mean).toFixed(2)));        
        setDeaths(Number((data.mc.deaths_mean).toFixed(2)));        
        setLoading(false);
        setParams(data.simulator_params); 
      })
      .catch((err) => {
        console.log(err);
      });
  }, []);

  // 2. Universal onChange Handler
  const handleParamChange = (key: string, value: number) => {
    setParams((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // 3. Simulation Logic (Mocking backend call)
  const runSimulation = () => { 
    setCalibrating(true);
    getTeamProbability(teamId, params)
      .then((data) => {
        setProbability(Number((data.mc.winprob_mean * 100).toFixed(2)));
        setKills(Number((data.mc.kills_mean).toFixed(2)));        
        setDeaths(Number((data.mc.deaths_mean).toFixed(2)));  
        setParams(data.simulator_params); 
        setCalibrating(false);
      })
      .catch((err) => {
        console.log(err);
      });
  };

  return (
    <>
      {loading ? (
        <p className="text-gray-400 font-mono text-xs">
          MONTE_CARLO_SIMULATING_DATA ...
        </p>
      ) : (
        <div className="bg-white p-8 rounded-xl border border-gray-100 shadow-xs relative overflow-hidden">
          <div className="bg-white relative overflow-hidden">
            {/* 1. TOP RIGHT SELECTOR */}
            <div className="absolute top-0 right-0 z-20 w-40">
              <AutoComplete
                value={teamName}
                defaultValue={teamName}
                className="pt-3 h-10 w-full px-0 text-xs border-b border-gray-100 rounded-none focus:border-black transition-colors placeholder:text-gray-300"
                options={teamOptions}
                onSelect={(value, option) => {
                  setTeamName(value);
                  setTeamId(option.key.toString());
                }}
                showSearch={{
                  filterOption: (inputValue, option) =>
                    option!.value
                      .toUpperCase()
                      .indexOf(inputValue.toUpperCase()) !== -1,
                }}
                onChange={(data) => setTeamName(data)}
                placeholder="Select Team"
              />
            </div>

            {/* 2. MAIN CENTER CONTENT */}

            <div className="text-center mb-8 relative z-10">
              <span className="text-[11px] font-bold text-gray-800 uppercase tracking-[0.3em] block mb-4">
                Win Probability
              </span>
                
                {calibrating ? (
                     <span className="text-[11px] font-mono text-gray-300 uppercase tracking-[4px] border border-gray-100 px-6 py-2 rounded-full">
                      Calculating_For_Parameters
                    </span>
                ) : (
              <div className="relative inline-flex flex-col items-center">
                {(probability !== null) ? (
                  <div className="flex flex-col items-center animate-in fade-in slide-in-from-bottom-2 duration-700">
                    <div className="flex items-start">
                      <span className="text-6xl font-semibold tracking-tighter text-black leading-none">
                        {probability && probability.toFixed(1)}
                      </span>
                      <span className="text-2xl font-bold text-black mt-2 ml-1">
                        %
                      </span>
                    </div>

                    <div className="flex gap-8 mt-6">
          <div className="flex flex-col items-center">
            <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Total_Kills</span>
            <span className="text-xl font-mono font-black text-black">
               {kills}
            </span>
          </div>
          
          <div className="w-px h-8 bg-gray-100 self-end mb-1" /> {/* Vertical Divider */}

          <div className="flex flex-col items-center">
            <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Total_Deaths</span>
            <span className="text-xl font-mono font-black text-gray-400">
               {deaths}
            </span>
          </div>
        </div>        
                  </div>
                ) : (
                  <div className="py-6">
                    <span className="text-[11px] font-mono text-gray-300 uppercase tracking-[4px] border border-gray-100 px-6 py-2 rounded-full">
                      Waiting_For_Parameters
                    </span>
                  </div>
                )}
              </div>
              )}

              {/* 3. PROGRESS BAR */}
              <div className="w-full max-w-sm mx-auto mt-6">
                <div className="relative h-1 bg-gray-100 rounded-full overflow-hidden">
                  <div className="absolute left-1/2 top-0 w-px h-full bg-gray-200 z-10" />
                  <div
                    className="h-full bg-black transition-all duration-1000 ease-out"
                    style={{ width: `${probability || 0}%` }}
                  />
                </div>

                <div className="flex justify-between mt-3 px-1">
                  <div className="flex flex-col items-start">
                    <span className="text-[8px] font-black text-gray-400 uppercase">
                      Defeat_Likely
                    </span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[8px] font-black text-gray-400 uppercase">
                      Victory_Confirmed
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Divider className="border-gray-50">
            <Tag className="bg-black text-white border-none text-[10px] font-mono px-4">
              CALIBRATION_MODE
            </Tag>
          </Divider>

          <div className="flex items-center gap-2 mb-6">
            <SettingOutlined className="text-black" />
            <h4 className="text-[10px] font-bold uppercase tracking-[2px] text-gray-400">
              Simulation Variables
            </h4>
          </div>

          {/* SLIDERS GO HERE (Map through your keys) */}
              {/* {JSON.stringify(params)} */}
          <Row gutter={[32, 24]}>
            {Object.entries(params).map(([key, value]) => (
              <Col span={12} key={key}>
                <div className="mb-4">
                  <div className="flex justify-between mb-1">
                    <span className="text-[9px] font-mono text-gray-400 uppercase truncate pr-2">
                      {key}
                    </span>
                    <span className="text-[11px] font-bold text-black">
                      {value}
                    </span>
                  </div>
                  <Slider
                    min={
                      key.includes("ratio") ||
                      key.includes("score") ||
                      key.includes("density") ||
                      key.includes("entropy") ||
                      key.includes("dependency")
                        ? 0
                        : 0
                    }
                    max={
                      key.includes("ratio") ||
                      key.includes("score") ||
                      key.includes("density") ||
                      key.includes("entropy") ||
                      key.includes("dependency")
                        ? 1
                        : 500
                    }
                    step={
                      key.includes("ratio") ||
                      key.includes("score") ||
                      key.includes("density") ||
                      key.includes("entropy") ||
                      key.includes("dependency")
                        ? 0.01
                        : 1
                    }
                    value={value}
                    onChange={(val) => handleParamChange(key, val)}
                    trackStyle={{ backgroundColor: "#000" }}
                    handleStyle={{
                      borderColor: "#000",
                      backgroundColor: "#000",
                    }}
                  />
                </div>
              </Col>
            ))}
          </Row>

          <div className="mt-8 flex justify-center">
            <button
              onClick={runSimulation}
              //   loading={loading}
              className="bg-black cursor-pointer text-white px-6 py-2 rounded-full text-[10px] font-bold uppercase tracking-[2px] hover:bg-gray-800 transition-colors"
            >
              {calibrating ? 'Simulating' : 'Initialize Team Simulation' }
            </button>
          </div>
        </div>
      )}{" "}
    </>
  );
};

export default TeamOverallSimulator;

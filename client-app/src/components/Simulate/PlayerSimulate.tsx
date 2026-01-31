import React, { useEffect, useState } from "react";
import {
  Slider,
  Row,
  Col,
  Divider,
  Tag,
  Space,
  Typography,
  Select,
  AutoComplete,
} from "antd";
import {
  SettingOutlined,
  ThunderboltOutlined,
  WalletOutlined,
  AimOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { getTeamPlayers } from "../../api/team";
import { useParams } from "react-router-dom";
import type { PlayerType } from "../Player/types";
import { getPlayerProbability } from "../../api/simulation";

const { Text } = Typography;

// --- 1. MOVE THE HELPER OUTSIDE THE MAIN COMPONENT ---
interface SliderBlockProps {
  apiKey: string;
  value: number;
  onChange: (key: string, value: number) => void;
}

const SliderBlock = ({ apiKey, value, onChange }: SliderBlockProps) => (
  <div className="mb-4">
    <div className="flex justify-between items-center mb-1">
      <span className="text-[9px] font-mono text-gray-400 uppercase tracking-tighter">
        {apiKey}
      </span>
      <span className="text-[11px] font-black font-mono">
        {value.toFixed(2)}
      </span>
    </div>
    <Slider
      min={0}
      max={1}
      step={0.01}
      value={value}
      onChange={(val) => onChange(apiKey, val)}
      trackStyle={{ backgroundColor: "#000" }}
      handleStyle={{ borderColor: "#000", backgroundColor: "#000" }}
      railStyle={{ backgroundColor: "#f3f4f6" }}
    />
  </div>
);

/* 
  "weapon_usage_ratio.rifle": 0.62,
    "weapon_usage_ratio.smg": 0.62,
    "weapon_usage_ratio.shotgun": 0.62,
    "weapon_usage_ratio.pistol": 0.62,
    "weapon_usage_ratio.ability": 0.62,
    
    "weapon_damage_ratio.rifle": 0.70,
    "weapon_damage_ratio.smg": 0.70,
    "weapon_damage_ratio.pistol": 0.70,
    "weapon_damage_ratio.shotgun": 0.70,
    "weapon_damage_ratio.ability": 0.70,

    "economy_profile.player_loadout_ratio": 0.23,
    "economy_profile.player_networth_ratio": 0.23,
    "economy_profile.money_left_ratio": 0.23,
    "payer_consistency_score": 0.78, 
  */

const PlayerSimulator = () => {
  // 1. Initial State with your specific keys
  const [params, setParams] = useState({});

  const { team_id } = useParams();

  const [probability, setProbability] = useState<number | null>(null);
  const [myTeamPlayers, setMyTeamPlayers] = useState<PlayerType[]>([]);
  const [playerAId, setPlayerAId] = useState<string>();
  const [playerAName, setPlayerAName] = useState<string>();
  const [loading, setLoading] = useState(true);
  const [calibrating, setCalibrating] = useState(false);

  const [loaderText, setLoaderText] = useState<string>("FETCHING_TEAM_PLAYERS");

  useEffect(() => {
    getTeamPlayers(team_id ?? "")
      .then((data) => {
        setMyTeamPlayers(data);
        setPlayerAId(data[0].player_id);
        setPlayerAName(data[0].player_name);
        setLoaderText("MONTE_CARLO_SIMULATING_DATA");
        getPlayerProbability(data[0].player_id, params)
          .then((data) => {
            console.log("getPlayerProbability", data);
            setProbability(
              Number((data.mc.monte_carlo.scenario.mean * 1000).toFixed(2)),
            );
            setParams(data.simulator_params);
            setLoading(false);
          })
          .catch((err) => {
            console.log(err);
          });
      })
      .catch((error) => {
        console.error("Error fetching team players:", error);
      });
  }, []);

  // 2. Universal onChange Handler
  const handleParamChange = (key: string, value: number) => {
    setParams((prev) => ({ ...prev, [key]: value }));
  };

  // 3. Simulation Logic (Mocking backend call)
  const runSimulation = () => {
    setCalibrating(true);
    getPlayerProbability(playerAId ?? "", params)
      .then((data) => {
        console.log("getPlayerProbability", data);
        setProbability(
          Number((data.mc.monte_carlo.scenario.mean * 1000).toFixed(2)),
        );
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
        <p className="text-gray-400 font-mono text-xs">{loaderText} ...</p>
      ) : (
        <div className="bg-white p-8 rounded-xl border border-gray-100 shadow-xs">
          {/* Output Display */}
          <div className="bg-white relative overflow-hidden">
            {/* 1. TOP RIGHT SELECTOR */}
            <div className="absolute top-0 right-0 z-20 w-40">
              <AutoComplete
                value={playerAName}
                className="pt-3 h-10 w-full px-0 text-xs border-b border-gray-100 rounded-none focus:border-black transition-colors placeholder:text-gray-300"
                options={myTeamPlayers.map((player) => ({
                  value: player.player_id,
                  label: player.player_name,
                }))}
                onSelect={(value, option) => {
                  setPlayerAName(option.label);
                  setPlayerAId(value);
                }}
                showSearch={{
                  filterOption: (inputValue, option) =>
                    option!.label
                      .toUpperCase()
                      .indexOf(inputValue.toUpperCase()) !== -1,
                }}
                onChange={(data) => setPlayerAName(data)}
                placeholder="Select Player"
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
                {probability !== null ? (
                  <div className="flex flex-col items-center animate-in fade-in slide-in-from-bottom-2 duration-700">
                    <div className="flex items-start">
                      <span className="text-6xl font-semibold tracking-tighter text-black leading-none">
                        {probability.toFixed(1)}
                      </span>
                      <span className="text-2xl font-bold text-black mt-2 ml-1">
                        %
                      </span>
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
              <div className="w-full max-w-sm mx-auto mt-10">
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

          <Divider>
            <Tag className="font-mono text-[10px] bg-black text-white border-none">
              CALIBRATION_MODE
            </Tag>
          </Divider>

          {Object.entries(params).length ? (
            <Row gutter={[32, 32]}>
              {/* WEAPON USAGE MODULE */}
              <Col span={24} lg={12}>
                <Space className="mb-4">
                  <ThunderboltOutlined />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                    Weapon Usage Ratios
                  </span>
                </Space>
                <SliderBlock
                  apiKey="weapon_usage_ratio.rifle"
                  value={params["weapon_usage_ratio.rifle"]}
                  onChange={handleParamChange}
                />
                <SliderBlock
                  apiKey="weapon_usage_ratio.smg"
                  value={params["weapon_usage_ratio.smg"]}
                  onChange={handleParamChange}
                />
                <SliderBlock
                  apiKey="weapon_usage_ratio.shotgun"
                  value={params["weapon_usage_ratio.shotgun"]}
                  onChange={handleParamChange}
                />
                <SliderBlock
                  apiKey="weapon_usage_ratio.pistol"
                  value={params["weapon_usage_ratio.pistol"]}
                  onChange={handleParamChange}
                />
                <SliderBlock
                  apiKey="weapon_usage_ratio.ability"
                  value={params["weapon_usage_ratio.ability"]}
                  onChange={handleParamChange}
                />
              </Col>

              {/* WEAPON DAMAGE MODULE */}
              <Col span={24} lg={12}>
                <Space className="mb-4">
                  <AimOutlined />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                    Weapon Damage Ratios
                  </span>
                </Space>

                <SliderBlock
                  apiKey="weapon_damage_ratio.rifle"
                  value={params["weapon_damage_ratio.rifle"]}
                  onChange={handleParamChange}
                />
                <SliderBlock
                  apiKey="weapon_damage_ratio.smg"
                  value={params["weapon_damage_ratio.smg"]}
                  onChange={handleParamChange}
                />
                <SliderBlock
                  apiKey="weapon_damage_ratio.shotgun"
                  value={params["weapon_damage_ratio.shotgun"]}
                  onChange={handleParamChange}
                />
                <SliderBlock
                  apiKey="weapon_damage_ratio.pistol"
                  value={params["weapon_damage_ratio.pistol"]}
                  onChange={handleParamChange}
                />
                <SliderBlock
                  apiKey="weapon_damage_ratio.ability"
                  value={params["weapon_damage_ratio.ability"]}
                  onChange={handleParamChange}
                />
              </Col>

              {/* ECONOMY & CONSISTENCY */}
              <Col span={24}>
                <Divider
                  plain
                  className="text-[10px] uppercase font-bold text-gray-300"
                >
                  Economic & Global Metrics
                </Divider>
                <Row gutter={32}>
                  <Col span={12}>
                    <Space className="mb-4">
                      <WalletOutlined />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                        Eco Profile
                      </span>
                    </Space>
                    <SliderBlock
                      apiKey="economy_profile.player_loadout_ratio"
                      value={params["economy_profile.player_loadout_ratio"]}
                      onChange={handleParamChange}
                    />
                    <SliderBlock
                      apiKey="economy_profile.player_networth_ratio"
                      value={params["economy_profile.player_networth_ratio"]}
                      onChange={handleParamChange}
                    />
                    <SliderBlock
                      apiKey="economy_profile.money_left_ratio"
                      value={params["economy_profile.money_left_ratio"]}
                      onChange={handleParamChange}
                    />
                  </Col>
                  <Col span={12} className="flex flex-col justify-center">
                    <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100 border-dashed text-center">
                      <span className="text-[10px] font-bold text-gray-400 uppercase block mb-4">
                        Final Consistency Weight
                      </span>
                      <Slider
                        min={0}
                        max={1}
                        step={0.01}
                        value={params.payer_consistency_score}
                        onChange={(v) =>
                          handleParamChange("payer_consistency_score", v)
                        }
                        trackStyle={{ backgroundColor: "#000" }}
                      />
                      <span className="text-2xl font-black font-mono">
                        {Number(
                          (params.payer_consistency_score * 100).toFixed(2),
                        )}
                      </span>
                    </div>
                  </Col>
                </Row>
              </Col>
            </Row>
          ) : (
            <p className="text-gray-400 font-mono text-xs">
              ERROR_IN_SIMULATING_PARMS...
            </p>
          )}

          <div className="mt-8 flex justify-center">
            <button
              onClick={runSimulation}
              className="bg-black cursor-pointer text-white px-6 py-2 rounded-full text-[10px] font-bold uppercase tracking-[2px] hover:bg-gray-800 transition-colors"
            >
              {calibrating ? "Simulating" : "Initialize Player Simulation"}
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default PlayerSimulator;

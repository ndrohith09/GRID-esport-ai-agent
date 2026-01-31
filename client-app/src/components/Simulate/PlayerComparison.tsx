import React, { useEffect, useState } from "react";
import { Select, Button, Space, Divider, Tag, AutoComplete } from "antd";
import { SwapOutlined, UserOutlined, FireFilled } from "@ant-design/icons";
import { useParams } from "react-router-dom";
import { getAllPlayers, getTeamPlayers } from "../../api/team";
import type { PlayerType } from "../Player/types";
import { getPlayersCompareProbability } from "../../api/simulation";

const PlayerComparison = () => {
  const [results, setResults] = useState<{
    probA: number;
    probB: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  const [myTeamPlayers, setMyTeamPlayers] = useState<PlayerType[]>([]);
  const [allTeamPlayers, setAllTeamPlayers] = useState<PlayerType[]>([]);
  const [playerAId, setPlayerAId] = useState<string>();
  const [playerAName, setPlayerAName] = useState<string>();
  const [playerBName, setPlayerBName] = useState<string>();
  const [playerBId, setPlayerBId] = useState<string>();

  const { team_id } = useParams();

  useEffect(() => {
    getTeamPlayers(team_id ?? "")
      .then((data) => {
        setMyTeamPlayers(data);
        setPlayerAId(data[0].player_id);
        setPlayerAName(data[0].player_name);
      })
      .catch((error) => {
        console.error("Error fetching team players:", error);
      });

      getAllPlayers()
      .then((data) => {
        setAllTeamPlayers(data);
      })
      .catch((error) => {
        console.error("Error fetching team players:", error);
      });

  }, []);

  const handleSimulate = () => {
    //  console.log("players", playerAId, playerBId)
    if (!playerAId || !playerBId) return;
    setLoading(true);
    getPlayersCompareProbability(playerAId, playerBId).then((data) => {
      console.log("getTeamsCompareProbability", data);
      setResults({
        probA: Number((data.pA_win_mean * 100).toFixed(2)),
        probB: Number((data.pB_win_mean * 100).toFixed(2)),
      });
      setLoading(false);
    }); 
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-xs overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <Space>
          <div>
            <h4 className="text-[11px] font-bold uppercase tracking-[1px] text-gray-800 leading-none mb-1">
              Player Combat Simulator
            </h4>
          </div>
        </Space>
        <Tag className="m-0 border-gray-200 text-gray-400 bg-gray-50 font-mono text-[9px]">
          v1.0.4_DUEL
        </Tag>
      </div>

      {/* Selection UI */}
      <div className="flex flex-col md:flex-row items-center gap-4 mb-10">

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
              option!.label.toUpperCase().indexOf(inputValue.toUpperCase()) !==
              -1,
          }}
          onChange={(data) => setPlayerAName(data)}
          placeholder="PLAYER B"
        />
 
        <div className="text-gray-300 font-black italic text-xs px-2">VS</div>

        <AutoComplete
          value={playerBName}
          className="pt-3 h-10 w-full px-0 text-xs border-b border-gray-100 rounded-none focus:border-black transition-colors placeholder:text-gray-300"
          options={allTeamPlayers.map((player) => ({
            value: player.player_id,
            label: player.player_name,
          }))}
          onSelect={(value, option) => {
            setPlayerBName(option.label);
            setPlayerBId(value);
          }}
          showSearch={{
            filterOption: (inputValue, option) =>
              option!.label.toUpperCase().indexOf(inputValue.toUpperCase()) !==
              -1,
          }}
          onChange={(data) => setPlayerBName(data)}
          placeholder="PLAYER B"
        />

        <button
          onClick={handleSimulate}
          disabled={!playerAId || !playerBId || loading}
          className="bg-black text-white cursor-pointer px-6 py-2 rounded-full text-[10px] font-bold uppercase tracking-[2px] hover:bg-gray-800 transition-colors"
        >
          {loading ? "Simulating" : "Simulate"}
        </button>
      </div>

      {/* Distribution Bar */}
      {results && (
        <div className="animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="flex justify-between items-end mb-3">
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase text-gray-400">
                Player_A
              </span>
              <span className="text-2xl font-black italic">
                {results.probA}%
              </span>
            </div>
            <div className="pb-1">
              <FireFilled className="text-gray-100 text-2xl" />
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-black uppercase text-gray-400">
                Player_B
              </span>
              <span className="text-2xl font-black italic">
                {results.probB}%
              </span>
            </div>
          </div>

          {/* Single Stacked Distribution Bar */}
          <div className="h-4 w-full bg-gray-100 rounded-full overflow-hidden flex relative">
            {/* Player A Segment */}
            <div
              className="h-full bg-black transition-all duration-1000 ease-out relative border-r border-white/20"
              style={{ width: `${results.probA}%` }}
            >
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle,white_1px,transparent_1px)] bg-[size:6px_6px]" />
            </div>
            {/* Player B Segment */}
            <div
              className="h-full bg-gray-300 transition-all duration-1000 ease-out"
              style={{ width: `${results.probB}%` }}
            />
          </div>

          {/* Footer Insight */}
          <div className="mt-6 p-4 bg-gray-50 rounded-xl border border-dashed border-gray-200 text-center">
            <p className="text-[9px] font-mono text-gray-500 m-0 leading-relaxed uppercase tracking-tighter">
              [SYSTEM_LOG]: Win probability skewed toward{" "}
              <span className="text-black font-bold">
                {results.probA > results.probB ? "Player A" : "Player B"}
              </span>{" "}
              based on current combat metrics & weapon proficiency.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlayerComparison;

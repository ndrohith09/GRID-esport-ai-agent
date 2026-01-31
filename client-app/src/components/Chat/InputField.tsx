import { SendOutlined } from "@ant-design/icons";
import { Button, Flex, Mentions } from "antd";
import { useEffect, useState } from "react";
import { getAllPlayers, getTeamSeriesList, getTeamsList } from "../../api/team";
import type { Teams } from "../Simulate/types";
import type { PlayerType } from "../Player/types";
import { useParams } from "react-router-dom";
import type { SeriesData } from "../Dashboard/types";

export type SelectOptions = {
    value: string;
    label: string;
    key: number;
    id: string;
}

const ChatInput = () => {
  const [input, setInput] = useState("");
  const [hiddenInput, setHiddenInput] = useState('');
  const [activeOptions, setActiveOptions] = useState<
    { value: string; label: string }[]
  >([]);

  const { team_id } = useParams();

  const [teams, setTeams] = useState<SelectOptions[]>([]);
  const [allTeamPlayers, setAllTeamPlayers] = useState<SelectOptions[]>([]);
  const [seriesData, setSeriesData] = useState<SelectOptions[]>([]);

  useEffect(() => {
    getTeamsList()
      .then((data: Teams[]) => {
        const teamOptions = data.map((team) => ({
          value: team.team_name,  
          label: team.team_name,  
          key: Number(team.team_id), 
          id: team.team_id.toString()
        }));
        setTeams(teamOptions);
        console.log("Fetched Teams:", data);
      })
      .catch((error) => {
        console.error("Error fetching teams:", error);
      });

    getTeamSeriesList(team_id ?? "")
      .then((data: SeriesData[]) => {
        const teamOptions = data.map((team) => ({
          value: `${team.series_id})-${team.tournament_name}`,  
          label: `(${team.series_id})-${team.tournament_name}`,  
          key: Number(team.series_id), 
          id: team.series_id.toString()
        }));
        setSeriesData(teamOptions);
      })
      .catch((error) => {
        console.error("Error fetching series:", error);
      });
  }, []);

  useEffect(() => {
    getAllPlayers()
      .then((data: PlayerType[]) => {
        const options = data.map((team) => ({
          value: team.player_name,  
          label: team.player_name,  
          key: Number(team.player_id), 
          id: team.player_id.toString()
        }));
        setAllTeamPlayers(options);
        console.log("Fetched Teams:", data);
      })
      .catch((error) => {
        console.error("Error fetching teams:", error);
      });
  }, []);

  const handleSend = () => {
    console.log("input - ", input,  hiddenInput)
    // if (!input.trim()) return;
    // setMessages([...messages, { role: "user", text: input }]);
    // setInput("");
  };

  // Logic to switch data source based on prefix
  const handleSearch = (_: string, prefix: string) => {
    if (prefix === "#") {
      setActiveOptions(teams);
    } else if (prefix === "@") {
      setActiveOptions(allTeamPlayers);
    } else if (prefix === "$") {
      setActiveOptions(seriesData);
    }
  };
  return (
    <div className="p-4 bg-white border-t border-gray-50 flex-none">
      <div className="max-w-full mx-auto"> 
        <Flex gap={6} className="mb-3 overflow-x-auto pb-1 no-scrollbar">
          {["Quick Stats", "What-if scenario", "Generate Scouting Report"].map((opt) => (
            <button
              key={opt}
              className="px-2 py-1 my-1 rounded-md border border-gray-100 text-[9px] font-bold text-gray-400 hover:border-black hover:text-black transition-all uppercase"
            >
              {opt}
            </button>
          ))}
        </Flex>

        <div className="flex bg-gray-50 shadow-xs rounded-xl border border-gray-100 p-1.5 focus-within:bg-white focus-within:border-gray-200 transition-all">
       
        <Mentions
        autoSize={{ minRows: 1, maxRows: 4 }}
        placeholder="Type @ for players, # for teams, $ for series..."
        value={input}
        onChange={(val) => setInput(val)}
        onSearch={handleSearch}  
        onSelect={(option, prefix) => {
          let newValue = input;
          let hiddenValue = input;
          if (prefix === '@') {
            newValue += option.label;
            hiddenValue += `player_id:${option.id} `;
          } else if (prefix === '#') {
            newValue += option.label;
            hiddenValue += `team_id:${option.id} `;
          } else if (prefix === '$') {
            newValue += option.label;
            hiddenValue += `series_id:${option.id} `;
          }
          setInput(newValue);
          setHiddenInput(hiddenValue);
        }}
        variant="borderless"
        className="pr-12 text-[12px] py-1 placeholder:text-gray-300 w-full"
        prefix={["@", "#", "$"]}
        options={activeOptions}
      />

          <Button
            type="text"
            icon={<SendOutlined style={{ fontSize: "14px" }} />}
            onClick={handleSend}
            className={`absolute right-1 bottom-0 ${input.trim() ? "text-black" : "text-gray-300"}`}
          />
        </div>
      </div>
    </div>
  );
};

export default ChatInput;

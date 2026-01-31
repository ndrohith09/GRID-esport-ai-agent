import React, { useEffect, useState } from "react";
import { Button, Typography, message, AutoComplete } from "antd";
import { CheckCircleFilled, CheckOutlined } from "@ant-design/icons";
import { addNewTeam, getTeamsList } from "../api/team";
import { useNavigate } from "react-router-dom";
import type { CustomOptions, Teams } from "./Simulate/types";

const { Text } = Typography;


const AddTeam: React.FC = () => {
  const [selectedGame, setSelectedGame] = useState<string>("");
  const [teamName, setTeamName] = useState("");
  const [teamId, setTeamId] = useState<string>("");   
  const [teamOptions, setTeamOptions] = React.useState<CustomOptions[]>([])

  const navigate = useNavigate();

useEffect(() => {
  getTeamsList().then((data : Teams[] ) => {
    // setRawTeams(data);
    console.log("Fetched Teams:", data);
    const options = data.map((team, index) => ({
      value: team.name, 
      label: `${team.name}`, 
      key: team.team_id          
    }));
    setTeamOptions(options);
  }).catch((error) => {
    console.error("Error fetching teams:", error);
  });
},[]);

  const games = [
    {
      id: "valorant",
      name: "VALORANT",
      img: "https://i.pinimg.com/736x/b7/cf/62/b7cf62846ae6ae5e96b35cf9d5e05a7c.jpg",
    },
    {
      id: "lol",
      name: "LEAGUE OF LEGENDS",
      img: "https://i.pinimg.com/736x/b7/cf/62/b7cf62846ae6ae5e96b35cf9d5e05a7c.jpg",
    },
  ];
 
 const teamSubmitHandler = () => {
  
  addNewTeam(teamId, teamName, selectedGame).then((data) => {
    message.success("Team added successfully!");
    navigate(`/${data.game_id}/team/${data.team_id}/`);
  }).catch((error) => {
    console.error("Error adding team:", error);
    message.error("Failed to add team.");
  });
 }

  return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-white p-6 font-sans">
      <div className="w-full max-w-sm flex flex-col items-center">
        {/* Top Centered Header */}
        <div className="text-center mb-8">
          <h1 className="text-xl font-medium text-black mt-1">Add New Team</h1>
        </div>

        {/* Game Selection - Minimal Cards */}
        <div className="w-full space-y-3 mb-8">
          <Text className="text-[9px] uppercase tracking-wider text-gray-400 font-semibold ml-1">
            Select Platform
          </Text>

          <div>
            <div className="grid grid-cols-2 gap-8 w-full max-w-lg">
              {games.map((game) => (
                <div key={game.id} className="flex flex-col items-center group">
                  {/* Image Card Container */}
                  <div
                    onClick={() => setSelectedGame(game.id)}
                    className={`relative w-full cursor-pointer transition-all duration-300 rounded-xl overflow-hidden border-2 mb-3 ${
                      selectedGame === game.id
                        ? "border-black scale-[1.02] shadow-sm"
                        : "border-gray-100 hover:border-gray-300"
                    }`}
                  >
                    <img
                      src={game.img}
                      alt={game.name}
                      className={`h-32 w-full object-cover transition-all duration-500 ${
                        selectedGame === game.id
                          ? "grayscale-0"
                          : "grayscale group-hover:grayscale-[0.5]"
                      }`}
                    />

                    {/* Selection Overlay Indicator */}
                    {selectedGame === game.id && (
                      <div className="absolute inset-0 bg-black/5 flex items-center justify-center">
                        <CheckCircleFilled className="text-black text-xl bg-white rounded-full p-0.5" />
                      </div>
                    )}
                  </div>

                  {/* Game Name Text Below Image */}
                  <span
                    className={`text-[10px] tracking-[1.5px] uppercase font-bold transition-colors ${
                      selectedGame === game.id ? "text-black" : "text-gray-400"
                    }`}
                  >
                    {game.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Team Name Input - Minimal */}
        <div className="w-full mb-8">
          <Text className="text-[9px] uppercase tracking-wider text-gray-400 font-semibold ml-1">
            Team
          </Text>   
            <AutoComplete
                value={teamName}
            className="pt-3 h-10 w-full px-0 text-xs border-b border-gray-100 rounded-none focus:border-black transition-colors placeholder:text-gray-300"            
               options={teamOptions}
                    onSelect={(value, option) => {
                        setTeamName(value);
                        setTeamId(option.key);
                        console.log("Selected Team ID:", option.key); // Access the ID here
                    }}
                    showSearch={{
    filterOption: (inputValue, option) =>
      option!.value.toUpperCase().indexOf(inputValue.toUpperCase()) !== -1
  }}
                onChange={(data) => setTeamName(data)}
                placeholder="ENTER TEAM NAME"

            />
          {/* <Input
            variant="borderless"
            placeholder="ENTER TEAM NAME"
            value={teamName}
            className="mt-1 h-10 px-0 text-xs border-b border-gray-100 rounded-none focus:border-black transition-colors placeholder:text-gray-300"
          /> */}
        </div>

        {/* Action Button */}
        <Button
          onClick={teamSubmitHandler}
          className="w-full h-11 bg-black text-white text-[10px] tracking-[2px] font-bold rounded-xl border-none hover:!bg-gray-800 hover:!text-white"
        >
          ADD TEAM
        </Button>
      </div>
    </div>
  );
};

export default AddTeam;

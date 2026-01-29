import { SendOutlined } from "@ant-design/icons";
import { Button, Flex, Input, Mentions } from "antd";
import { useState } from "react";

const ChatInput = () => {

      const [input, setInput] = useState("");
const [activeOptions, setActiveOptions] = useState<{ value: string; label: string }[]>([]);

  const handleSend = () => {
    if (!input.trim()) return;
    // setMessages([...messages, { role: "user", text: input }]);
    setInput("");
  };

const rawTeams = [
  { team_id: 101, team_name: 'Sentinels' },
  { team_id: 102, team_name: 'T1' }
];

const rawPlayers = [
  { player_id: 501, player_name: 'Aspas' },
  { player_id: 502, player_name: 'Faker' }
];

// Mapper function
const teamOptions = rawTeams.map(team => ({
  value: team.team_name, // This is what is inserted into the input
  label: team.team_name, // This is what the user sees in the dropdown
  key: team.team_id       // Optional: helps React track list items
}));

const playerOptions = rawPlayers.map(player => ({
  value: player.player_name,
  label: player.player_name,
  key: player.player_id
}));

  // Logic to switch data source based on prefix
  const handleSearch = (_: string, prefix: string) => {
    if (prefix === '#') {
      setActiveOptions(teamOptions);
    } else if (prefix === '@') {
      setActiveOptions(playerOptions);
    }
  };
    return (
  <div className="p-4 bg-white border-t border-gray-50 flex-none">
        <div className="max-w-full mx-auto">
          {/* Action Options */}
          <Flex gap={6} className="mb-3 overflow-x-auto pb-1 no-scrollbar">
            {["Quick Stats", "Recap", "Economy"].map((opt) => (
              <button
                key={opt}
                className="px-2 py-1 my-1 rounded-md border border-gray-100 text-[9px] font-bold text-gray-400 hover:border-black hover:text-black transition-all uppercase"
              >
                {opt}
              </button>
            ))}
          </Flex>

          <div className="flex bg-gray-50 shadow-xs rounded-xl border border-gray-100 p-1.5 focus-within:bg-white focus-within:border-gray-200 transition-all">
            {/* <Input.TextArea
              autoSize={{ minRows: 1, maxRows: 4 }}
              placeholder="Type message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              variant="borderless"
              className="pr-12 text-[12px] py-1 placeholder:text-gray-300"
            /> */}
            <Mentions
                autoSize={{ minRows: 1, maxRows: 4 }} 
                placeholder="Type @ for players, # for teams..."
                value={input}
                onChange={(val) => setInput(val)}
                onSearch={handleSearch} // Triggers whenever prefix is typed 
                onSelect={(option) => {
                console.log("Selected Name:", option.value);
                console.log("Selected ID:", option.key); 
            }}
                variant="borderless"
                className="pr-12 text-[12px] py-1 placeholder:text-gray-300 w-full"
                prefix={['@', '#']}
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
}

export default ChatInput;
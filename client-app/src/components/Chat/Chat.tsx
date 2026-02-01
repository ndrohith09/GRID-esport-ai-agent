import React, { useState } from "react";
import { Input, Button, Avatar, Flex, Typography } from "antd";
import {
  SendOutlined,
  UserOutlined,
  RobotOutlined,
  PaperClipOutlined,
} from "@ant-design/icons";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import ChatInput from "./InputField";
import WinMeter from "./Tools/WinMeter";
import { TOOL_TYPES } from "./Tools/type";
import TeamTeamWinMeter from "./Tools/TeamTeamWinMeter";
import PlayerWinProbabilityGauge from "./Tools/PlayerWinProbabilityGauge";
import TeamWinProbabilityGauge from "./Tools/TeamWinProbabilityGauge";

const { Text } = Typography;
const markdown = `
Here’s an overview of **Team 79’s weapon analysis** for series **2843069**:\n\n### 🔹 General Performance\n- **Team Strength Score:** 0.122  \n- **Win Probability:** ~1.1%  \n- The team shows low overall strength, mainly due to poor kill differential (-42).\n\n### 🔹 Weapon Usage Breakdown\n- **Rifle Ratio:** 57.3% (dominant weapon type)  \n- **Eco Ratio:** 16.7%  \n- **SMG Ratio:** 6.8%  \n- **Shotgun Ratio:** 2.6%  \n- **Sniper Ratio:** 1.0%  \n- **Weapon Dependency:** 0.365 (moderate reliance on specific weapons)  \n- **Weapon Entropy:** 1.963 (moderate diversity)  \n- **Weapon Benefit Score:** 0.5 (average efficiency)\n\n### 🔹 Weapon Win Impact Highlights\n- **Top-performing weapons:**  \n  - **Ares (0.67)** – highest win impact  \n  - **Shorty (0.59)**, **Outlaw (0.58)**, **Odin (0.56)**, **Marshal (0.56)** – strong performers  \n- **Underperforming weapons:**  \n  - **Melee (0.39)**, **Bucky (0.44)** – low win impact\n\n### 🔹 Key Insights\n- The team’s **least_weapon_ratio** positively influences wins, suggesting success when using less common weapons.  \n- **Kill_diff** is the major weakness, heavily reducing win probability.  \n- **Rifles** are overused but not yielding strong results; diversification toward high-impact weapons (Ares, Shorty, Outlaw) could improve outcomes.\n\n**Summary:**  \nTeam 79 relies heavily on rifles but gains better win impact from heavy and niche weapons. Improving kill efficiency and balancing weapon usage could significantly enhance performance.
Team 79’s performance in series 2843069 shows significant weaknesses and limited winning potential:\n\n- **Overall strength:** 0.122  \n- **Win probability:** ~1.1%\n\n### Key Strengths\n- **Least weapon ratio** (high impact, strongly supports winning)  \n- **Team identity factor** (moderate impact)  \n- Minor positive influences from **shotgun ratio**, **top weapon ratio**, and **assist density**.\n\n### Major Weaknesses\n- **Kill differential (-42)** is the most damaging factor, heavily reducing win chances.  \n- Minor negative effects from **rifle ratio**, **SMG ratio**, **kills**, and **weapon entropy**.\n\n### Combat & Teamplay Metrics\n- **Kills:** 197 | **Deaths:** 239 → **Kill diff:** -42  \n- **Headshot ratio:** 0.853 (strong individual accuracy)  \n- **Assist density:** 0.462 (moderate team support)  \n- **Avg player kills:** 39.4 | **Kill distribution std:** 11.29 (uneven performance across players)\n\n### Weapon Analysis\n- **Rifle ratio:** 57.3% (main weapon type)  \n- **Weapon dependency:** 0.365 | **Entropy:** 1.963 (moderate diversity)  \n- **Best performing weapons:** Ares (0.67 win impact), Shorty (0.59), Outlaw (0.58), Odin (0.56), Marshal (0.56).  \n- **Weakest:** Melee (0.39), Bucky (0.44).\n\n**Summary:**  \nTeam 79 struggles with kill efficiency and overall combat balance, despite strong headshot accuracy and some effective weapon choices. Their low win probability suggests they need to improve kill differential and weapon utilization to become competitive.
Player **10612** in series **2843069** played **3 rounds**, losing all.  \n\n### Performance Overview\n- **Win probability:** Mean 27.5%, median 5.8% — low overall success likelihood.  \n- **Consistency score:** 0.999 — highly consistent performance pattern despite poor results.  \n- **Playstyle:** *Aim-heavy*, focusing on precision engagements.\n\n### Strengths\n- **Pistol damage ratio** and **headshot damage ratio** show slight positive impact, indicating decent aim and accuracy in pistol and headshot situations.\n\n### Weaknesses\n- **Damage efficiency** is a major weakness (high negative impact), suggesting poor conversion of shots into effective damage.  \n- Minor weaknesses in **survivability (alive)** and **body/leg damage ratios**, implying low round impact and frequent early eliminations.\n\n### Economy & Weapon Profile\n- **Investment style:** Low-investment contributor (≈5% of team firepower).  \n- **Credit discipline:** Conserves credits well.  \n- **Loadout ratio:** 5.8%, **net worth ratio:** 10.9%, **money left ratio:** 41.2%.  \n- **Weapon usage:** Primarily rifles (≈74% usage, 70% damage share), minimal SMG and pistol use.\n\n### Summary\nThis player shows consistent but low-impact performance — strong aim fundamentals but poor damage efficiency and round influence. Their conservative economy approach and rifle-heavy playstyle suggest a support or low-risk role that needs more effective engagement outcomes
Team 79 has moderate overall performance indicators:  \n\n- **Team Strength Score:** 0.351  \n- **Win Probability:** 44.9% across 33 series  \n\n### Combat Metrics\n- **Kills:** 179.9 | **Deaths:** 184.1 → **Kill Diff:** -4.18 (slightly negative)  \n- **Headshot Ratio:** 82.5% (strong precision)  \n\n### Teamplay Metrics\n- **Assist Density:** 0.425 (average teamwork)  \n- **Avg Player Kills:** 35.99  \n- **Kill Distribution Std:** 7.56 (moderate variation among players)  \n\n### Weapon Usage\n- **Rifle Ratio:** 66.3% (main weapon type)  \n- **Eco Ratio:** 17.5%  \n- **Sniper Ratio:** 2.1%  \n- **SMG Ratio:** 4.2%  \n- **Shotgun Ratio:** 1.0%  \n- **Weapon Dependency:** 0.463 (moderate reliance on specific weapons)  \n- **Weapon Entropy:** 1.697 (balanced weapon diversity)  \n\n### Strengths\n- Positive **kill differential** and **sniper usage** strongly support wins.  \n- Moderate benefits from **SMG** and **top weapon ratios**.  \n\n### Weaknesses\n- Negative **kill differential** and overreliance on **rifles** and **shotguns** slightly increase loss risk.  \n- Lower **assist density** suggests weaker team coordination.  \n\n### Weapon Win Impact Highlights\nTop-performing weapons: **Ares (0.667)**, **Shorty (0.594)**, **Outlaw (0.585)**, **Marshal (0.562)**, **Odin (0.562)**.  \nUnderperforming weapons: **Melee (0.391)**, **Bucky (0.442)**.  \n\n**Summary:**  \nTeam 79 shows decent mechanical skill (high headshot ratio) but struggles with kill balance and teamwork. Their success is boosted by effective use of heavy and precision weapons, though improving coordination and rifle efficiency could raise their win probability.
`;


// TEAM_PROBABILITY
    //  "deaths_mean": 184.1673,
    //     "kill_diff_mean": -4.2366,
    //     "kills_mean": 179.9307,
    //     "kills_p05": 147.7352,
    //     "kills_p95": 212.3191,
    //     "tool_name": "TEAM_PROBABILITY",
    //     "winprob_mean": 0.5603

const ChatGUI: React.FC = () => {

  const [toolName , setToolName] =useState<TOOL_TYPES>()

  const [messages, setMessages] = useState([
    { role: "user", text: "Agent active. Chat contained within panel." },
    { role: "ai", text: "Agent active. Chat contained within panel." },
  ]);

  return (
    /* h-full and flex-col are critical here to stay inside the Splitter */
    <div className="h-full w-full bg-white flex flex-col relative overflow-hidden">
      {/* 1. Header (Fixed at top of panel) */}
      <div className="flex justify-between items-center px-6 py-3 border-b border-gray-200 flex-none bg-white z-10">
        <Text className="text-[9px] tracking-[2px] font-bold text-black uppercase">
          Valorant AI Agent
        </Text>
      </div>

      {/* 2. Scrollable Messages Area */}
      {/* 2. Scrollable Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-white">
        <div className="w-full space-y-4">
          {messages.map((msg, i) => {
            const isAI = msg.role === "ai";

            return (
              <div
                key={i}
                className={`flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300 w-full ${
                  isAI ? "flex-row" : "flex-row-reverse"
                }`}
              >
                {/* 1. Avatar - Now strictly aligned to the top of the first line */}
                <div
                  className={`flex-none h-7 w-7 mt-1 flex items-center justify-center rounded-lg ${
                    isAI ? "bg-black text-white" : "bg-gray-100 text-black"
                  }`}
                >
                  {isAI ? (
                    <RobotOutlined style={{ fontSize: "14px" }} />
                  ) : (
                    <UserOutlined style={{ fontSize: "14px" }} />
                  )}
                </div>

                {/* 2. Message Wrapper */}
                <div
                  className={`flex flex-col ${isAI ? "items-start flex-1" : "items-end max-w-[80%]"}`}
                >
                  {/* 3. The Bubble */}
                  <div
                    className={`text-sm leading-relaxed transition-all ${
                      isAI
                        ? "text-gray-800 bg-transparent py-1 w-full"
                        : "bg-gray-50 text-gray-700 py-2.5 px-4 rounded-2xl rounded-tr-none border border-gray-100"
                    }`}
                  >
                    {isAI ? (
                      <div
                        className="prose prose-xs max-w-none text-gray-800 text-sm
                prose-headings:text-black prose-headings:font-bold prose-headings:my-2
                prose-h1:text-sm prose-h1:tracking-wide prose-h1:uppercase
                prose-h2:text-xs prose-h2:tracking-wider
                prose-h3:text-xs
                prose-p:leading-relaxed prose-p:my-1
                prose-pre:bg-gray-900 prose-pre:text-white prose-pre:p-2"
                      >
                            {toolName === TOOL_TYPES.PLAYER_VS_PLAYER_PROBABILITY && <WinMeter artifacts={{
                          pA_win_mean: 0,
                          pA_win_median: 0,
                          pA_win_p10: 0,
                          pA_win_p90: 0,
                          pA_win_simulated: 0,
                          pB_win_mean: 0,
                          tool_name: TOOL_TYPES.PLAYER_VS_PLAYER_PROBABILITY
                        }}  />}


                        {/* TEAM VS TEAM Probablity */}
                        {toolName === TOOL_TYPES.TEAM_VS_TEAM_PROBABILITY && <TeamTeamWinMeter artifacts={{
                          A_kills_mean: 0,
                          A_win_prob_series_5th_percentile: 0,
                          A_win_prob_series_95th_percentile: 0,
                          A_win_prob_series_mean: 0,
                          B_kills_mean: 0,
                          B_win_prob_series_mean: 0,
                          tool_name: TOOL_TYPES.TEAM_VS_TEAM_PROBABILITY
                        }}  />}


                         {  toolName === TOOL_TYPES.PLAYER_PROBABILITY && <PlayerWinProbabilityGauge  artificats={{
                          monte_carlo : {
                              "scenario": {
                                "max": 0.013913239763782937,
                                "mean": 0.012822876677376239,
                                "median": 0.012828314625439645,
                                "min": 0.011796312586674351,
                                "p05": 0.012293703141787661,
                                "p95": 0.013351347953044301,
                                "std": 0.00032185763928617466
                            }
                                          }
                         }}/>}  

                         { toolName === TOOL_TYPES.TEAM_PROBABILITY && <TeamWinProbabilityGauge
                           artificats={{
                              "deaths_mean": 184.1673,
                              "kill_diff_mean": -4.2366,
                              "kills_mean": 179.9307,
                              "kills_p05": 147.7352,
                              "kills_p95": 212.3191,
                              "tool_name": TOOL_TYPES.TEAM_PROBABILITY,
                              "winprob_mean": 0.5603
                           }}
                         />}

                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {markdown}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      msg.text  
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Input Area (Pinned to bottom of panel, NOT screen) */}
      <ChatInput />
    </div>
  );
};

export default ChatGUI;

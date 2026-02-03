export enum TOOL_TYPES {
  GET_PLAYER_SERIES_DATA = "GET_PLAYER_SERIES_DATA",
  GET_PLAYER_ROUND_DATA = "GET_PLAYER_ROUND_DATA",
  GET_TEAM_OVERALL_DATA = "GET_TEAM_OVERALL_DATA",
  GET_TEAM_SERIES_DATA = "GET_TEAM_SERIES_DATA",
  PLAYER_PROBABILITY = "PLAYER_PROBABILITY", 
  PLAYER_VS_PLAYER_PROBABILITY = "PLAYER_VS_PLAYER_PROBABILITY", 
  TEAM_VS_TEAM_PROBABILITY = "TEAM_VS_TEAM_PROBABILITY",
  TEAM_PROBABILITY = "TEAM_PROBABILITY",
  GENERATE_SCOUTING_REPORT = "GENERATE_SCOUTING_REPORT"
};

export type ChatHistory = {
    id: number;
    message: AIMessage | string;
    type: "user" | "ai";
    user_id: string;   
} & ({
    type: "ai";
    message: string;
} | {
    type: "user";
    message: string;
})

export type AIMessage =  {
    artifacts: { [key:string] : any},
    response : string;
};
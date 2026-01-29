export type GameType = {
  team_id: string;
  team_name: string;
  game_id: string;
  user_id: number;
};

export type Round = {
  round: number;
  won: boolean;
  side : string
}

export type PlayerType = {
  player_id: string;
  player_name: string; 
};


interface Meta {
  player_id: number;
  series_id: number;
  rounds_played: number;
  rounds_won: number;
  rounds_lost: number;
}

export interface PlayerStrengthOrWeakness {
  feature: string;
  mean_shap: number;
  direction: "positive" | "negative";
  impact_level: string;
  consistency: number;
}

interface WinProbability {
  mean: number;
  median: number;
  min: number;
  max: number;
  stability: number;
}

interface EconomyProfile {
  player_loadout_ratio: number;
  player_networth_ratio: number;
  money_left_ratio: number;
}

interface EcoSummary {
  summary: string;
  labels: {
    investment_style: string;
    credit_discipline: string;
  };
}

interface WeaponProfile {
  most_common_weapon: string;
  weapon_damage_ratio: { [key: string]: number };
  weapon_usage_ratio: { [key: string]: number };
  summary: string;
}

export interface PlayerSeriesData {
  meta: Meta;
  series_strengths: PlayerStrengthOrWeakness[];
  series_weaknesses: PlayerStrengthOrWeakness[];
  win_probability: WinProbability;
  economy_profile: EconomyProfile;
  eco_summary: EcoSummary;
  weapon_profile: WeaponProfile;
  playstyle: string;
  payer_consistency_score: number;
}
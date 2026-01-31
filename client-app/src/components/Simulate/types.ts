import type { PlayerSeriesData } from "../Player/types";

export type Teams = {
  team_id: number, team_name: string
}

export type CustomOptions = {
    value: string;
    label: string;
    key: number;
}

export type TeamCompareProbability = {
    A_win_prob_series_mean : number;
    B_win_prob_series_mean : number;
    A_kills_mean : number;
    B_kills_mean : number;
    A_win_prob_series_5th_percentile : number;
    A_win_prob_series_95th_percentile : number;
}

export type PlayerCompareProbability = {
    pA_win_mean : number;
    pA_win_median : number;
    pA_win_p10 : number;
    pA_win_p90 : number;
    pA_win_simulated : number;
    pB_win_mean : number;
}

export type GetTeamOverallProbabilityMonteCarlo = {
mc : TeamOverallProbablity,
simulator_params : { [key:string] : number}
}

export type TeamOverallProbablity = {
  "deaths_mean": number,
  "kill_diff_mean": number,
  "kills_mean": number,
  "kills_p05": number,
  "kills_p95": number,
  "winprob_mean": number
}

interface MonteCarloStats {
  max: number;
  mean: number;
  median: number;
  min: number;
  p05: number;
  p95: number;
  std: number;
}

interface PlayerOverallProbabilityMonteCarlo {
  monte_carlo: {
    baseline: MonteCarloStats;
  mean_delta: number;
  median_delta: number;
  scenario: MonteCarloStats;
  }
  point_estimate: {
    baseline: number;
    delta: number;
    scenario: number;
  };
}

export type GetPlayerOverallProbabilityMonteCarlo = {
  mc: PlayerOverallProbabilityMonteCarlo
simulator_params : {
      "economy_profile.money_left_ratio": number,
    "economy_profile.player_loadout_ratio": number,
    "economy_profile.player_networth_ratio": number,
    "payer_consistency_score": number,
    "weapon_damage_ratio.ability": number,
    "weapon_damage_ratio.pistol": number,
    "weapon_damage_ratio.rifle": number,
    "weapon_damage_ratio.shotgun": number,
    "weapon_damage_ratio.smg": number,
    "weapon_usage_ratio.ability": number,
    "weapon_usage_ratio.pistol": number,
    "weapon_usage_ratio.rifle": number,
    "weapon_usage_ratio.shotgun": number,
    "weapon_usage_ratio.smg": number
}
}
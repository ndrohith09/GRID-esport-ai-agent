export interface SeriesData {
  series_id: string;
  tournament_name: string;
  format_name: string;
  start_date: string;
  won: number;
}

interface CombatMetrics {
  deaths: number;
  headshot_ratio: number;
  kill_diff: number;
  kills: number;
}

interface MetaData {
  series_count: number;
  team_id: string;
}

export interface OverallWeaponWinImpact {
  [key: string]: number; // e.g., "ares": 0.667
}

export interface TeamStrengthOrWeakness {
  direction: "positive" | "negative";
  feature: string;
  impact_level: string;
  normalized_score: number;
  shap_score: number;
  win_signal: string;
}

interface TeamplayMetrics {
  assist_density: number;
  avg_player_kills: number;
  kill_distribution_std: number;
}

export interface WeaponAnalysis {
  eco_ratio: number;
  rifle_ratio: number;
  shotgun_ratio: number;
  smg_ratio: number;
  sniper_ratio: number;
  weapon_benefit_score: number;
  weapon_dependency: number;
  weapon_entropy: number;
}

export interface TeamData {
  combat_metrics: CombatMetrics;
  meta_data: MetaData;
  overall_weapon_win_impact: OverallWeaponWinImpact;
  strengths: TeamStrengthOrWeakness[];
  team_strength_score: number;
  teamplay_metrics: TeamplayMetrics;
  weaknesses: TeamStrengthOrWeakness[];
  weapon_analysis: WeaponAnalysis;
  win_probability: number;
}
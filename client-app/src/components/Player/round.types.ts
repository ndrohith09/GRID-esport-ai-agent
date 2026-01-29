import type { PlayerStrengthOrWeakness } from "./types";

interface Meta {
  player_id: number;
  player_name: string;
  series_id: number;
  round: number;
  notes: string[];
}

interface TopAgents {
  [key: string]: number;
}

interface AgentFit {
  recommended_agent: string;
  top_agents: TopAgents;
}

interface AbilityBreakdown {
  [key: string]: {
    usage_ratio: number;
    usage_level: string;
  };
}

interface AbilityFit {
  best_ability: string;
  ability_breakdown: AbilityBreakdown;
}

interface ObjectiveBreakdown {
  objective: string;
  completion_count: number;
  completed_first: string;
  suitability_score: number;
}

interface ObjectiveFit {
  best_objective: string;
  objective_breakdown: ObjectiveBreakdown[];
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

 
interface DamageSourceBreakdown {
  source: string;
  damage: number;
  hits: number;
  damage_ratio: number;
}

interface DamageSourceAnalysis {
  most_common_source: string;
  breakdown: DamageSourceBreakdown[];
}

interface EnemyDamageSummary {
  primary_target: string;
  summary: string;
}

interface DamageTargetBreakdown {
  target: string;
  damage: number;
  hits: number;
  damage_ratio: number;
}

interface DamageTargetAnalysis {
  most_common_target: string;
  breakdown: DamageTargetBreakdown[];
}

interface WeaponSummary {
  most_common_weapon: string;
  weapon_damage_ratio: {
    [key: string]: number;
  };
  summary: string;
}

interface Playstyle {
  aim_heavy: string;
  utility_heavy: string;
  rifler: string;
}

export interface PlayerRoundData {
  meta: Meta;
  agent_fit: AgentFit;
  ability_fit: AbilityFit;
  objective_fit: ObjectiveFit;
  economy_profile: EconomyProfile;
  eco_summary: EcoSummary;
  player_strength_score: number;
  strengths: PlayerStrengthOrWeakness[];
  weaknesses: PlayerStrengthOrWeakness[];
  player_win_probability: number;
  damage_source_analysis: DamageSourceAnalysis;
  overall_damage_summary: string;
  enemy_damage_summary: EnemyDamageSummary;
  damage_target_analysis: DamageTargetAnalysis;
  weapon_summary: WeaponSummary;
  playstyle: Playstyle;
}
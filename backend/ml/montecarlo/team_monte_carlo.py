import numpy as np
import pandas as pd
import copy

class TeamMonteCarloPredictions:

    def __init__(self):
        self.IMPACT_W = {
        "high impact": 0.06,
        "moderate impact": 0.035,
        "low impact": 0.015,
        "negligible impact": 0.005
    }

    @staticmethod
    def trunc_normal(mu, sigma, n):
        x = np.random.normal(mu, sigma, n)
        return np.clip(x, 0, None)

    @staticmethod
    def beta_from_mean(mean, strength):
    # mean in (0,1)
        mean = np.clip(mean, 1e-6, 1-1e-6)
        a = mean * strength
        b = (1-mean) * strength
        return a, b
    
    @staticmethod
    def combine_probs(pA, pB): 
        eps = 1e-6
        logitA = np.log((pA+eps)/(1-pA+eps))
        logitB = np.log((pB+eps)/(1-pB+eps))
        p = 1/(1 + np.exp(-(logitA - logitB)))
        return p

    @staticmethod
    def summarize_sim(sim_df):
        return {
            "kills_mean": float(np.round(sim_df["kills"].mean(), 4)),
            "kills_p05": float(np.round(sim_df["kills"].quantile(0.05), 4)),
            "kills_p95": float(np.round(sim_df["kills"].quantile(0.95), 4)),
            "deaths_mean": float(np.round(sim_df["deaths"].mean(), 4)),
            "kill_diff_mean": float(np.round(sim_df["kill_diff"].mean(), 4)),
            "winprob_mean": float(np.round(sim_df["win_probability"].mean(), 4)),
        }
    
    @staticmethod
    def logit(p):
        p = np.clip(p, 1e-6, 1-1e-6)
        return np.log(p/(1-p))

    @staticmethod
    def sigmoid(x):
        return 1/(1+np.exp(-x))

    '''
    Generate “what-if” scenarios with Monte Carlo
    '''
    @staticmethod
    def apply_scenario(team_json, scenario):
        # scenario = dict of adjustments
        # example: {"combat_metrics.kills": +10, "win_probability": +0.03}
        out = copy.deepcopy(team_json)

        for k, delta in scenario.items():
            keys = k.split(".")
            ref = out
            for kk in keys[:-1]:
                ref = ref[kk]
            ref[keys[-1]] = ref[keys[-1]] + delta

        # clip probabilities
        out["win_probability"] = float(np.clip(out["win_probability"], 0.01, 0.99))
        out["combat_metrics"]["headshot_ratio"] = float(np.clip(out["combat_metrics"]["headshot_ratio"], 0.01, 0.99))
        return out
    
    def mc_team_sim(self, team_json, n=50000, seed=42):
        np.random.seed(seed)

        series_count = team_json["meta_data"]["series_count"]
        combat = team_json["combat_metrics"]
        teamplay = team_json["teamplay_metrics"]

        # --- Means ---
        mu_k = combat["kills"]
        mu_d = combat["deaths"]
        mu_hs = combat["headshot_ratio"]
        mu_win = team_json["win_probability"]

        # --- Uncertainty (heuristics) ---
        # more series -> lower sigma
        base_sigma_k = 18
        base_sigma_d = 18
        scale = np.sqrt(35 / max(series_count, 5))  # 35 is a reference
        
        sigma_k = base_sigma_k * scale + 0.15 * teamplay["kill_distribution_std"]
        sigma_d = base_sigma_d * scale + 0.15 * teamplay["kill_distribution_std"]

        # --- Sample distributions ---
        kills = self.trunc_normal(mu_k, sigma_k, n)
        deaths = self.trunc_normal(mu_d, sigma_d, n)

        # headshot ratio beta
        a_hs, b_hs = self.beta_from_mean(mu_hs, strength=80)  # 80 = confidence
        hs = np.random.beta(a_hs, b_hs, n)

        # win prob beta (confidence depends on series_count)
        a_w, b_w = self.beta_from_mean(mu_win, strength=20 + series_count)
        win_prob = np.random.beta(a_w, b_w, n)

        kill_diff = kills - deaths

        return pd.DataFrame({
            "kills": kills,
            "deaths": deaths,
            "kill_diff": kill_diff,
            "headshot_ratio": hs,
            "win_probability": win_prob
        })

    '''
    Function to simulate matches between two teams
    '''
    def simulate_match(self, teamA_json, teamB_json, n=50000):
        A = self.mc_team_sim(teamA_json, n=n, seed=1)
        B = self.mc_team_sim(teamB_json, n=n, seed=2)

        pA = self.combine_probs(A["win_probability"].values, B["win_probability"].values)

        # series win prob from per-map p
        series_prob_A = pA*pA*(3 - 2*pA)

        return pd.DataFrame({
            "A_win_prob_map": pA,
            "A_win_prob_series": series_prob_A,
            "A_kills": A["kills"].values,
            "B_kills": B["kills"].values,
            "A_deaths": A["deaths"].values,
            "B_deaths": B["deaths"].values,
        })

    @staticmethod
    def summarize_match_sim(match_sim):
        return {
            "A_win_prob_series_mean": float(np.round(match_sim["A_win_prob_series"].mean() , 4)),
            "A_kills_mean": float(np.round(match_sim["A_kills"].mean(), 4)),
            "B_kills_mean": float(np.round(match_sim["B_kills"].mean(), 4)),
            "A_win_prob_series_5th_percentile": float(np.round(match_sim["A_win_prob_series"].quantile(0.05), 4)),
            "A_win_prob_series_95th_percentile": float(np.round(match_sim["A_win_prob_series"].quantile(0.95), 4)),
        }

    '''
    Build a “surrogate win probability model”
    '''
    @staticmethod
    def weapon_component(team_json):
        impact = team_json["overall_weapon_win_impact"]
        wa = team_json["weapon_analysis"]

        # group weapons by class
        rifle_weapons  = ["vandal", "phantom", "guardian", "bulldog"]
        smg_weapons    = ["spectre", "stinger"]
        sniper_weapons = ["operator", "marshal", "outlaw"]
        shotgun_weapons= ["bucky", "judge", "shorty"]
        eco_weapons    = ["classic", "ghost", "frenzy", "sheriff"]

        def avg_impact(ws):
            vals = [impact[w] for w in ws if w in impact]
            return float(np.mean(vals)) if vals else 0.5

        rifle_adv   = (avg_impact(rifle_weapons)   - 0.5) * wa["rifle_ratio"]
        smg_adv     = (avg_impact(smg_weapons)     - 0.5) * wa["smg_ratio"]
        sniper_adv  = (avg_impact(sniper_weapons)  - 0.5) * wa["sniper_ratio"]
        shotgun_adv = (avg_impact(shotgun_weapons) - 0.5) * wa["shotgun_ratio"]
        eco_adv     = (avg_impact(eco_weapons)     - 0.5) * wa["eco_ratio"]

        # dependency/entropy are risk factors (high dependency -> easier to counter)
        dep_penalty = (wa["weapon_dependency"] - 0.45) * 0.10   # tuned weight
        ent_bonus   = (wa["weapon_entropy"] - 1.5) * 0.05       # variety bonus

        return (rifle_adv + smg_adv + sniper_adv + shotgun_adv + eco_adv) - dep_penalty + ent_bonus

    def sw_component(self, team_json):
        s = 0.0
        for item in team_json.get("strengths", []):
            w = self.IMPACT_W.get(item["impact_level"], 0.01)
            s += w * float(item["normalized_score"])

        for item in team_json.get("weaknesses", []):
            w = self.IMPACT_W.get(item["impact_level"], 0.01)
            s -= w * float(item["normalized_score"])

        return s

    def surrogate_strength(self, team_json):
        base = float(team_json.get("team_strength_score", 0.0)) * 0.10  # scale it down
        return base + self.weapon_component(team_json) + self.sw_component(team_json)


    def adjusted_win_probability(self, team_json, scale=6.0):
        """
        scale controls how much feature deltas move probability.
        6.0 is a good starting point.
        """
        p0 = float(team_json["win_probability"])
        s = self.surrogate_strength(team_json)

        # Add strength on logit scale
        return float(self.sigmoid(self.logit(p0) + scale*s))
    
    '''
    A) Modify weapon impact
    '''
    def set_weapon_impact(self, team_json, weapon, new_value):
        out = copy.deepcopy(team_json)
        out["overall_weapon_win_impact"][weapon] = float(new_value)
        out["win_probability"] = self.adjusted_win_probability(out)  # recompute
        return out

    '''
    B) Modify weapon ratios
    '''
    def add_weapon_ratio(self, team_json, key, delta):
        out = copy.deepcopy(team_json)
        out["weapon_analysis"][key] = float(np.clip(out["weapon_analysis"][key] + delta, 0, 1))
        out["win_probability"] = self.adjusted_win_probability(out)
        return out
    '''
    C) Modify strengths/weaknesses normalized_score
    '''
    def update_sw_score(self, team_json, kind, feature, new_score):
        out = copy.deepcopy(team_json)
        arr = out[kind]  # "strengths" or "weaknesses"
        for item in arr:
            if item["feature"] == feature:
                item["normalized_score"] = float(new_score)
                break
        out["win_probability"] = self.adjusted_win_probability(out)
        return out

    @staticmethod
    def set_nested(d, path, value):
        keys = path.split(".")
        ref = d
        for k in keys[:-1]:
            ref = ref[k]
        ref[keys[-1]] = value

    def update_team_json(self, team_json, updates: dict):
        """
        updates example:
        {
        "overall_weapon_win_impact.phantom": 0.55,
        "weapon_analysis.rifle_ratio": 0.71,
        "weapon_analysis.weapon_dependency": 0.40
        }
        """
        out = copy.deepcopy(team_json)
        for path, val in updates.items():
            self.set_nested(out, path, val)

        # recompute win prob using your surrogate model
        out["win_probability"] = self.adjusted_win_probability(out)
        return out

    def simulate_team_win_probability(self, team_json):

        # TODO: fetch key values and pass here
        scenario_json = self.update_team_json(team_json, {
            "combat_metrics.kills" : 210,
            "combat_metrics.deaths" : 200,
            "overall_weapon_win_impact.phantom": 0.55,
            "weapon_analysis.rifle_ratio": team_json["weapon_analysis"]["rifle_ratio"] + 0.05,
            "weapon_analysis.weapon_dependency": 0.40,
        })
        baseline_p = self.adjusted_win_probability(team_json)
        scenario_p = self.adjusted_win_probability(scenario_json)

        sim_base = self.mc_team_sim(team_json, n=50000)
        sim_scn  = self.mc_team_sim(scenario_json, n=50000)

        return self.summarize_sim(sim_scn)





'''
Examples

1. Simulate team win prob

match_sim = simulate_match(team_json, teamB_json, n=100000)
summarize_match_sim(match_sim)

# output 

{'A_win_prob_series_mean': 0.6369,
 'B_win_prob_series_mean': 0.3631,
 'A_kills_mean': 203.1302,
 'A_deaths_mean': 191.471,
 'B_kills_mean': 179.8747,
 'B_deaths_mean': 184.17,
 'A_win_prob_series_5th_percentile': 0.4104,
 'A_win_prob_series_95th_percentile': 0.8327}
 
2. Simulate Team Win probability

scenario_json = update_team_json(team_json, {
    "combat_metrics.kills" : 210,
    "combat_metrics.deaths" : 200,
    "overall_weapon_win_impact.phantom": 0.55,
    "weapon_analysis.rifle_ratio": team_json["weapon_analysis"]["rifle_ratio"] + 0.05,
    "weapon_analysis.weapon_dependency": 0.40,
})

baseline_p = adjusted_win_probability(team_json)
scenario_p  = adjusted_win_probability(scenario_json)

scenario_json = update_sw_score(scenario_json, "weaknesses", "kill_diff", 0.7)

print(baseline_p, scenario_p, scenario_p - baseline_p)

sim_base = mc_team_sim(team_json, n=50000)
sim_scn  = mc_team_sim(scenario_json, n=50000)
    
summarize_sim(sim_base), summarize_sim(sim_scn)

#output
 {'kills_mean': np.float64(209.99188951586262),
  'kills_p05': np.float64(178.45456196369926),
  'kills_p95': np.float64(241.71813260534813),
  'deaths_mean': np.float64(200.0453725187346),
  'kill_diff_mean': np.float64(9.946516997128011),
  'winprob_mean': np.float64(0.7348674511251672)}

'''
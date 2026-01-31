import numpy as np
import pandas as pd
import math
import copy

class PlayerMonteCarloPredictions:

    def __init__(self):
        pass

    @staticmethod
    def sigmoid(x):
        return 1 / (1 + math.exp(-x))

    @staticmethod
    def logit(p, eps=1e-9):
        p = min(max(p, eps), 1 - eps)
        return math.log(p / (1 - p))

    @staticmethod
    def clamp(x, lo=0.0, hi=1.0):
        return max(lo, min(hi, x))

    @staticmethod
    def _sum_shap(items):
        """Sum mean_shap from strengths/weaknesses arrays."""
        if not items:
            return 0.0
        return float(sum(x.get("mean_shap", 0.0) for x in items))

    @staticmethod
    def _weapon_ratio(player_json, group, weapon):
        """
        group: 'weapon_usage_ratio' or 'weapon_damage_ratio'
        """
        return float(
            player_json.get("weapon_profile", {})
                    .get(group, {})
                    .get(weapon, 0.0)
        )

    @staticmethod
    def _economy(player_json, key):
        return float(player_json.get("economy_profile", {}).get(key, 0.0))


    @staticmethod
    def set_weapon_usage_ratio(player_json, weapon, value):
        out = copy.deepcopy(player_json)
        out.setdefault("weapon_profile", {}).setdefault("weapon_usage_ratio", {})[weapon] = float(value)
        return out

    @staticmethod
    def set_economy_ratio(player_json, key, value):
        out = copy.deepcopy(player_json)
        out.setdefault("economy_profile", {})[key] = float(value)
        return out

    @staticmethod
    def set_consistency(player_json, value):
        out = copy.deepcopy(player_json)
        out["payer_consistency_score"] = float(value)
        return out

    @staticmethod
    def set_strength_shap(player_json, feature, mean_shap):
        """
        Update existing feature in series_strengths, else append.
        """
        out = copy.deepcopy(player_json)
        strengths = out.setdefault("series_strengths", [])
        for item in strengths:
            if item.get("feature") == feature:
                item["mean_shap"] = float(mean_shap)
                return out
        strengths.append({"feature": feature, "mean_shap": float(mean_shap), "direction": "positive"})
        return out

    @staticmethod
    def set_weakness_shap(player_json, feature, mean_shap):
        out = copy.deepcopy(player_json)
        weaknesses = out.setdefault("series_weaknesses", [])
        for item in weaknesses:
            if item.get("feature") == feature:
                item["mean_shap"] = float(mean_shap)
                return out
        weaknesses.append({"feature": feature, "mean_shap": float(mean_shap), "direction": "negative"})
        return out

    @staticmethod
    def sigmoid(x):
        return 1 / (1 + math.exp(-x))

    '''
    Surrogate Probabilty Model
    '''
    def adjusted_win_probability_player(self, player_json):
        """
        Returns adjusted win probability for a player_json.
        Uses win_probability.mean as baseline and adjusts it with heuristic signals.
        """
        wp = player_json.get("win_probability", {})
        base_mean = float(wp.get("mean", 0.5))

        # Work in logit space (better additive behavior)
        z = self.logit(base_mean)

        # ---- strengths & weaknesses ----
        strengths = player_json.get("series_strengths", [])
        weaknesses = player_json.get("series_weaknesses", [])

        shap_strength = self._sum_shap(strengths)
        shap_weak = self._sum_shap(weaknesses)  # likely negative already

        # give SHAP totals moderate influence
        z += 0.60 * shap_strength
        z += 0.80 * shap_weak

        # ---- stability / consistency ----
        stability = float(wp.get("stability", 0.5))  # 0..1
        # higher stability => more confidence => slightly higher effective p
        z += 0.25 * (stability - 0.5)

        consistency = float(player_json.get("payer_consistency_score", 0.5))
        z += 0.40 * (consistency - 0.5)

        # ---- economy profile ----
        # player_loadout_ratio + networth_ratio high => stronger contributor
        loadout = self._economy(player_json, "player_loadout_ratio")
        networth = self._economy(player_json, "player_networth_ratio")
        money_left = self._economy(player_json, "money_left_ratio")

        z += 0.90 * (loadout - 0.20)
        z += 0.70 * (networth - 0.20)

        # too much money left could mean under-investing (context dependent)
        z -= 0.35 * (money_left - 0.35)

        # ---- weapon profile ----
        # reward rifle/ability usage, penalize over-sniper dependence slightly
        rifle_use = self._weapon_ratio(player_json, "weapon_usage_ratio", "rifle")
        ability_use = self._weapon_ratio(player_json, "weapon_usage_ratio", "ability")
        sniper_use = self._weapon_ratio(player_json, "weapon_usage_ratio", "sniper")

        z += 0.55 * (rifle_use - 0.45)
        z += 0.25 * (ability_use - 0.20)
        z -= 0.25 * (sniper_use - 0.12)

        # ---- playstyle categorical ----
        playstyle = player_json.get("playstyle", "unknown")
        playstyle_bias = {
            "aim_heavy": 0.08,
            "utility_heavy": 0.05,
            "support": 0.03,
            "unknown": 0.0
        }.get(playstyle, 0.0)
        z += playstyle_bias

        p = self.sigmoid(z)
        return self.clamp(p)

    def add_weapon_usage_ratio(self, player_json, weapon, delta):
        out = copy.deepcopy(player_json)
        cur = self._weapon_ratio(out, "weapon_usage_ratio", weapon)
        out.setdefault("weapon_profile", {}).setdefault("weapon_usage_ratio", {})[weapon] = float(cur + delta)
        return out

    @staticmethod
    def update_player_json(player_json, updates: dict):
        """
        Supported update keys:

        Weapon ratios:
        weapon_usage_ratio.<weapon>              (shorthand)
        weapon_damage_ratio.<weapon>             (shorthand)
        weapon_profile.weapon_usage_ratio.<weapon>
        weapon_profile.weapon_damage_ratio.<weapon>

        Economy:
        economy_profile.<key>

        Consistency:
        payer_consistency_score

        Strength/weakness shap:
        strength.<feature>
        weakness.<feature>

        Other:
        playstyle
        """
        out = copy.deepcopy(player_json)

        for k, v in updates.items():

            # --- weapon usage ratio ---
            if k.startswith("weapon_usage_ratio."):
                weapon = k.split(".", 1)[1]
                out.setdefault("weapon_profile", {}).setdefault("weapon_usage_ratio", {})[weapon] = float(v)

            elif k.startswith("weapon_profile.weapon_usage_ratio."):
                weapon = k.split(".", 2)[2]
                out.setdefault("weapon_profile", {}).setdefault("weapon_usage_ratio", {})[weapon] = float(v)

            # --- weapon damage ratio ---
            elif k.startswith("weapon_damage_ratio."):
                weapon = k.split(".", 1)[1]
                out.setdefault("weapon_profile", {}).setdefault("weapon_damage_ratio", {})[weapon] = float(v)

            elif k.startswith("weapon_profile.weapon_damage_ratio."):
                weapon = k.split(".", 2)[2]
                out.setdefault("weapon_profile", {}).setdefault("weapon_damage_ratio", {})[weapon] = float(v)

            # --- economy ---
            elif k.startswith("economy_profile."):
                key = k.split(".", 1)[1]
                out.setdefault("economy_profile", {})[key] = float(v)

            # --- consistency ---
            elif k == "payer_consistency_score":
                out["payer_consistency_score"] = float(v)

            # --- playstyle ---
            elif k == "playstyle":
                out["playstyle"] = v

            # --- strengths/weaknesses ---
            elif k.startswith("strength."):
                feat = k.split(".", 1)[1]
                strengths = out.setdefault("series_strengths", [])
                found = False
                for item in strengths:
                    if item.get("feature") == feat:
                        item["mean_shap"] = float(v)
                        found = True
                        break
                if not found:
                    strengths.append({"feature": feat, "mean_shap": float(v), "direction": "positive"})

            elif k.startswith("weakness."):
                feat = k.split(".", 1)[1]
                weaknesses = out.setdefault("series_weaknesses", [])
                found = False
                for item in weaknesses:
                    if item.get("feature") == feat:
                        item["mean_shap"] = float(v)
                        found = True
                        break
                if not found:
                    weaknesses.append({"feature": feat, "mean_shap": float(v), "direction": "negative"})

            else:
                raise KeyError(f"Unknown update key: {k}")

        return out

    '''
    Monte Carlo what-if
    '''
    def monte_carlo_player(self,player_json, n=1000, seed=42):
        rng = np.random.default_rng(seed)
        probs = []

        for _ in range(n):
            sim = copy.deepcopy(player_json)

            # sample changes
            rifle = self._weapon_ratio(sim, "weapon_usage_ratio", "rifle")
            networth = self._economy(sim, "player_networth_ratio")
            consistency = float(sim.get("payer_consistency_score", 0.5))

            # random shocks (tune stddevs)
            rifle2 = self.clamp(rifle + rng.normal(0, 0.03), 0, 1)
            networth2 = self.clamp(networth + rng.normal(0, 0.02), 0, 1)
            consistency2 = self.clamp(consistency + rng.normal(0, 0.05), 0, 1)

            sim = self.set_weapon_usage_ratio(sim, "rifle", rifle2)
            sim = self.set_economy_ratio(sim, "player_networth_ratio", networth2)
            sim = self.set_consistency(sim, consistency2)

            probs.append(self.adjusted_win_probability_player(sim))

        probs = np.array(probs)
        return {
            "mean": float(probs.mean()),
            "p05": float(np.quantile(probs, 0.05)),
            "median": float(np.quantile(probs, 0.50)),
            "p95": float(np.quantile(probs, 0.95)),
            "min": float(probs.min()),
            "max": float(probs.max()),
            "std": float(probs.std()),
        }

    '''
    Player vs Player Win Probability Function
    '''
    def player_vs_player_winprob(self,playerA_json, playerB_json, temperature=1.0):
        """
        Returns win probability for A vs B.
        temperature > 1 => softer probabilities (less confident)
        temperature < 1 => sharper probabilities (more confident)
        """
        pA = self.adjusted_win_probability_player(playerA_json)
        pB = self.adjusted_win_probability_player(playerB_json)

        # convert to strength in logit space
        eps = 1e-9
        pA = min(max(pA, eps), 1-eps)
        pB = min(max(pB, eps), 1-eps)

        sA = math.log(pA / (1 - pA))
        sB = math.log(pB / (1 - pB))

        # relative probability
        pA_win = self.sigmoid((sA - sB) / temperature)
        pB_win = 1 - pA_win

        return {
            "pA_win": float(pA_win),
            "pB_win": float(pB_win),
            "pA_strength": float(pA),
            "pB_strength": float(pB),
        }  

    '''
    Main Function: Monte Carlo player vs player win prob
    '''
    def monte_carlo_player_vs_player(self, playerA_json, playerB_json, n=1000, seed=42, temperature=1.0):
        rng = np.random.default_rng(seed)

        winsA = 0
        probs = []

        for _ in range(n):
            # sample noisy versions of A and B
            A_sim = copy.deepcopy(playerA_json)
            B_sim = copy.deepcopy(playerB_json)

            # --- noise for A ---
            A_sim = self.set_consistency(A_sim, np.clip(A_sim.get("payer_consistency_score", 0.5) + rng.normal(0, 0.05), 0, 1))
            A_sim = self.set_weapon_usage_ratio(A_sim, "rifle",
                                        np.clip(A_sim.get("weapon_profile", {}).get("weapon_usage_ratio", {}).get("rifle", 0.45)
                                                + rng.normal(0, 0.03), 0, 1))

            # --- noise for B ---
            B_sim = self.set_consistency(B_sim, np.clip(B_sim.get("payer_consistency_score", 0.5) + rng.normal(0, 0.05), 0, 1))
            B_sim = self.set_weapon_usage_ratio(B_sim, "rifle",
                                        np.clip(B_sim.get("weapon_profile", {}).get("weapon_usage_ratio", {}).get("rifle", 0.45)
                                                + rng.normal(0, 0.03), 0, 1))

            # deterministic p(A wins) for this simulation
            out = self.player_vs_player_winprob(A_sim, B_sim, temperature=temperature)
            pA_win = out["pA_win"]
            probs.append(pA_win)

            # sample actual win
            if rng.random() < pA_win:
                winsA += 1

        probs = np.array(probs)
        return {
            "pA_win_mean": float(probs.mean()),
            "pA_win_median": float(np.quantile(probs, 0.5)),
            "pA_win_p10": float(np.quantile(probs, 0.10)),
            "pA_win_p90": float(np.quantile(probs, 0.90)),
            "pA_win_simulated": float(winsA / n),
            "pB_win_mean": float(1 - probs.mean()),
        }

    '''
    Main prediction function
    '''
    def monte_carlo_player_win_probability(self, playerA_json, updates, n_mc=1000, seed=42):
        """
        Calculate the delta in win probability for a given player scenario.

        Args:
        - playerA_json (dict): The base player JSON.
        - updates (dict): Updates to apply to the player JSON.
        - n_mc (int, optional): Number of Monte Carlo simulations. Defaults to 1000.
        - seed (int, optional): Random seed for reproducibility. Defaults to 42.

        Returns:
        - dict: Dictionary containing point estimate and Monte Carlo results.
        """

        # Single point estimate
        baseline_p = self.adjusted_win_probability_player(playerA_json)
        scenario_json = self.update_player_json(playerA_json, updates)
        scenario_p = self.adjusted_win_probability_player(scenario_json)

        # Monte Carlo distribution estimate
        np.random.seed(seed)
        baseline_mc = self.monte_carlo_player(playerA_json, n=n_mc)
        scenario_mc = self.monte_carlo_player(scenario_json, n=n_mc)

        return {
            "point_estimate": {
                "baseline": baseline_p,
                "scenario": scenario_p,
                "delta": scenario_p - baseline_p,
            },
            "monte_carlo": {
                "baseline": baseline_mc,
                "scenario": scenario_mc,
                "mean_delta": scenario_mc["mean"] - baseline_mc["mean"],
                "median_delta": scenario_mc["median"] - baseline_mc["median"],
            },
        }


'''
# Example 1
updates = {
    "weapon_usage_ratio.rifle": 0.62,
    "economy_profile.player_networth_ratio": 0.23,
    "payer_consistency_score": 0.78,
}

result = monte_carlo_player_win_probability(playerA_json, updates)
print("Point Estimate:")
print("Baseline:", result["point_estimate"]["baseline"])
print("Scenario:", result["point_estimate"]["scenario"])
print("Delta:", result["point_estimate"]["delta"])

print("\nMonte Carlo:")
print("Baseline Mean:", result["monte_carlo"]["baseline"]["mean"])
print("Scenario Mean:", result["monte_carlo"]["scenario"]["mean"])
print("Mean Delta:", result["monte_carlo"]["mean_delta"])
print("Median Delta:", result["monte_carlo"]["median_delta"])

Example 2:
mc = monte_carlo_player_vs_player(playerA_json, playerB_json, n=20000)
'''
from collections import Counter, defaultdict
from database.db import get_db, close_db
import pandas as pd
import json, shap, heapq
import numpy as np
from xgboost import XGBClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score
from .constants import RIFLES, SMGS, SHOTGUNS, SNIPERS,PISTOLS,ABILITIES, ECONOMY_BUCKETS,AGENT_PROFILES

class PlayerPredictions:

    def __init__(self):
        self.player_table = self.load_team_table()
        self.player_data_json = self.player_table.to_dict(orient="records") 
        self.X, self.meta = self.build_players_ml_dataset(self.player_data_json)
        self.model= XGBClassifier(
            n_estimators=300,
            max_depth=4,
            learning_rate=0.05,
            subsample=0.9,
            colsample_bytree=0.9,
            eval_metric="logloss",
            random_state=42
        )
        self.train_strength_model()
        # model call only after train for shap
        self.explainer = shap.TreeExplainer(self.model)
        self.win_model= XGBClassifier(
            n_estimators=300,
            max_depth=4,
            learning_rate=0.05,
            subsample=0.9,
            colsample_bytree=0.9,
            eval_metric="logloss",
            random_state=42
        )
        self.train_win_model()



    def load_team_table(self) -> pd.DataFrame:
        conn = get_db()
        query = "SELECT * FROM 'all-players'"
        all_players_df = pd.read_sql_query(query, conn)

        all_players_df['damageDealtTargets'] = all_players_df['damageDealtTargets'].apply(json.loads)
        all_players_df['damageDealtSources'] = all_players_df['damageDealtSources'].apply(json.loads)
        all_players_df['abilities'] = all_players_df['abilities'].apply(json.loads)
        all_players_df['objectives'] = all_players_df['objectives'].apply(json.loads)
        all_players_df['player_id'] = all_players_df['player_id'].astype(int)
        all_players_df['team_id'] = all_players_df['team_id'].astype(int)
        return all_players_df

    @staticmethod
    def extract_player_features(player_json):
        features = {}
        # -------------------------
        # Damage breakdown
        # -------------------------
        total_damage = player_json.get("damageDealt", 0)
        total_taken = player_json.get("damageTaken", 0)
        
        dmg_by_target = {d["target"]: d["damageAmount"] 
                        for d in player_json.get("damageDealtTargets", [])}

        features["headshot_damage_ratio"] = dmg_by_target.get("head", 0) / max(total_damage, 1)
        features["body_damage_ratio"] = dmg_by_target.get("body", 0) / max(total_damage, 1)
        features["leg_damage_ratio"] = dmg_by_target.get("leg", 0) / max(total_damage, 1)

        features["damage_efficiency"] = total_damage / max(total_taken, 1)
        features["self_damage_ratio"] = player_json.get("selfdamageDealt", 0) / max(total_damage, 1)

        # -------------------------
        # Weapon damage categories
        # -------------------------
        weapon_damage = {}
        for d in player_json.get("damageDealtSources", []):
            weapon_damage[d["target"]] = weapon_damage.get(d["target"], 0) + d["damageAmount"]

        rifle_weapons = {"vandal", "phantom", "guardian"}
        pistol_weapons = {"ghost", "sheriff", "frenzy", "classic"}
        shotgun_weapons = {"judge", "shorty"}
        ability_sources = {"paint-shells", "showstopper"}

        def ratio(weapons):
            return sum(weapon_damage.get(w, 0) for w in weapons) / max(total_damage, 1)

        features["rifle_damage_ratio"] = ratio(rifle_weapons)
        features["pistol_damage_ratio"] = ratio(pistol_weapons)
        features["shotgun_damage_ratio"] = ratio(shotgun_weapons)
        features["ability_damage_ratio"] = ratio(ability_sources)

        # -------------------------
        # Utility & survival
        # -------------------------
        features["ultimate_points"] = player_json.get("ultimatePoints", 0)
        features["alive"] = player_json.get("alive", 0)
        return features

    @staticmethod
    def get_scouting_notes(player):
        notes = [] 
        if player.get('damageTaken', 0) > player.get('damageDealt', 0):
            notes.append("High-risk duelist: Takes massive damage during encounters.")
        elif player.get('damageDealt', 0) > (player.get('damageTaken', 0) * 1.5):
            notes.append("Efficient Hunter: Deals significantly more damage than he receives.")

        # Logic: Utility Handling
        if player.get('selfdamageTaken', 0) > 50:
            notes.append("Safety Concern: High self-damage recorded; check ability usage (Raze satchels/nades).")
    
        targets = player.get('damageDealtTargets', [])
        head_hits = sum(t['occurrenceCount'] for t in targets if t['target'] == 'head')
        total_hits = sum(t['occurrenceCount'] for t in targets)
        
        if total_hits > 0 and (head_hits / total_hits) > 0.25:
            notes.append("Sharp Shooter: High headshot frequency detected.")

        return notes


    @staticmethod
    def to_python_type(value):
        if isinstance(value, (np.integer,)):
            return int(value)
        if isinstance(value, (np.floating,)):
            return float(value)
        if isinstance(value, (np.bool_,)):
            return bool(value)
        return value


    @staticmethod
    def player_strength_score(model, X_row):
        proba = model.predict_proba(X_row)[0][1]
        return float(np.round(proba, 3))
    
    @staticmethod
    def player_win_probability(model, player_df):
        return float(np.round(model.predict_proba(player_df)[0][1],4))

    @staticmethod
    def analyze_damage_targets(player_json):
        targets = player_json.get("damageDealtTargets", [])
        total_damage = player_json.get("damageDealt", 0)

        if not targets or total_damage == 0:
            return {}

        summary = []
        for t in targets:
            summary.append({
                "target": t["target"],
                "damage": t["damageAmount"],
                "hits": t["occurrenceCount"],
                "damage_ratio": np.round(t["damageAmount"] / total_damage, 3)
            })

        summary = sorted(summary, key=lambda x: x["damage"], reverse=True)

        return {
            "most_common_target": summary[0]["target"],
            "breakdown": summary
        }

    @staticmethod
    def analyze_damage_sources(player_json):
        sources = player_json.get("damageDealtSources", [])
        total_damage = player_json.get("damageDealt", 0)

        if not sources or total_damage == 0:
            return {}

        summary = []
        for s in sources:
            summary.append({
                "source": s["target"],
                "damage": s["damageAmount"],
                "hits": s["occurrenceCount"],
                "damage_ratio": np.round(s["damageAmount"] / total_damage, 3)
            })

        summary = sorted(summary, key=lambda x: x["damage"], reverse=True)

        return {
            "most_common_source": summary[0]["source"],
            "breakdown": summary
        }

    @staticmethod
    def bucketize(value, buckets):
        for label, (low, high) in buckets.items():
            if low <= value < high:
                return label
        return "unknown"

    @staticmethod
    def extract_economy_features(player_json):
        return {
            "player_loadout_ratio": float(np.round(player_json["loadoutValue"] / max(player_json["team_loadoutValue"], 1),3)),
            "player_networth_ratio": float(np.round(player_json["netWorth"] / max(player_json["team_netWorth"], 1),3)),
            "money_left_ratio": float(np.round(player_json["money"] / max(player_json["netWorth"], 1),3))
        }

    @staticmethod
    def analyze_ability_suitability(player_json):
        ability_usage = {a["abilityName"]: a["charges"] for a in player_json.get("abilities", [])}

        total_ability_charges = sum(ability_usage.values()) or 1

        ability_scores = {}

        for ability, charges in ability_usage.items():
            ability_scores[ability] = {
                "usage_ratio": np.round(charges / total_ability_charges, 3),
                "usage_level": (
                    "high" if charges >= 2 else
                    "moderate" if charges == 1 else
                    "low"
                )
            }

        best_ability = max(
            ability_scores.items(),
            key=lambda x: x[1]["usage_ratio"]
        )[0]

        return {
            "best_ability": best_ability,
            "ability_breakdown": ability_scores
        }

    @staticmethod
    def analyze_objective_suitability(player_json):
        objectives = player_json.get("objectives", [])

        scores = []

        for obj in objectives:
            score = (
                obj.get("completionCount", 0) +
                (2 if obj.get("completedFirst", False) else 0)
            )

            scores.append({
                "objective": obj["type"],
                "completion_count": obj.get("completionCount", 0),
                "completed_first": obj.get("completedFirst", False),
                "suitability_score": score
            })

        scores = sorted(scores, key=lambda x: x["suitability_score"], reverse=True)

        return {
            "best_objective": scores[0]["objective"] if scores else None,
            "objective_breakdown": scores
        }

    @staticmethod
    def economy_narrative(econ):
        loadout = econ["player_loadout_ratio"]
        networth = econ["player_networth_ratio"]
        money_left = econ["money_left_ratio"]

        if loadout < 0.18:
            role = "low-investment contributor"
        elif loadout < 0.26:
            role = "economy-balanced contributor"
        else:
            role = "economy-heavy carry"

        spending = (
            "conserves credits well"
            if money_left > 0.25 else
            "spends most of their credits each round"
        )

        return {
            "summary": (
                f"Player is an {role}, contributing "
                f"{int(loadout * 100)}% of team firepower. "
                f"They {spending}."
            ),
            "labels": {
                "investment_style": role,
                "credit_discipline": spending
            }
        }

    def build_players_ml_dataset(self, player_records):
        feature_rows = []
        meta_rows = [] 
        for p in player_records:
            features = self.extract_player_features(p)
            feature_rows.append(features) 
            player_specific_notes = self.get_scouting_notes(p)

            meta_rows.append({
                "player_id": p["player_id"],
                "player_name": p["player_name"],
                "series_id": p["series_id"],
                "round": p.get("round"),
                "won": False if p.get("won") == 0 else True,
                "notes" : player_specific_notes
            })

        X = pd.DataFrame(feature_rows)
        meta = pd.DataFrame(meta_rows)

        return X, meta

    @staticmethod
    def compute_agent_suitability(player_features, economy_features, agent_id):
        profile = AGENT_PROFILES.get(agent_id, {})
        score = 0
        if profile.get("ability_heavy") and player_features["ability_damage_ratio"].values[0] > 0.25:
            score += 1

        if profile.get("entry") and player_features["headshot_damage_ratio"].values[0] > 0.3:
            score += 1

        if profile.get("eco_friendly") and economy_features["player_loadout_ratio"] < 0.25:
            score += 1

        return score

    @staticmethod
    def generate_damage_target_summary(target_analysis):
        breakdown = target_analysis["breakdown"]

        body = next((x for x in breakdown if x["target"] == "body"), None)
        head = next((x for x in breakdown if x["target"] == "head"), None)
        leg = next((x for x in breakdown if x["target"] == "leg"), None)

        insights = []

        if head and head["damage_ratio"] > 0.45:
            insights.append("Relies heavily on precision aiming and headshots")

        if body and body["damage_ratio"] > 0.5:
            insights.append("Primarily deals body damage, indicating spray-based engagements")

        if leg and leg["damage_ratio"] > 0.1:
            insights.append("Frequently hits legs, suggesting rushed or unstable aim")

        if not insights:
            insights.append("Maintains balanced damage distribution across targets")

        return {
            "primary_target": target_analysis["most_common_target"],
            "summary": " | ".join(insights)
        }

    @staticmethod
    def generate_weapon_summary(source_analysis):
        breakdown = source_analysis["breakdown"]

        totals = {
            "rifle": 0,
            "smg": 0,
            "shotgun": 0,
            "sniper": 0,
            "pistol": 0,
            "ability": 0
        }

        total_damage = sum(x["damage"] for x in breakdown) or 1

        for x in breakdown:
            src = x["source"]
            dmg = x["damage"]

            if src in RIFLES:
                totals["rifle"] += dmg
            elif src in SMGS:
                totals["smg"] += dmg
            elif src in SHOTGUNS:
                totals["shotgun"] += dmg
            elif src in SNIPERS:
                totals["sniper"] += dmg
            elif src in PISTOLS:
                totals["pistol"] += dmg
            elif src in ABILITIES:
                totals["ability"] += dmg

        ratios = {k: np.round(v / total_damage, 3) for k, v in totals.items()}

        insights = []

        if ratios["rifle"] > 0.6:
            insights.append("Primary rifler relying heavily on rifles")

        if ratios["ability"] > 0.25:
            insights.append("Significant damage contribution from abilities")

        if ratios["sniper"] > 0.25:
            insights.append("Sniper-oriented playstyle")

        if ratios["smg"] + ratios["shotgun"] > 0.3:
            insights.append("Prefers close-range aggressive engagements")

        if not insights:
            insights.append("Balanced weapon usage across categories")

        return {
            "most_common_weapon": source_analysis["most_common_source"],
            "weapon_damage_ratio": ratios,
            "summary": " | ".join(insights)
        }

    @staticmethod
    def generate_damage_summary(target_analysis, source_analysis):
        return (
            f"Most damage dealt to {target_analysis['most_common_target']} "
            f"using {source_analysis['most_common_source']}. "
            f"Weapon usage indicates a "
            f"{'rifle-heavy' if source_analysis['most_common_source'] in RIFLES else 'mixed'} playstyle."
        )

    @staticmethod
    def get_player_meta_json(meta, player_id):
        meta_json = meta[meta['player_id'].astype(str) == str(player_id)]
        if meta_json.empty:
            return {}
        return meta_json.iloc[0].to_dict()
    
    def generate_player_report(self,strength_model,win_model, explainer, player_stats_df, meta , player_json):
        strengths, weaknesses = self.explain_player( explainer, player_stats_df
        )
        
        damage_target_analysis = self.analyze_damage_targets(player_json)
        damage_source_analysis = self.analyze_damage_sources(player_json)
        economy_profile =self.extract_economy_features(player_json)
        eco_summary = self.economy_narrative(economy_profile)

        return {
            "meta": meta,
            
            "agent_fit": self.recommend_best_agent(player_stats_df, player_json),
            "ability_fit": self.analyze_ability_suitability(player_json),
            "objective_fit": self.analyze_objective_suitability(player_json),
            "economy_profile": self.extract_economy_features(player_json),
            "eco_summary" : eco_summary,
            "player_strength_score": self.player_strength_score(strength_model, player_stats_df),
            "strengths": strengths,
            "weaknesses": weaknesses,
            "player_win_probability": self.to_python_type(
                self.player_win_probability(win_model, player_stats_df)
            ), 
            "damage_source_analysis" : damage_source_analysis,
            "overall_damage_summary": self.generate_damage_summary(
                damage_target_analysis,
                damage_source_analysis
            ),
            "enemy_damage_summary": self.generate_damage_target_summary(damage_target_analysis),
            "damage_target_analysis": damage_target_analysis,
            "weapon_summary": self.generate_weapon_summary(damage_source_analysis),

            "playstyle": {
                "aim_heavy": self.to_python_type(player_stats_df["headshot_damage_ratio"].iloc[0] > 0.35),
                "utility_heavy": self.to_python_type(player_stats_df["ability_damage_ratio"].iloc[0] > 0.25),
                "rifler": self.to_python_type(player_stats_df["rifle_damage_ratio"].iloc[0] > 0.6)
            }
        }

    def recommend_best_agent(self,player_features, player_json):
        economy = self.extract_economy_features(player_json)

        agent_scores = {}

        for agent in AGENT_PROFILES.keys():
            agent_scores[agent] = self.compute_agent_suitability(
                player_features,
                economy,
                agent
            )

        best_agent = max(agent_scores, key=agent_scores.get)
        top_agents = heapq.nlargest(4, agent_scores, key=agent_scores.get)

        return {
            "recommended_agent": best_agent,
            "top_agents": {agent: agent_scores[agent] for agent in top_agents}
        }

    def explain_player(self, explainer, X_row, threshold=0.05):
        shap_output = explainer(X_row)
        shap_vals = shap_output.values[0]
        impacts = []
        for feature, value in zip(X_row.columns, shap_vals):
            impacts.append({
                "feature": feature,
                "shap_score": float(np.round(value ,3)),
                "normalized_score": self.to_python_type(
        float(np.round(abs(value) / max(abs(shap_vals))))
    ),
                "direction": "positive" if value > 0 else "negative",
                "impact_level": (
                    "high impact" if abs(value) > 0.15 else
                    "moderate impact" if abs(value) > threshold else
                    "negligible impact"
                )
            })

        strengths = [i for i in impacts if i["shap_score"] > threshold]
        weaknesses = [i for i in impacts if i["shap_score"] < -threshold]

        return strengths, weaknesses
    
    def get_player_df(self, data, series_id, player_id, round):
        df = pd.DataFrame(data)
        
        player_df = df[(df['player_id'].astype(str) == str(player_id)) & (df['series_id'].astype(str) == str(series_id)) & (df['round'].astype(str) == str(round))]

        if player_df.empty:
            return {}, {}
        
        player_df = player_df.iloc[0]
        player_stats_df = self.build_player_predict_structure(player_df)
        return player_stats_df, player_df.to_dict()

    def build_player_predict_structure(self,data_json):
        X = []
        features = self.extract_player_features(data_json)
        X.append(features)
        return pd.DataFrame(X)
    
    def train_strength_model(self):
        z = (self.X["damage_efficiency"] - self.X["damage_efficiency"].mean()) / self.X["damage_efficiency"].std()
        y = (z > 0.7).astype(int)

        X_train, X_test, y_train, y_test = train_test_split(
            self.X, y, test_size=0.1, random_state=42, stratify=y
        )
        self.model.fit(X_train, y_train)

    def train_win_model(self):
        y_win = self.player_table["won"].astype(int)
        self.win_model.fit(self.X, y_win)

    @staticmethod
    def get_player_all_series_df(data, series_id, player_id):
        df = pd.DataFrame(data)
        
        player_df = df[(df['series_id'].astype(str) == str(series_id)) & (df['player_id'].astype(str) == str(player_id))]
        return player_df 

    @staticmethod
    def aggregate_strengths_weaknesses(player_reports):
        feature_scores = defaultdict(list)

        for r in player_reports:
            for s in r.get("strengths", []):
                feature_scores[s["feature"]].append(s["shap_score"])
            for w in r.get("weaknesses", []):
                feature_scores[w["feature"]].append(w["shap_score"])

        aggregated = []
        for feature, scores in feature_scores.items():
            mean_score = np.mean(scores)
            aggregated.append({
                "feature": feature,
                "mean_shap": float(mean_score),
                "direction": "positive" if mean_score > 0 else "negative",
                "impact_level": (
                    "high" if abs(mean_score) > 0.2 else
                    "moderate" if abs(mean_score) > 0.1 else
                    "low"
                ),
                "consistency": float(np.std(scores))
            })

        return sorted(aggregated, key=lambda x: abs(x["mean_shap"]), reverse=True)

    @staticmethod
    def aggregate_win_probability(player_reports):
        probs = [r["player_win_probability"] for r in player_reports]
        return {
            "mean": float(np.mean(probs)),
            "median": float(np.median(probs)),
            "min": float(np.min(probs)),
            "max": float(np.max(probs)),
            "stability": float(1 - np.std(probs))
        }

    @staticmethod
    def aggregate_economy(player_reports):
        keys = ["player_loadout_ratio", "player_networth_ratio", "money_left_ratio"]

        return {
            k: float(np.mean([r["economy_profile"][k] for r in player_reports]))
            for k in keys
        }

    @staticmethod
    def aggregate_weapons(player_reports):
        weapon_counter = Counter()

        for r in player_reports:
            weapon_summary = r.get("weapon_summary", {}).get("weapon_damage_ratio", {})
            for w, v in weapon_summary.items():
                weapon_counter[w] += v

        total = sum(weapon_counter.values()) or 1

        most_common_weapon = weapon_counter.most_common(1)[0][0]

        return {
            "most_common_weapon": most_common_weapon,
            "weapon_damage_ratio": {
                w: round(v, 3)
                for w, v in weapon_summary.items()
            },
            "weapon_usage_ratio": {
                w: round(v / total, 3)
                for w, v in weapon_counter.items()
            },
            "summary": f"Primary {most_common_weapon} relying heavily on {most_common_weapon}s"
        }
    
    @staticmethod
    def aggregate_playstyle(player_reports):
        votes = Counter()

        for r in player_reports:
            for style, active in r.get("playstyle", {}).items():
                if active:
                    votes[style] += 1

        return votes.most_common(1)[0][0] if votes else "balanced"

    @staticmethod
    def compute_consistency(player_reports):
        dmg = [r["player_strength_score"] for r in player_reports]
        return float(1 / (1 + np.std(dmg)))

    def aggregate_player_series_reports(self,player_reports, player_id, series_id):
        strengths_weaknesses = self.aggregate_strengths_weaknesses(player_reports)
        win_prob = self.aggregate_win_probability(player_reports)
        economy_profile = self.aggregate_economy(player_reports)
        eco_summary = self.economy_narrative(economy_profile)
        return {
            "meta": {
                "player_id": player_id,
                "series_id": series_id,
                "rounds_played": len(player_reports),
                "rounds_won": sum(1 for report in player_reports if report.get('won')),
                "rounds_lost": sum(1 for report in player_reports if not report.get('won'))
            },
            "series_strengths": [s for s in strengths_weaknesses if s["mean_shap"] > 0],
            "series_weaknesses": [s for s in strengths_weaknesses if s["mean_shap"] < 0],
            "win_probability": win_prob,
            "economy_profile": economy_profile,
            "eco_summary": eco_summary,
            "weapon_profile": self.aggregate_weapons(player_reports),
            "playstyle": self.aggregate_playstyle(player_reports),
            "payer_consistency_score": self.compute_consistency(player_reports)
        }


    '''
    Main Player report Code
    '''
    def player_round_classifier_model_output(self, player_id, series_id, round):    
        player_stats_df, player_json = self.get_player_df(self.player_data_json, series_id, player_id, round)
        meta_json = self.get_player_meta_json(self.meta, player_id)
        player_report = self.generate_player_report(
            strength_model=self.model,
            win_model=self.win_model,
            explainer= self.explainer,
            player_stats_df=player_stats_df,
            meta=meta_json,
            player_json=player_json
        )
        return player_report
    
    '''
    Main Player report Code
    '''
    def overall_player_series_classifier_model_output(self, player_id, series_id):    
        player_series_df = self.get_player_all_series_df(self.player_data_json, series_id=series_id, player_id=player_id)
        player_reports = []
        for _, row in player_series_df.iterrows(): 
            meta_json = self.get_player_meta_json(self.meta, row['player_id'])
            filtered_df = self.build_player_predict_structure(row)    
            report = self.generate_player_report(strength_model=self.model, win_model=self.win_model,explainer=self.explainer, player_stats_df=filtered_df, player_json=row.to_dict(), meta=meta_json)
            player_reports.append(report)


            series_report = self.aggregate_player_series_reports(
            player_reports,
            player_id=player_id,
            series_id=series_id
        )
        return series_report
from database.db import get_db, close_db
import pandas as pd
import json, shap, math
import numpy as np
from collections import defaultdict
from xgboost import XGBClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score

class TeamPredictions:

    def __init__(self):
        self.team_table = self.load_team_table()
        self.team_data_json = self.team_table.to_dict(orient="records") 
        self.model= XGBClassifier(
            n_estimators=200,
            max_depth=4,
            learning_rate=0.05,
            subsample=0.9,
            colsample_bytree=0.9,
            eval_metric="logloss"
        )       
        self.train_model()
        # model call only after train for shap
        self.explainer = shap.TreeExplainer(self.model)

    def load_team_table(self) -> pd.DataFrame:
        conn = get_db()
        query = "SELECT * FROM 'all-teams'"
        team_table_final = pd.read_sql_query(query, conn)
        team_table_final['weaponKills'] = team_table_final['weaponKills'].apply(json.loads)
        team_table_final['player1'] = team_table_final['player1'].apply(json.loads)
        team_table_final['player2'] = team_table_final['player2'].apply(json.loads)
        team_table_final['player3'] = team_table_final['player3'].apply(json.loads)
        team_table_final['player4'] = team_table_final['player4'].apply(json.loads)
        team_table_final['player5'] = team_table_final['player5'].apply(json.loads)
        
        return team_table_final
    
    @staticmethod
    def weapon_entropy(weapon_kills: dict):
        total = sum(weapon_kills.values())
        if total == 0:
            return 0
        entropy = 0
        for v in weapon_kills.values():
            p = v / total
            entropy -= p * math.log(p + 1e-9)
        return entropy
    
    @staticmethod
    def weapon_usage_stats(weapon_kills) -> dict:
        stats = {}

        if not weapon_kills:
            return {
                "most_used_weapon": None,
                "least_used_weapon": None,
                "top_weapon_ratio": 0,
                "least_weapon_ratio": 0
            }

        total_kills = sum(weapon_kills.values())

        sorted_weapons = sorted(
            weapon_kills.items(),
            key=lambda x: x[1],
            reverse=True
        )

        most_used_weapon, most_count = sorted_weapons[0]
        least_used_weapon, least_count = sorted_weapons[-1]

        stats["most_used_weapon"] = most_used_weapon
        stats["least_used_weapon"] = least_used_weapon
        stats["top_weapon_ratio"] = most_count / max(total_kills, 1)
        stats["least_weapon_ratio"] = least_count / max(total_kills, 1)
        return stats
    
    @staticmethod
    def weapon_dependency_score(weapon_kills):
        total = sum(weapon_kills.values())
        if total == 0:
            return 0
        return max(weapon_kills.values()) / total

    @staticmethod
    def weapon_class_ratios(weapon_kills):
        rifle = sum(weapon_kills.get(w, 0) for w in ["phantom", "vandal", "guardian"])
        eco = sum(weapon_kills.get(w, 0) for w in ["classic", "ghost", "frenzy", "shorty", "sheriff"])
        sniper = weapon_kills.get("operator", 0)
        smg = sum(weapon_kills.get(w, 0) for w in ["stinger", "spectre"])
        shotgun = sum(weapon_kills.get(w, 0) for w in ["judge", "bucky"])

        total = sum(weapon_kills.values())

        return {
            "rifle_ratio": rifle / max(total, 1),
            "eco_ratio": eco / max(total, 1),
            "sniper_ratio": sniper / max(total, 1),
            "smg_ratio": smg / max(total, 1),
            "shotgun_ratio": shotgun / max(total, 1)
        }
    
    @staticmethod
    def compute_weapon_win_impact(team_data):
        weapon_stats = defaultdict(lambda: {"wins": 0, "games": 0})

        for team in team_data:
            won = team["won"]
            for w in team["weaponKills"]:
                weapon = w["weaponName"]
                weapon_stats[weapon]["games"] += 1
                if won:
                    weapon_stats[weapon]["wins"] += 1

        weapon_impact = {
            w: weapon_stats[w]["wins"] / max(weapon_stats[w]["games"], 1)
            for w in weapon_stats
        }
        return weapon_impact

    @staticmethod
    def explain_team(model, explainer, X_row):
        shap_vals = explainer.shap_values(X_row)

        impact = dict(zip(X_row.columns, shap_vals[0]))
        sorted_impact = sorted(impact.items(), key=lambda x: abs(x[1]), reverse=True)

        strengths = [f for f, v in sorted_impact if v > 0]
        weaknesses = [f for f, v in sorted_impact if v < 0]

        return strengths, weaknesses

    @staticmethod
    def team_strength_score(model, X_row):
        win_prob = model.predict_proba(X_row)[0][1]

        consistency = 1 / (1 + X_row["std_player_kills"].values[0])
        synergy = X_row["assist_density"].values[0]

        return float(round(0.5 * win_prob + 0.3 * consistency + 0.2 * synergy, 3))

    @staticmethod
    def weapon_summary_from_features(X_row):
        return {
            "rifle_ratio": float(round(X_row["rifle_ratio"].values[0], 3)),
            "eco_ratio": float(round(X_row["eco_ratio"].values[0], 3)),
            "sniper_ratio": float(round(X_row["sniper_ratio"].values[0], 3)),
            "smg_ratio": float(round(X_row["smg_ratio"].values[0], 3)),
            "shotgun_ratio": float(round(X_row["shotgun_ratio"].values[0], 3)),
            "weapon_dependency": float(round(X_row["weapon_dependency"].values[0], 3)),
            "weapon_entropy": float(round(X_row["weapon_entropy"].values[0], 3)),
            "weapon_benefit_score": float(round(X_row["weapon_benefit_score"].values[0], 3))
        }
    
    @staticmethod
    def combat_metrics_from_features(X_row):
        return {
            "kills": int(X_row["kills"].values[0]),
            "deaths": int(X_row["deaths"].values[0]),
            "kill_diff": int(X_row["kill_diff"].values[0]),
            "headshot_ratio": float(round(X_row["team_headshot_ratio"].values[0], 3)),
        }

    @staticmethod
    def teamplay_metrics_from_features(X_row):
        return {
            "assist_density": float(round(X_row["assist_density"].values[0], 3)),
            "avg_player_kills": float(round(X_row["avg_player_kills"].values[0], 2)),
            "kill_distribution_std": float(round(X_row["std_player_kills"].values[0], 2)),
        }

    @staticmethod
    def explain_team_with_scores(model, explainer, X_row, top_k=None):
        """
        Returns strengths & weaknesses with SHAP scores.
        Scores reflect contribution to WIN probability.
        """

        shap_vals = explainer.shap_values(X_row)

        impact = dict(zip(X_row.columns, shap_vals[0]))

        # Sort by absolute impact
        sorted_impact = sorted(
            impact.items(), key=lambda x: abs(x[1]), reverse=True
        )

        strengths = []
        weaknesses = []

        for feature, score in sorted_impact:
            if score > 0:
                strengths.append({
                    "feature": feature,
                    "shap_score": float(score)
                })
            elif score < 0:
                weaknesses.append({
                    "feature": feature,
                    "shap_score": float(score)
                })

        if top_k:
            strengths = strengths[:top_k]
            weaknesses = weaknesses[:top_k]

        return strengths, weaknesses
        
    @staticmethod
    def normalize_shap_scores(items):
        max_val = max(abs(i["shap_score"]) for i in items) if items else 1

        for i in items:
            i["normalized_score"] = round(abs(i["shap_score"]) / max_val, 3)

        return items

    @staticmethod
    def interpret_impact(normalized_score):
        if normalized_score >= 0.7:
            return "high impact"
        elif normalized_score >= 0.4:
            return "moderate impact"
        elif normalized_score >= 0.2:
            return "low impact"
        else:
            return "negligible impact"

    @staticmethod
    def feature_win_signal(normalized_score, direction):
        if direction == "positive" and normalized_score >= 0.6:
            return "strongly supports winning"
        if direction == "negative" and normalized_score >= 0.6:
            return "strongly increases loss risk"
        return "minor influence"


    @staticmethod
    def get_multiple_teams_df(data, team_id):
        df = pd.DataFrame(data)
        filtered_df = df[df['team_id'].astype(str) == str(team_id)]
        return filtered_df


    @staticmethod
    def aggregate_numeric(series_reports):
        # Temporary storage for all values
        agg = {
            "general": defaultdict(list),
            "combat_metrics": defaultdict(list),
            "teamplay_metrics": defaultdict(list),
            "weapon_analysis": defaultdict(list)
        }

        for r in series_reports:
            # General top-level stats 

            # Grouped metrics
            for category in ["combat_metrics", "teamplay_metrics", "weapon_analysis"]:
                if category in r:
                    for k, v in r[category].items():
                        agg[category][k].append(v)

        # Final nested dictionary construction
        result = {}
        
        # Process General stats first
        for k, v in agg["general"].items():
            result[k] = round(float(np.mean(v)), 3)

        # Process Nested Metrics
        for category in ["combat_metrics", "teamplay_metrics", "weapon_analysis"]:
            result[category] = {
                k: round(float(np.mean(v)), 3) for k, v in agg[category].items()
            }

        return result

    @staticmethod
    def aggregate_weapon_impact(series_reports):
        weapon_scores = defaultdict(list)

        for r in series_reports:
            for weapon, score in r.get("overall_weapon_win_impact", {}).items():
                weapon_scores[weapon].append(score)

        return {
            weapon: float(round(np.mean(scores), 3))
            for weapon, scores in weapon_scores.items()
        }

    def aggregate_strengths_weaknesses(self, series_reports, top_k=5):
        strength_scores = defaultdict(list)
        weakness_scores = defaultdict(list)

        for r in series_reports:
            for s in r["strengths"]:
                strength_scores[s["feature"]].append(s["normalized_score"])

            for w in r["weaknesses"]:
                weakness_scores[w["feature"]].append(w["normalized_score"])

        def create_strength_dict(feature, values, direction):
            score = float(round(np.mean(values), 3))
            return {
                "feature": feature,
                "direction": direction,
                "normalized_score": score,
                "impact_level": self.__class__.interpret_impact(score),
                "win_signal": self.__class__.feature_win_signal(score, direction)
            }

        strengths = sorted(
            [create_strength_dict(f, v, "positive") for f, v in strength_scores.items()],
            key=lambda x: x["normalized_score"],
            reverse=True
        )

        weaknesses = sorted(
                [create_strength_dict(f, v, "negative") for f, v in weakness_scores.items()],
                key=lambda x: x["normalized_score"],
                reverse=True
            )

        return strengths[:top_k], weaknesses[:top_k]


    def generate_team_overall_report(self, team_id, series_reports):
        numeric_summary = self.__class__.aggregate_numeric(series_reports)
        strengths, weaknesses = self.aggregate_strengths_weaknesses(series_reports)
        weapon_impact = self.__class__.aggregate_weapon_impact(series_reports)

        return {
            "meta_data" : {
                "team_id": team_id,
                "series_count": len(series_reports),
            },
            "team_strength_score": float(round(
                np.mean([r["team_strength_score"] for r in series_reports]), 3
            )),

            "win_probability": float(round(
                np.mean([r["win_probability"] for r in series_reports]), 3
            )),

            # Extract the nested keys from numeric_summary so they sit at the top level
            "combat_metrics": numeric_summary.get("combat_metrics"),
            "teamplay_metrics": numeric_summary.get("teamplay_metrics"),
            "weapon_analysis": numeric_summary.get("weapon_analysis"),
            
            "strengths": strengths,
            "weaknesses": weaknesses,

            "overall_weapon_win_impact": weapon_impact
        }

    def explain_team_scored(self, model, explainer, X_row, top_k=5):
        strengths, weaknesses =  self.__class__.explain_team_with_scores(
            model, explainer, X_row, top_k=top_k
        )

        strengths =  self.__class__.normalize_shap_scores(strengths)
        weaknesses =  self.__class__.normalize_shap_scores(weaknesses)

        for s in strengths:
            s["impact_level"] =  self.__class__.interpret_impact(s["normalized_score"])
            s["direction"] = "positive"
            s["win_signal"] =  self.__class__.feature_win_signal(s["normalized_score"], "positive")        

        for w in weaknesses:
            w["impact_level"] =  self.__class__.interpret_impact(w["normalized_score"])
            w["direction"] = "negative"
            s["win_signal"] =  self.__class__.feature_win_signal(s["normalized_score"], "negative")        

        return {
            "strengths": strengths,
            "weaknesses": weaknesses
        }


    def build_dataset(self, team_json_list):
        X = []
        y = []

        for team in team_json_list:
            features = self.extract_team_features(team)
            X.append(features)
            y.append(team["won"])   # LABEL

        return pd.DataFrame(X), np.array(y)
    
    def extract_team_features(self, team_json, weapon_win_impact=None):
        features = {}

        # Basic team stats
        features['series_id'] = team_json['series_id']
        features['team_id'] = team_json['team_id']
        features["kills"] = team_json["kills"]
        features["deaths"] = team_json["deaths"]
        features["kill_diff"] = team_json["kills"] - team_json["deaths"]
        features["assist_density"] = team_json["killAssistsGiven"] / max(team_json["kills"], 1)
        features["assist_received_density"] = team_json["killAssistsReceived"] / max(team_json["kills"], 1)
        # features["first_kill"] = team_json["firstKill"]

        # Weapon kills (team level)
        weapon_kills = {}
        for w in team_json["weaponKills"]:
            weapon_kills[w["weaponName"]] = w["count"]

        total_weapon_kills = sum(weapon_kills.values())

        # Usage stats
        usage = self.__class__.weapon_usage_stats(weapon_kills)
        features.update({
            "top_weapon_ratio": usage["top_weapon_ratio"],
            "least_weapon_ratio": usage["least_weapon_ratio"],
            "weapon_dependency": self.__class__.weapon_dependency_score(weapon_kills),
            "weapon_entropy": self.__class__.weapon_entropy(weapon_kills)
        })


        # Weapon class ratios
        features.update(self.__class__.weapon_class_ratios(weapon_kills))

        # Weapon benefit score (weighted by kills)
        if weapon_win_impact:
            benefit = 0
            for weapon, count in weapon_kills.items():
                benefit += count * weapon_win_impact.get(weapon, 0.5)
            features["weapon_benefit_score"] = benefit / max(total_weapon_kills, 1)
        else:
            features["weapon_benefit_score"] = 0.5

        features["weapon_entropy"] = self.__class__.weapon_entropy(weapon_kills)

        features["rifle_ratio"] = (
            weapon_kills.get("phantom", 0) + weapon_kills.get("vandal", 0)
        ) / max(total_weapon_kills, 1)

        features["awp_dependency"] = weapon_kills.get("operator", 0) / max(total_weapon_kills, 1)
        # Player-level aggregation
        player_kills = []
        player_assists = []
        player_headshots = [] 

        for i in range(1, 6):
            p = team_json.get(f"player{i}")
            if not p:
                continue

            player_kills.append(p["kills"])
            player_assists.append(p["killAssistsGiven"])
            player_headshots.append(p.get("headshots", 0))

        features["avg_player_kills"] = np.mean(player_kills)
        features["max_player_kills"] = np.max(player_kills)
        features["std_player_kills"] = np.std(player_kills)   # star dependency
        features["team_headshot_ratio"] = sum(player_headshots) / max(sum(player_kills), 1) 

        return features

    
    def build_predict_structure(self, data_json):
        X = []
        features = self.extract_team_features(data_json)
        X.append(features)
        return pd.DataFrame(X)

    def get_team_df(self, data, team_id, series_id):
        df = pd.DataFrame(data)
        filtered_df = df[(df['team_id'].astype(str) == str(team_id)) & (df['series_id'].astype(str) == str(series_id))]
        if (len(filtered_df) == 0 ):
            return filtered_df
        filtered_df = filtered_df.iloc[0]
        filtered_df = self.build_predict_structure(filtered_df)
        return filtered_df
    
    def generate_team_report(self, model, explainer, X_row):
        # --- Prediction ---
        win_prob = model.predict_proba(X_row)[0][1]

        # --- Strength score ---
        strength_score = self.__class__.team_strength_score(model, X_row)

        # --- SHAP explanation ---
        # shap_vals = explainer.shap_values(X_row)
        impact_report = self.explain_team_scored(
            model,
            explainer,
            X_row.iloc[[0]],
            top_k=5
        )

        # --- Build report ---
        report = {
            "meta_data": {
            "team_id": X_row['team_id'].values[0],
            "series_id": int(X_row['series_id'].values[0])
        },
            "team_strength_score": strength_score,
            "win_probability": float(round(win_prob, 3)), 
            "strengths": impact_report['strengths'],
            "weaknesses": impact_report['weaknesses'],

            "weapon_analysis": self.__class__.weapon_summary_from_features(X_row),
            "combat_metrics": self.__class__.combat_metrics_from_features(X_row),
            "teamplay_metrics": self.__class__.teamplay_metrics_from_features(X_row),
            "overall_weapon_win_impact" : self.__class__.compute_weapon_win_impact(self.team_data_json)
        }

        return report
    
    '''
    Main All Team report Code    
    '''
    def overall_team_classifier_model_output(self, team_id) -> list:
        team_df = self.get_multiple_teams_df(self.team_data_json, team_id)   # returns multiple rows (one per series)
        series_reports = []
        for _, row in team_df.iterrows(): 
            filtered_df = self.build_predict_structure(row)    
            report = self.generate_team_report(self.model, self.explainer, filtered_df)
            series_reports.append(report)
        team_overall_report = self.generate_team_overall_report(
            team_id=team_id,
            series_reports=series_reports
        )
        return team_overall_report

    def train_model(self):
        X, y = self.build_dataset(self.team_data_json)
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.1, random_state=42
        )        
        self.model.fit(X_train, y_train)

    '''
    Main Team report Code
    '''
    def team_series_classifier_model_output(self, team_id, series_id):    
        team_df = self.get_team_df(self.team_data_json, team_id, series_id)
        team_report = self.generate_team_report(self.model, self.explainer,team_df)
        return team_report


from flask import Blueprint, jsonify, request
from database.db import get_db
from ml.team.team_predictions import TeamPredictions
from ml.player.player_predictions import PlayerPredictions
from collections import Counter
import pandas as pd 

player_blueprint = Blueprint('players', __name__)

@player_blueprint.route('/players', methods=['GET'])
def get_team_players():
    conn = get_db()
    players_q = f"""
        SELECT DISTINCT player_id, player_name
        FROM 'all-players'
    """
    players_table = pd.read_sql_query(players_q, conn)
    
    if players_table.empty:
        return {}
    
    players_details = players_table.to_dict(orient='records')
    return players_details

def get_series_id_of_player(player_id):
    # Connect to the SQLite database
    conn = get_db()
    cursor = conn.cursor()

    # SQL query to fetch series_id
    query = """
        SELECT series_id
        FROM 'all-players'
        WHERE player_id = ?
        GROUP BY series_id
        ORDER BY COUNT(*) DESC
        LIMIT 1;
    """

    # Execute the query
    cursor.execute(query, (player_id,))
    row = cursor.fetchone()
    if row:
        series_id = row[0]
    else :
        series_id = None
        
    return series_id

def extract_team__simulation_params(team_json):

    desired_keys = [
    "combat_metrics.kills",
    "combat_metrics.deaths",
    "combat_metrics.headshot_ratio",
    "overall_weapon_win_impact.phantom",
    "team_strength_score",
    "teamplay_metrics.assist_density",
    "teamplay_metrics.avg_player_kills",
    "weapon_analysis.rifle_ratio",
    "weapon_analysis.eco_ratio",
    "weapon_analysis.shotgun_ratio",
    "weapon_analysis.smg_ratio",
    "weapon_analysis.sniper_ratio",
    "weapon_analysis.weapon_dependency",
    "weapon_analysis.weapon_entropy",
]

    # Normalize the JSON data
    df = pd.json_normalize(team_json)

    # Select the desired columns
    extracted_data = df[desired_keys].to_dict(orient='records')[0]
    return extracted_data

def extract_player_simulation_params(player_json):
 
    def get_nested_value(obj, key):
        keys = key.split('.')
        value = obj
        for k in keys:
            if isinstance(value, dict):
                value = value.get(k)
            else:
                return None
        return value

    desired_keys = {
        "weapon_usage_ratio": ["rifle", "smg", "shotgun", "pistol", "ability"],
        "weapon_damage_ratio": ["rifle", "smg", "pistol", "shotgun", "ability"],
        "economy_profile": ["player_loadout_ratio", "player_networth_ratio", "money_left_ratio"],
    }

    extracted_data = {}

    for key, subkeys in desired_keys.items():
        for subkey in subkeys:
            full_key = f"{key}.{subkey}"
            extracted_data[full_key] = get_nested_value(player_json, f"weapon_profile.{key}.{subkey}" if key in ["weapon_usage_ratio", "weapon_damage_ratio"] else f"{key}.{subkey}")

    extracted_data["payer_consistency_score"] = player_json.get("payer_consistency_score")

    return extracted_data


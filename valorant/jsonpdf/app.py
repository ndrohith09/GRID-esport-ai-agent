from flask import Flask, send_file, jsonify, url_for, Response
import json
from jinja2 import Environment, FileSystemLoader
import pdfkit
import os

app = Flask(__name__)

# Sample JSON data
team_overall_json_data =  {
  "combat_metrics": {
    "deaths": 191.4,
    "headshot_ratio": 0.819,
    "kill_diff": 11.629,
    "kills": 203.029
  },
  "meta_data": { "series_count": 35, "team_id": "1611" },
  "overall_weapon_win_impact": {
    "ares": 0.667,
    "bucky": 0.442,
    "bulldog": 0.511,
    "classic": 0.504,
    "frenzy": 0.519,
    "ghost": 0.499,
    "guardian": 0.491,
    "judge": 0.503,
    "marshal": 0.562,
    "melee": 0.391,
    "odin": 0.562,
    "operator": 0.504,
    "outlaw": 0.585,
    "phantom": 0.501,
    "sheriff": 0.494,
    "shorty": 0.594,
    "spectre": 0.532,
    "stinger": 0.494,
    "vandal": 0.5
  },
  "strengths": [
    {
      "direction": "positive",
      "feature": "deaths",
      "impact_level": "high impact",
      "normalized_score": 1.0,
      "win_signal": "strongly supports winning"
    },
    {
      "direction": "positive",
      "feature": "least_weapon_ratio",
      "impact_level": "high impact",
      "normalized_score": 0.713,
      "win_signal": "strongly supports winning"
    },
    {
      "direction": "positive",
      "feature": "top_weapon_ratio",
      "impact_level": "moderate impact",
      "normalized_score": 0.632,
      "win_signal": "strongly supports winning"
    },
    {
      "direction": "positive",
      "feature": "assist_density",
      "impact_level": "moderate impact",
      "normalized_score": 0.589,
      "win_signal": "minor influence"
    },
    {
      "direction": "positive",
      "feature": "team_id",
      "impact_level": "low impact",
      "normalized_score": 0.394,
      "win_signal": "minor influence"
    }
  ],
  "team_strength_score": 0.39,
  "teamplay_metrics": {
    "assist_density": 0.399,
    "avg_player_kills": 40.606,
    "kill_distribution_std": 8.463
  },
  "weaknesses": [
    {
      "direction": "negative",
      "feature": "kill_diff",
      "impact_level": "high impact",
      "normalized_score": 1.0,
      "win_signal": "strongly increases loss risk"
    },
    {
      "direction": "negative",
      "feature": "kills",
      "impact_level": "negligible impact",
      "normalized_score": 0.147,
      "win_signal": "minor influence"
    },
    {
      "direction": "negative",
      "feature": "team_headshot_ratio",
      "impact_level": "negligible impact",
      "normalized_score": 0.058,
      "win_signal": "minor influence"
    },
    {
      "direction": "negative",
      "feature": "rifle_ratio",
      "impact_level": "negligible impact",
      "normalized_score": 0.049,
      "win_signal": "minor influence"
    },
    {
      "direction": "negative",
      "feature": "smg_ratio",
      "impact_level": "negligible impact",
      "normalized_score": 0.018,
      "win_signal": "minor influence"
    }
  ],
  "weapon_analysis": {
    "eco_ratio": 0.176,
    "rifle_ratio": 0.666,
    "shotgun_ratio": 0.003,
    "smg_ratio": 0.04,
    "sniper_ratio": 0.024,
    "weapon_benefit_score": 0.5,
    "weapon_dependency": 0.474,
    "weapon_entropy": 1.679
  },
  "win_probability": 0.547
}

team_series_json_data = {"combat_metrics": {"deaths": 184.121,
                    "headshot_ratio": 0.825,
                    "kill_diff": -4.182,
                    "kills": 179.939},
 "meta_data": {"series_id": 2653993, "team_id": "79"},
 "overall_weapon_win_impact": {"ares": 0.667,
                               "bucky": 0.442,
                               "bulldog": 0.511,
                               "classic": 0.504,
                               "frenzy": 0.519,
                               "ghost": 0.499,
                               "guardian": 0.491,
                               "judge": 0.503,
                               "marshal": 0.562,
                               "melee": 0.391,
                               "odin": 0.562,
                               "operator": 0.504,
                               "outlaw": 0.585,
                               "phantom": 0.501,
                               "sheriff": 0.494,
                               "shorty": 0.594,
                               "spectre": 0.532,
                               "stinger": 0.494,
                               "vandal": 0.5},
 "strengths": [{"direction": "positive",
                "feature": "kill_diff",
                "impact_level": "high impact",
                "normalized_score": 1.0,
                "win_signal": "strongly supports winning"},
               {"direction": "positive",
                "feature": "sniper_ratio",
                "impact_level": "moderate impact",
                "normalized_score": 0.665,
                "win_signal": "strongly supports winning"},
               {"direction": "positive",
                "feature": "least_weapon_ratio",
                "impact_level": "moderate impact",
                "normalized_score": 0.561,
                "win_signal": "minor influence"},
               {"direction": "positive",
                "feature": "top_weapon_ratio",
                "impact_level": "moderate impact",
                "normalized_score": 0.543,
                "win_signal": "minor influence"},
               {"direction": "positive",
                "feature": "smg_ratio",
                "impact_level": "moderate impact",
                "normalized_score": 0.541,
                "win_signal": "minor influence"}],
 "team_strength_score": 0.351,
 "teamplay_metrics": {"assist_density": 0.425,
                      "avg_player_kills": 35.988,
                      "kill_distribution_std": 7.561},
 "weaknesses": [{"direction": "negative",
                 "feature": "kill_diff",
                 "impact_level": "high impact",
                 "normalized_score": 1.0,
                 "win_signal": "strongly increases loss risk"},
                {"direction": "negative",
                 "feature": "shotgun_ratio",
                 "impact_level": "moderate impact",
                 "normalized_score": 0.518,
                 "win_signal": "minor influence"},
                {"direction": "negative",
                 "feature": "rifle_ratio",
                 "impact_level": "moderate impact",
                 "normalized_score": 0.424,
                 "win_signal": "minor influence"},
                {"direction": "negative",
                 "feature": "eco_ratio",
                 "impact_level": "moderate impact",
                 "normalized_score": 0.404,
                 "win_signal": "minor influence"},
                {"direction": "negative",
                 "feature": "assist_density",
                 "impact_level": "low impact",
                 "normalized_score": 0.388,
                 "win_signal": "minor influence"}],
 "weapon_analysis": {"eco_ratio": 0.175,
                     "rifle_ratio": 0.663,
                     "shotgun_ratio": 0.01,
                     "smg_ratio": 0.042,
                     "sniper_ratio": 0.021,
                     "weapon_benefit_score": 0.5,
                     "weapon_dependency": 0.463,
                     "weapon_entropy": 1.697},
 "win_probability": 0.449}

player_series_json_data = {
  "meta": {
    "player_id": 14,
    "series_id": 2819695,
    "rounds_played": 2,
    "rounds_won": 0,
    "rounds_lost": 2
  },
  "series_strengths": [
    {
      "feature": "damage_efficiency",
      "mean_shap": 0.6944999694824219,
      "direction": "positive",
      "impact_level": "high",
      "consistency": 5.0995001792907715
    },
    {
      "feature": "shotgun_damage_ratio",
      "mean_shap": 0.09600000083446503,
      "direction": "positive",
      "impact_level": "low",
      "consistency": 0.006999999284744263
    }
  ],
  "series_weaknesses": [
    {
      "feature": "body_damage_ratio",
      "mean_shap": -0.16300000250339508,
      "direction": "negative",
      "impact_level": "moderate",
      "consistency": 0.012999996542930603
    },
    {
      "feature": "alive",
      "mean_shap": -0.06600000150501728,
      "direction": "negative",
      "impact_level": "low",
      "consistency": 0.01300000213086605
    },
    {
      "feature": "headshot_damage_ratio",
      "mean_shap": -0.057999998331069946,
      "direction": "negative",
      "impact_level": "low",
      "consistency": 0.0
    }
  ],
  "win_probability": {
    "mean": 0.12875000201165676,
    "median": 0.12875000201165676,
    "min": 0.04859999939799309,
    "max": 0.20890000462532043,
    "stability": 0.9198499973863363
  },
  "economy_profile": {
    "player_loadout_ratio": 0.192,
    "player_networth_ratio": 0.194,
    "money_left_ratio": 0.403
  },
  "eco_summary": {
    "summary": "Player is an economy-balanced contributor, contributing 19% of team firepower. They conserves credits well.",
    "labels": {
      "investment_style": "economy-balanced contributor",
      "credit_discipline": "conserves credits well"
    }
  },
  "weapon_profile": {
    "most_common_weapon": "rifle",
    "weapon_damage_ratio": {
      "rifle": 0.448,
      "smg": 0.0,
      "shotgun": 0.0,
      "sniper": 0.247,
      "pistol": 0.084,
      "ability": 0.221
    },
    "weapon_usage_ratio": {
      "rifle": 0.548,
      "smg": 0.018,
      "shotgun": 0.011,
      "sniper": 0.134,
      "pistol": 0.066,
      "ability": 0.223
    },
    "summary": "Primary rifle relying heavily on rifles"
  },
  "playstyle": "aim_heavy",
  "payer_consistency_score": 0.6700167504187605
}

player_round_1_data = {
  "meta": {
    "player_id": 14,
    "player_name": "aspas",
    "series_id": 2819695,
    "round": 1,
    "notes": [
      "High-risk duelist: Takes massive damage during encounters.",
      "Safety Concern: High self-damage recorded; check ability usage (Raze satchels/nades)."
    ]
  },
  "agent_fit": {
    "recommended_agent": "raze",
    "top_agents": { "raze": 2, "jett": 1, "neon": 1, "phoenix": 1 }
  },
  "ability_fit": {
    "best_ability": "boom-bot",
    "ability_breakdown": {
      "blast-pack": { "usage_ratio": 0.0, "usage_level": "low" },
      "paint-shells": { "usage_ratio": 0.0, "usage_level": "low" },
      "boom-bot": { "usage_ratio": 1.0, "usage_level": "moderate" },
      "showstopper": { "usage_ratio": 0.0, "usage_level": "low" }
    }
  },
  "objective_fit": {
    "best_objective": "captureUltimateOrb",
    "objective_breakdown": [
      {
        "objective": "captureUltimateOrb",
        "completion_count": 5,
        "completed_first": "True",
        "suitability_score": 7
      },
      {
        "objective": "defuseBomb",
        "completion_count": 2,
        "completed_first": "True",
        "suitability_score": 4
      },
      {
        "objective": "plantBomb",
        "completion_count": 4,
        "completed_first": "False",
        "suitability_score": 4
      },
      {
        "objective": "beginDefuseBomb",
        "completion_count": 2,
        "completed_first": "False",
        "suitability_score": 2
      },
      {
        "objective": "stopDefuseBomb",
        "completion_count": 2,
        "completed_first": "False",
        "suitability_score": 2
      },
      {
        "objective": "explodeBomb",
        "completion_count": 1,
        "completed_first": "False",
        "suitability_score": 1
      }
    ]
  },
  "economy_profile": {
    "player_loadout_ratio": 0.196,
    "player_networth_ratio": 0.194,
    "money_left_ratio": 0.2
  },
  "eco_summary": {
    "summary": "Player is an economy-balanced contributor, contributing 19% of team firepower. They spends most of their credits each round.",
    "labels": {
      "investment_style": "economy-balanced contributor",
      "credit_discipline": "spends most of their credits each round"
    }
  },
  "player_strength_score": 0.002,
  "strengths": [
    {
      "feature": "shotgun_damage_ratio",
      "shap_score": 0.08900000154972076,
      "normalized_score": 0.0,
      "direction": "positive",
      "impact_level": "moderate impact"
    }
  ],
  "weaknesses": [
    {
      "feature": "headshot_damage_ratio",
      "shap_score": -0.057999998331069946,
      "normalized_score": 0.0,
      "direction": "negative",
      "impact_level": "moderate impact"
    },
    {
      "feature": "body_damage_ratio",
      "shap_score": -0.17599999904632568,
      "normalized_score": 0.0,
      "direction": "negative",
      "impact_level": "high impact"
    },
    {
      "feature": "damage_efficiency",
      "shap_score": -4.40500020980835,
      "normalized_score": 1.0,
      "direction": "negative",
      "impact_level": "high impact"
    },
    {
      "feature": "alive",
      "shap_score": -0.05299999937415123,
      "normalized_score": 0.0,
      "direction": "negative",
      "impact_level": "moderate impact"
    }
  ],
  "player_win_probability": 0.04859999939799309,
  "damage_source_analysis": {
    "most_common_source": "phantom",
    "breakdown": [
      {
        "source": "phantom",
        "damage": 1464,
        "hits": 25,
        "damage_ratio": 0.548
      },
      {
        "source": "paint-shells",
        "damage": 481,
        "hits": 22,
        "damage_ratio": 0.18
      },
      { "source": "vandal", "damage": 331, "hits": 4, "damage_ratio": 0.124 },
      {
        "source": "showstopper",
        "damage": 143,
        "hits": 2,
        "damage_ratio": 0.054
      },
      { "source": "stinger", "damage": 102, "hits": 5, "damage_ratio": 0.038 },
      { "source": "sheriff", "damage": 101, "hits": 4, "damage_ratio": 0.038 },
      { "source": "judge", "damage": 60, "hits": 5, "damage_ratio": 0.022 },
      { "source": "marshal", "damage": 57, "hits": 2, "damage_ratio": 0.021 },
      { "source": "frenzy", "damage": 32, "hits": 1, "damage_ratio": 0.012 }
    ]
  },
  "overall_damage_summary": "Most damage dealt to body using phantom. Weapon usage indicates a rifle-heavy playstyle.",
  "enemy_damage_summary": {
    "primary_target": "body",
    "summary": "Relies heavily on precision aiming and headshots | Primarily deals body damage, indicating spray-based engagements"
  },
  "damage_target_analysis": {
    "most_common_target": "body",
    "breakdown": [
      { "target": "body", "damage": 1436, "hits": 55, "damage_ratio": 0.537 },
      { "target": "head", "damage": 1280, "hits": 12, "damage_ratio": 0.479 },
      { "target": "leg", "damage": 55, "hits": 3, "damage_ratio": 0.021 }
    ]
  },
  "weapon_summary": {
    "most_common_weapon": "phantom",
    "weapon_damage_ratio": {
      "rifle": 0.648,
      "smg": 0.037,
      "shotgun": 0.022,
      "sniper": 0.021,
      "pistol": 0.048,
      "ability": 0.225
    },
    "summary": "Primary rifler relying heavily on rifles"
  },
  "playstyle": {
    "aim_heavy": "True",
    "utility_heavy": "False",
    "rifler": "True"
  }
}


@app.route('/json-to-pdf')
def json_to_pdf():
    # Load HTML template
    env = Environment(loader=FileSystemLoader('templates')) 
    template = env.get_template('main.html')
    players_list = [player_series_json_data, player_series_json_data]
    rounds_list = [player_round_1_data, player_round_1_data]

    html = template.render(team_overall=team_overall_json_data, team_series=team_series_json_data, player_series_list=players_list, rounds=rounds_list )

    # Generate PDF from HTML
    pdf_file = 'json_data.pdf'
    pdfkit.from_string(html, pdf_file)

    # Return JSON response with PDF URL
    pdf_url = url_for('serve_pdf', filename=pdf_file, _external=True)
    return jsonify({'pdf_url': pdf_url})

@app.route('/serve-pdf/<filename>')
def serve_pdf(filename):
    with open(filename, 'rb') as f:
        pdf_data = f.read()
    return Response(pdf_data, mimetype='application/pdf', headers={
        'Content-Disposition': f'inline; filename="{filename}"'
    })
# def serve_pdf(filename):
#     return send_file(filename, as_attachment=True)

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=8001)

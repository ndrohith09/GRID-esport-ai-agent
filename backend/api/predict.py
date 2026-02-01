from flask import Blueprint, jsonify, request
from ml.team.team_predictions import TeamPredictions
from ml.player.player_predictions import PlayerPredictions
from ml.montecarlo.player_monte_carlo import PlayerMonteCarloPredictions 
from ml.montecarlo.team_monte_carlo import TeamMonteCarloPredictions 
from .players import get_series_id_of_player, extract_team__simulation_params, extract_player_simulation_params

predict_blueprint = Blueprint('predict', __name__)

"""
------------ML Predictions------------
Returns player_id, player_name as list of objects
"""
@predict_blueprint.route('/predict/team/<team_id>', methods=['GET'])
def get_overall_team_data(team_id):
    team_json = TeamPredictions().overall_team_classifier_model_output(team_id)
    return team_json

@predict_blueprint.route('/predict/team/<team_id>/series/<series_id>', methods=['GET'])
def get_team_series_data(team_id, series_id):
    team_json = TeamPredictions().team_series_classifier_model_output(team_id, series_id)
    return team_json

@predict_blueprint.route('/predict/player/<player_id>/series/<series_id>/<round_id>', methods=['GET'])
def get_player_series_round_data(player_id, series_id, round_id):
    team_json = PlayerPredictions().player_round_classifier_model_output(player_id, series_id, round_id)
    return team_json

@predict_blueprint.route('/predict/player/<player_id>/series/<series_id>', methods=['GET'])
def get_player_overall_series_data(player_id, series_id):
    team_json = PlayerPredictions().overall_player_series_classifier_model_output(player_id, series_id)
    return team_json

"""
------------Monte Carlo Predictions------------
"""
@predict_blueprint.route('/montecarlo/player', methods=['POST'])
def player_probability_monte_carlo():
    player_id = request.json.get('player_id')
    simulator_params = request.json.get('simulator_params')    
    series_id = get_series_id_of_player(player_id)    
    playerA_json = PlayerPredictions().overall_player_series_classifier_model_output(player_id, series_id)
    player_mc = PlayerMonteCarloPredictions().monte_carlo_player_win_probability(playerA_json, simulator_params)
    extracted_simulation_params = extract_player_simulation_params(playerA_json)
    return {
        "mc" : player_mc,
        "simulator_params" : extracted_simulation_params   
    }

@predict_blueprint.route('/montecarlo/player-vs-player', methods=['GET'])
def player_vs_player__probability_monte_carlo():
    playerA_id = request.args.get('playerA_id')
    playerB_id = request.args.get('playerB_id') 

    playerA_series_id = get_series_id_of_player(playerA_id)    
    playerA_json = PlayerPredictions().overall_player_series_classifier_model_output(playerA_id, playerA_series_id)

    playerB_series_id = get_series_id_of_player(playerB_id)    
    playerB_json = PlayerPredictions().overall_player_series_classifier_model_output(playerB_id, playerB_series_id)
    
    player_mc = PlayerMonteCarloPredictions().monte_carlo_player_vs_player(playerA_json, playerB_json)
    return player_mc

@predict_blueprint.route('/montecarlo/team', methods=['POST'])
def team_probability_monte_carlo():
    print(request.json)
    team_id = request.json.get('team_id')
    simulator_params = request.json.get('simulator_params')    
    teamA_json = TeamPredictions().overall_team_classifier_model_output(team_id)
    extracted_simulation_params = extract_team__simulation_params(teamA_json)
    team_mc = TeamMonteCarloPredictions().simulate_team_win_probability(teamA_json, params=simulator_params)
    return {
        "mc" : team_mc,
        "simulator_params" : extracted_simulation_params
    }

@predict_blueprint.route('/montecarlo/team-vs-team', methods=['GET'])
def team_vs_team_probability_monte_carlo():
    teamA_id = request.args.get('teamA_id')
    teamB_id = request.args.get('teamB_id')   

    teamA_json = TeamPredictions().overall_team_classifier_model_output(teamA_id)
    teamB_json = TeamPredictions().overall_team_classifier_model_output(teamB_id)
    
    team_mc = TeamMonteCarloPredictions().simulate_match(teamA_json, teamB_json)
    return team_mc

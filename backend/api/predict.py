from flask import Blueprint, jsonify, request
from ml.team.team_predictions import TeamPredictions
from ml.player.player_predictions import PlayerPredictions

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

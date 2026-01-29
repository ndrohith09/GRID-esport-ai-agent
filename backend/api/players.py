from flask import Blueprint, jsonify, request
from database.db import get_db
from ml.team.team_predictions import TeamPredictions
from ml.player.player_predictions import PlayerPredictions

player_blueprint = Blueprint('players', __name__)

# Your users API endpoints here
@player_blueprint.route('/players', methods=['GET'])
def get_players():
    team_id = 97
    series_id = 2843071
    player_id = 2358    
    # player = PlayerPredictions().overall_player_series_classifier_model_output(player_id, series_id)
    player = PlayerPredictions().player_round_classifier_model_output(player_id, series_id, 1)
    # table = TeamPredictions().team_series_classifier_model_output(team_id, series_id)
    # table = TeamPredictions().overall_team_classifier_model_output(team_id)
    return player 
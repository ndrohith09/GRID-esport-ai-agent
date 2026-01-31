from database.db import get_db, close_db
import pandas as pd
from flask import Blueprint, jsonify, request, url_for, Response
from datetime import datetime
from jinja2 import Environment, FileSystemLoader
import pdfkit
from ml.team.team_predictions import TeamPredictions
from ml.player.player_predictions import PlayerPredictions

home_blueprint = Blueprint('home', __name__)

@home_blueprint.route('/my-teams', methods=['GET'])
def get_my_teams():
    user_id = request.args.get('user_id')
    conn = get_db()
    teams_q =  "SELECT DISTINCT team_id, team_name, user_id, game_id FROM user_teams WHERE user_id = ?"
    teams_table = pd.read_sql_query(teams_q, conn, params=(user_id,))
    return teams_table.to_dict('records')

@home_blueprint.route('/add-team', methods=['POST'])
def add_team():
    try:
        conn = get_db()
        data = request.json
        team_id = data.get('team_id')
        team_name = data.get('team_name')
        user_id = data.get('user_id')
        game_id = data.get('game_id')

        if not team_id or not user_id or not game_id:
            return jsonify({'error': 'Missing required fields'}), 400

        cursor = conn.cursor()
        query = """
            INSERT INTO user_teams (team_id, team_name, user_id, game_id)
            VALUES (?, ?, ?, ?)
        """
        cursor.execute(query, (team_id, team_name, user_id, game_id))
        conn.commit()

        return jsonify({'team_id': team_id, 'team_name': team_name, 'game_id' : game_id, 'user_id': user_id}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()


@home_blueprint.route('/scouting-report', methods=['POST'])
def scouting_report():
    # Load HTML template
    data = request.json
    team_id = data.get('team_id')
    series_id = data.get('series_id')
     
    team_overall_json_data = TeamPredictions().overall_team_classifier_model_output(team_id)
    team_series_json_data = TeamPredictions().team_series_classifier_model_output(team_id, series_id)

    def get_players(team_id):
        conn = get_db()
        players_q = f"""
            SELECT DISTINCT p.player_id, p.player_name
            FROM 'all-players' p
            WHERE p.team_id = '{team_id}'
        """
        players_table = pd.read_sql_query(players_q, conn)
        players_details = players_table.to_dict(orient  ='records')
        return players_details
    
    players_list = []
    rounds_list = []
    players = get_players(team_id)
    for player in players[:2]:
        player_json = PlayerPredictions().overall_player_series_classifier_model_output(player['player_id'], series_id)
        players_list.append(player_json)

    rounds = [1, 2, 3]
    rounds_list = [
        PlayerPredictions().player_round_classifier_model_output(player['player_id'], series_id, round=round_id)
        for round_id in rounds
        for player in players[:1]
    ]
 
    env = Environment(loader=FileSystemLoader('templates')) 
    template = env.get_template('main.html')
    html = template.render(team_overall=team_overall_json_data, team_series=team_series_json_data, player_series_list=players_list, rounds=rounds_list)

    # Generate PDF from HTML
    pdf_file = 'json_data.pdf'
    pdfkit.from_string(html, pdf_file)

    # Return JSON response with PDF URL
    pdf_url = url_for('home.serve_pdf', filename=pdf_file, _external=True)
    return jsonify({'pdf_url': pdf_url})

@home_blueprint.route('/serve-pdf/<filename>')
def serve_pdf(filename):
    with open(filename, 'rb') as f:
        pdf_data = f.read()
    return Response(pdf_data, mimetype='application/pdf', headers={
        'Content-Disposition': f'inline; filename="{filename}"'
    })

'''
import sqlite3

conn = sqlite3.connect('valorant_esports.db')
cursor = conn.cursor()

query = """
    CREATE TABLE IF NOT EXISTS user_teams (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        team_id INTEGER,
        team_name TEXT,
        user_id INTEGER,
        game_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
"""
cursor.execute(query)
conn.commit()
conn.close()
'''
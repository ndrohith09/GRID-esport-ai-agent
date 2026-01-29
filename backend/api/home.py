from database.db import get_db, close_db
import pandas as pd
from flask import Blueprint, jsonify, request
from datetime import datetime

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
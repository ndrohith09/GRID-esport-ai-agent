from database.db import get_db, close_db
import pandas as pd
from flask import Blueprint, jsonify, request
from flask_cors import cross_origin
import json
from . import agent
team_blueprint = Blueprint('teams', __name__)

NECESSARY_TEAM_IDS = [97,79,96,1079,337,1611]

# def get_series_details(series_id):
#     conn = get_db()
#     series_q = f"""
#         SELECT s.series_id, s.tournament_name, s.format_name, s.start_date, 
#                COUNT(CASE WHEN p.won = 1 THEN p.series_id END) as won
#         FROM series s
#         LEFT JOIN 'all-players' p ON s.series_id = p.series_id
#         WHERE s.series_id = '{series_id}'
#         GROUP BY s.series_id, s.tournament_name, s.format_name, s.start_date
#     """
#     series_table = pd.read_sql_query(series_q, conn)
    
#     if series_table.empty:
#         return {}
    
#     series_details = series_table.iloc[0].to_dict()
#     return series_details

# def get_series_details(series_id):
#     conn = get_db()
#     series_q = f"SELECT DISTINCT series_id, tournament_name, format_name, start_date FROM series WHERE series_id = '{series_id}'"
#     series_table = pd.read_sql_query(series_q, conn)
    
#     if series_table.empty:
#         return {}
    
#     series_details = series_table.iloc[0].to_dict()
#     return series_details

"""
Returns all team_ids as list of objects
"""
@team_blueprint.route('/teams', methods=['GET'])
def get_team_ids():
    conn = get_db()
    teams_q =  "SELECT DISTINCT team_id, team_name FROM 'all-players'"
    teams_table = pd.read_sql_query(teams_q, conn)
    return teams_table.to_dict('records')

"""
Returns series data as list of objects
"""
@team_blueprint.route('/teams/<team_id>', methods=['GET'])
def get_team_series_ids(team_id):
    conn = get_db()

    q = f"""
    SELECT DISTINCT
        s.series_id,
        s.tournament_name,
        s.start_date,
        s.format_name,
        t.won
    FROM 'all-teams' t
    JOIN series s
        ON s.series_id = t.series_id
    WHERE t.team_id = '{team_id}'
    """

    df_out = pd.read_sql_query(q, conn)
    return df_out.to_dict(orient="records")

@team_blueprint.route('/teams/<team_id>/<series_id>/opponent', methods=['GET'])
def get_team_series_opponent(team_id , series_id):
    conn = get_db()

    q = f"""
    SELECT DISTINCT T3.team_name, T3.team_id, T1.start_date, T1.tournament_name
    FROM series T1
    JOIN (
        SELECT 
        CASE 
            WHEN T1.team_ids LIKE '{team_id},%' THEN SUBSTR(T1.team_ids, INSTR(T1.team_ids, ',') + 1)
            WHEN T1.team_ids LIKE '%,{team_id}' THEN SUBSTR(T1.team_ids, 1, INSTR(T1.team_ids, ',') - 1)
        END AS other_team_id
        FROM series T1 
        WHERE T1.series_id = {series_id}
    ) T2 ON T1.series_id = {series_id}
    JOIN 'all-players' T3 ON T2.other_team_id = T3.team_id;
    """
    df_out = pd.read_sql_query(q, conn)
    return df_out.to_dict(orient="records")

# def get_team_series_ids(team_id):
#     conn = get_db()
#     teams_q =  f"SELECT DISTINCT series_id, won FROM 'all-teams' WHERE team_id = '{team_id}'"
#     teams_table = pd.read_sql_query(teams_q, conn) 
#     series_ids = teams_table['series_id'].tolist()
#     series_details = []
#     for series_id in series_ids:
#         series_detail = get_series_details(series_id)
#         series_details.append({
#             'series_id': series_detail['series_id'],
#             'tournament_name': series_detail['tournament_name'],
#             "start_date" : series_detail['start_date'],
#             "format_name" :series_detail['format_name'],
#             # "won" :ser    ies_detail['won'],            
#         })
#     return series_details

@team_blueprint.route('/teams/<team_id>/players', methods=['GET'])
def get_team_players(team_id):
    conn = get_db()
    players_q = f"""
        SELECT DISTINCT p.player_id, p.player_name
        FROM 'all-players' p
        WHERE p.team_id = '{team_id}'
    """
    players_table = pd.read_sql_query(players_q, conn)
    
    if players_table.empty:
        return {}
    
    players_details = players_table.to_dict(orient='records')
    return players_details

"""
Returns player_id, player_name as list of objects
"""
@team_blueprint.route('/teams/<team_id>/<series_id>', methods=['GET'])
def get_player_ids_of_team_series(series_id, team_id):
    conn = get_db()
    teams_q =  "SELECT * FROM 'all-players'"
    players_table = pd.read_sql_query(teams_q, conn)
    players_df = players_table[(players_table['series_id'].astype(str) == str(series_id)) & (players_table['team_id'].astype(str) == str(team_id))]
    return players_df[['player_id', 'player_name']].to_dict('records')


@team_blueprint.route('/teams/<team_id>/series/<series_id>/round', methods=['GET'])
@cross_origin()
def get_team_series_round_data(team_id, series_id):
    conn = get_db()
    query = f"""
        SELECT 
            DISTINCT round, won, side
        FROM 
            'all-players'
        WHERE 
            team_id = '{team_id}' AND series_id = '{series_id}'
    """
    team_series_data = pd.read_sql_query(query, conn)
    return team_series_data.to_dict('records')

"""
Returns a particular user's chat data
"""
@team_blueprint.route("/teams/chat/get/<user_id>",methods=['GET'])
def get_team_chat(user_id):
    conn=get_db()
    query=f"""
        SELECT
            id,message,user_id,created_time,CASE WHEN type = 0 THEN 'user' ELSE 'ai' END  as type
        FROM
            'team_chats'
        WHERE
            user_id = '{user_id}' ORDER BY created_time
    """
    teams_chat_data = pd.read_sql_query(query,conn)
    conn.close()
    return teams_chat_data.to_dict('records')

"""
    Add Particular chat to the team_chat
"""
@team_blueprint.route("/teams/chat/add",methods=['POST'])
def add_team_chat():
    conn = get_db()
    data = request.json
    team_id=data.get('team_id')
    user_id = data.get('user_id')
    message = data.get('message')
    llm_input = data.get('llm_input')

    cursor = conn.cursor()
    query = """
            INSERT INTO team_chats (team_id,user_id, message,type)
            VALUES (?,?, ? , ?)
        """
    cursor.execute(query, (team_id if team_id!=None else -1,user_id, message,0))
    conn.commit()

    result=agent.initiate_llm(llm_input)
    print('---------------------------------------------')
    print(type(result[0].data.decode('utf-8')), result[0].data.decode('utf-8'))
    if result[1] == 201:
        data = result[0].data.decode('utf-8')  # decode bytes to string 

        cursor = conn.cursor()
        query = """
            INSERT INTO team_chats (team_id,user_id,message,type)
            VALUES (?,?,?, ?)
        """
        cursor.execute(query, (team_id if team_id!=None else -1,user_id,data,1))
        conn.commit()

    else:
        print(f"Error {result[1]}: {result[0]}")
    
    
    return jsonify({'message': json.loads(result[0].data.decode('utf-8'))}), 201


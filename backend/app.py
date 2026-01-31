from flask import Flask, jsonify, request
from flask_cors import CORS
from api.players import player_blueprint
from api.teams import team_blueprint
from api.predict import predict_blueprint
from api.home import home_blueprint
from api.agent import agent_blueprint

from database.db import get_db, close_db

from flask import Flask, send_file
import json
from jinja2 import Environment, FileSystemLoader
import pdfkit

app = Flask(__name__)
CORS(
    app,
    resources={r"/*": {"origins": "http://localhost:5173"}},
    supports_credentials=True,
    methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"]
)

@app.before_request
def handle_preflight():
    if request.method == "OPTIONS":
        return "", 200


app.register_blueprint(player_blueprint)
app.register_blueprint(team_blueprint)
app.register_blueprint(predict_blueprint)
app.register_blueprint(home_blueprint)
app.register_blueprint(agent_blueprint)

app.teardown_appcontext(close_db)

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=8000)
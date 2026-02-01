from flask import Blueprint, jsonify, request
from database.db import get_db
from ml.team.team_predictions import TeamPredictions
from ml.player.player_predictions import PlayerPredictions
from agent.agent_graph import WebAgentGraphState
from langchain_openai import AzureChatOpenAI
from config.settings import AZURE_OPENAI_ENDPOINT,AZURE_OPENAI_API_KEY,AZURE_DEPLOYMENT,OPENAI_API_VERSION

agent_blueprint = Blueprint('agent', __name__)

LAZY_LOAD_LLM = None    

# Your users API endpoints here
@agent_blueprint.route('/agent', methods=['POST'])
def call_ai_agent():
    global LAZY_LOAD_LLM
    try:
        data = request.json
        input_prompt = str(data.get('input_prompt')).strip()
        
        if (LAZY_LOAD_LLM==None) or (isinstance(LAZY_LOAD_LLM,AzureChatOpenAI)==False):
            # Load the model from azure services
            LAZY_LOAD_LLM = AzureChatOpenAI(
                azure_endpoint=AZURE_OPENAI_ENDPOINT,
                azure_deployment=AZURE_DEPLOYMENT,
                openai_api_version=OPENAI_API_VERSION,
                api_key=AZURE_OPENAI_API_KEY,
                temperature=0,
            )

        """Initiate Agent"""
        thread_config = {
            "configurable": {
                "visited_nodes": [],
                "input_prompt": input_prompt,
                "model" : LAZY_LOAD_LLM,
                "player_output" : {}, #TODO: Add the json data of players output here
            },
        }
        initial_inputs = [("user", input_prompt)]

        compile_graph = WebAgentGraphState().compile_agent(thread_config)
        msg_res = compile_graph.invoke(
            {"messages": initial_inputs}, thread_config, stream_mode="values"
        )
        print("msg_res", msg_res['artifacts'])
        final_msg = msg_res["messages"][-1]
        final_msg_text = final_msg.content
        return jsonify({'response': final_msg_text, "artifacts" : msg_res['artifacts']}), 201

    except Exception as e:
        return jsonify({'error': str(e)}), 500

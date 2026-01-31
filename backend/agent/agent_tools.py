from pydantic import BaseModel, Field
from ml.team.team_predictions import TeamPredictions
from ml.player.player_predictions import PlayerPredictions
import json
import typing as t
from langchain_core.messages import (
    BaseMessage,
    SystemMessage,
    ToolMessage,
    HumanMessage,
)
from langchain_core.tools import BaseTool
from config.settings import AZURE_OPENAI_ENDPOINT, AZURE_OPENAI_API_KEY, TIME_ZONE
from ml.montecarlo.player_monte_carlo import PlayerMonteCarloPredictions 
from ml.montecarlo.team_monte_carlo import TeamMonteCarloPredictions 
from api.players import get_series_id_of_player, extract_team__simulation_params, extract_player_simulation_params

"""===================JSON Tool Analyzer===================="""
class GetPlayerSeriesDataRequest(BaseModel):
    """Request schema for fetching player series JSON data."""
    player_id: int = Field(..., description="Player ID")
    series_id: int = Field(..., description="Series ID")


class GetPlayerSeriesDataTool(BaseTool):
    """
TOOL: **GET_PLAYER_SERIES_DATA**

When the user requests player analysis for a specific series, call **GET_PLAYER_SERIES_DATA** with:
- player_id
- series_id

After calling the tool:
- Use artifact.player_json as the only source of truth.
- Do NOT hallucinate fields not present in the JSON.
- Summarize the player’s series performance using these keys when present:
  - meta (rounds_played, rounds_won, rounds_lost)
  - win_probability (mean, median, min, max, stability)
  - economy_profile
  - weapon_profile
  - playstyle
  - payer_consistency_score
  - series_strengths and series_weaknesses (mean_shap)

Output format:
1) Player Overview (player_id, series_id, rounds)
2) Win Probability Summary (mean + stability)
3) Strengths (top 2-5)
4) Weaknesses (top 2-5)
5) Economy & Weapon Profile summary
6) Key recommendations (2-4 bullets)

If user asks **"what-if"**:
- modify requested parameters and recompute win probability using surrogate model.
- show baseline vs scenario win probability and delta.
    """

    name: str = "GET_PLAYER_SERIES_DATA"
    description: str = (
        "Fetch player series prediction JSON for given player_id and series_id. "
        "Returns both readable text and the raw JSON artifact."
    )
    args_schema:t.Type[BaseModel] = GetPlayerSeriesDataRequest
    return_direct: bool = True
    response_format: str = "content_and_artifact"    

    meta: t.List = {}

    def __init__(self,meta:dict={}):
        super().__init__()
        self.meta = meta

    def _run(self, player_id: int, series_id: int) -> t.Tuple[dict, dict]:
        try:
            player_json = PlayerPredictions().overall_player_series_classifier_model_output(
                player_id=player_id,
                series_id=series_id
            )
            build_str = f"""Player {player_id} series {series_id} prediction JSON fetched successfully: \n {json.dumps(player_json, indent=2)}"""
            return build_str, {}
        except Exception as e:
            return f"Authentication Tool Execution Failed: {str(e)}", {}

"""=====================Player Round Data=================="""

class GetPlayerRoundDataRequest(BaseModel):
    """Request schema for fetching player round JSON data."""
    player_id: int = Field(..., description="Player ID")
    series_id: int = Field(..., description="Series ID")
    round_id: int = Field(..., description="Round ID within the series")

 
class GetPlayerRoundDataTool(BaseTool):
    """
TOOL: **GET_PLAYER_ROUND_DATA**

When the user requests player analysis for a specific round, call **GET_PLAYER_ROUND_DATA** with:
- player_id
- series_id
- round_id

After calling the tool:
- Use artifact.round_json as the only source of truth.
- Do NOT invent fields.

Output format:
1) Round Context (player_id, series_id, round_id)
2) Round Outcome & Win Probability (if present)
3) Key Drivers (strengths/weaknesses or SHAP signals if present)
4) Economy/Weapon notes (if present)
5) What changed vs expected? (short reasoning)
6) Improvement tips (2-3 bullets)

If user asks **"what-if"**:
- simulate small modifications to economy/weapon usage/consistency
- compute updated win probability using surrogate model
- show baseline vs scenario.
    """

    name: str = "GET_PLAYER_ROUND_DATA"
    description: str = (
        "Fetch player round prediction JSON for given player_id, series_id and round_id. "
        "Returns both readable text and raw JSON artifact."
    )
    args_schema: t.Type[BaseModel] = GetPlayerRoundDataRequest

    response_format: str = "content_and_artifact"
    return_direct: bool = True

    def __init__(self,meta:dict={}):
        super().__init__()
        self.meta = meta

    def _run(self, **kwargs) -> t.Tuple[dict, dict]:
        try:
            player_id = kwargs.get('player_id')
            series_id = kwargs.get('series_id')
            round_id = kwargs.get('round_id')
            # Fetch JSON from your pipeline
            round_json = PlayerPredictions().player_round_classifier_model_output(
                player_id=player_id,
                series_id=series_id,
                round_id=round_id,
            )
            build_str = f"""Player {player_id} series {series_id} round {round_id} prediction JSON fetched successfully: \n {json.dumps(round_json, indent=2)}"""
            return build_str, {}
        except Exception as e:
            return f"Authentication Tool Execution Failed: {str(e)}", {}

class GetTeamOverallDataRequest(BaseModel):
    """Request schema for fetching overall team prediction JSON data."""
    team_id: int = Field(..., description="Team ID")

class GetTeamOverallDataTool(BaseTool):
    """
TOOL: **GET_TEAM_OVERALL_DATA**

When the user requests overall team strength / season-level analysis, call **GET_TEAM_OVERALL_DATA** with required ids.

After calling the tool:
- Use artifact.team_json as the only source of truth.
- Summarize the team’s overall strength using:
  - win_probability
  - team_strength_score
  - combat_metrics
  - teamplay_metrics
  - weapon_analysis
  - overall_weapon_win_impact
  - strengths and weaknesses

Output format:
1) Team Overview (team_id, series_count if present)
2) Win Probability + Team Strength Score
3) Combat Summary (kills/deaths/kill_diff/headshot_ratio)
4) Teamplay Summary (assist_density, avg_player_kills, distribution)
5) Weapon Meta Summary (rifle/smg/eco ratios, entropy, dependency)
6) Top Weapons by impact (top 3)
7) Strengths & Weaknesses (top 3 each)
8) Recommendations (3-5 bullets)

If user asks **"what-if"**:
- apply requested parameter changes (weapon impact, ratios, strengths/weaknesses)
- recompute adjusted win probability
- show baseline vs scenario delta.
    """

    name: str = "GET_TEAM_OVERALL_DATA"
    description: str = (
        "Fetch overall team prediction JSON for a given team_id. "
        "This contains aggregated team analysis across all series."
    )
    args_schema: t.Type[BaseModel] = GetTeamOverallDataRequest

    response_format: str = "content_and_artifact"
    return_direct: bool = True

    def __init__(self,meta:dict={}):
        super().__init__()
        self.meta = meta

    def _run(self, **kwargs) -> t.Tuple[dict, dict]:
        try:
            team_id = kwargs.get('team_id') 
            # Fetch JSON from your pipeline
            team_json = TeamPredictions().overall_team_classifier_model_output(
                team_id=team_id
            )
            build_str = f"""Overall team {team_id} prediction JSON fetched successfully: \n {json.dumps(team_json, indent=2)}"""
            return build_str, {}
        except Exception as e:
            return f"Authentication Tool Execution Failed: {str(e)}", {}


class GetTeamSeriesDataRequest(BaseModel):
    """Request schema for fetching team series JSON data."""
    team_id: int = Field(..., description="Team ID")
    series_id: int = Field(..., description="Series ID")

class GetTeamSeriesDataTool(BaseTool):
    """
    TOOL: **GET_TEAM_SERIES_DATA**
    When the user requests team analysis for a specific series, call **GET_TEAM_SERIES_DATA** with:
    - team_id
    - series_id

    After calling the tool:
    - Use artifact.team_json as the only source of truth.
    - Do NOT hallucinate fields.

    Output format:
    1) Series Context (team_id, series_id)
    2) Win Probability Summary (and confidence if available)
    3) Strengths & Weaknesses (top 3 each)
    4) Combat & Teamplay highlights
    5) Weapon Analysis & key weapon impacts
    6) Key takeaways (3 bullets)
    7) Suggested improvements (2-4 bullets)

    If user asks **"what-if"**:
    - modify the relevant parameters and compute new win probability using surrogate model.
    - Optionally run Monte Carlo to show distribution shift.

    """

    name: str = "GET_TEAM_SERIES_DATA"
    description: str = (
        "Fetch team series prediction JSON for given team_id and series_id. "
        "Returns both readable text and raw JSON artifact."
    )
    args_schema: t.Type[BaseModel] = GetTeamSeriesDataRequest

    response_format: str = "content_and_artifact"
    return_direct: bool = True

    def __init__(self,meta:dict={}):
        super().__init__()
        self.meta = meta

    def _run(self, **kwargs) -> t.Tuple[dict, dict]:
        try:
            team_id = kwargs.get('team_id') 
            series_id = kwargs.get('series_id') 
            # Fetch JSON from your pipeline
            team_json = TeamPredictions().team_series_classifier_model_output(
                team_id=team_id,
                series_id=series_id,
            )
            build_str = f"""Team {team_id} series {series_id} prediction JSON fetched successfully: \n {json.dumps(team_json, indent=2)}"""
            return build_str, {}
        except Exception as e:
            return f"Authentication Tool Execution Failed: {str(e)}", {}


"""=====================Player Monte Carlo=================="""

class PlayerProbabilityMonteCarloRequest(BaseModel):
    """Request schema for Monte Carlo player win probability simulation."""
    player_id: int = Field(..., description="Player ID to simulate")
    simulator_params: t.Optional[dict] = Field(
        default=None,
        description="Monte Carlo simulation parameters (noise, n_trials, etc.)"
    )

class PlayerProbabilityMonteCarloTool(BaseTool):
    """
    Runs Monte Carlo simulation for a player's win probability based on latest series_id.

    TOOL: **PLAYER_PROBABILITY_MONTE_CARLO**

    Use this tool when the user asks:
    - "run monte carlo for player"
    - "simulate win probability"
    - "what if player performance changes"
    - "give distribution / p10 p90"

    Steps:
    1) Call PLAYER_PROBABILITY_MONTE_CARLO with player_id and simulator_params (if provided).
    2) Use artifact.mc as the final Monte Carlo output.
    3) Explain results: mean/median/p10/p90/stability.
    4) Use artifact.simulator_params to show what variables were simulated.
    5) Do not invent values not present in artifact. 

    Returns both readable content and structured artifact.
    """

    name: str = "PLAYER_PROBABILITY_MONTE_CARLO"
    description: str = (
        "Run Monte Carlo simulation for a player's win probability using player_id and optional simulator_params. "
        "Automatically fetches the latest series for that player."
    )
    args_schema: t.Type[BaseModel] = PlayerProbabilityMonteCarloRequest

    response_format: str = "content_and_artifact"
    return_direct: bool = True


    def __init__(self,meta:dict={}):
        super().__init__()
        self.meta = meta

    def _run(self, **kwargs) -> t.Tuple[dict, dict]:
        try:
            player_id = kwargs.get('player_id') 
            simulator_params = kwargs.get('simulator_params') 
             # Step 1: find latest series
            series_id = get_series_id_of_player(player_id)

            # Step 2: fetch player JSON
            player_json = PlayerPredictions().overall_player_series_classifier_model_output(
                player_id=player_id,
                series_id=series_id
            ) 

            # Step 3: Monte Carlo simulation
            player_mc = PlayerMonteCarloPredictions().monte_carlo_player_win_probability(
                player_json,
                simulator_params
            )
            build_str = f"""Monte Carlo simulation completed successfully: \n Monte Carlo Output (mc):\n {json.dumps(player_mc, indent=2)}"""
            return build_str, {}
        except Exception as e:
            return f"Authentication Tool Execution Failed: {str(e)}", {}


class PlayerVsPlayerMonteCarloRequest(BaseModel):
    """Request schema for player vs player Monte Carlo win probability."""
    playerA_id: int = Field(..., description="Player A ID")
    playerB_id: int = Field(..., description="Player B ID")


class GetPlayerVsPlayerMonteCarloTool(BaseTool):
    """
    Runs Monte Carlo simulation for Player A vs Player B win probability using
    player series JSON inputs.

    TOOL: **PLAYER_VS_PLAYER_PROBABILITY_MONTE_CARLO**

    When the user asks to compare two players or asks "who will win" between Player A and Player B,
    call PLAYER_VS_PLAYER_PROBABILITY_MONTE_CARLO with playerA_id and playerB_id.

    After calling:
    - Use artifact.monte_carlo as the source of truth.
    - Summarize the result:
    - win probability for Player A and Player B
    - mean/median/min/max if provided
    - stability/uncertainty
    - Explain key reasons using artifact.playerA.player_json and artifact.playerB.player_json strengths/weaknesses.
    - Do not hallucinate missing values.
    """

    name: str = "PLAYER_VS_PLAYER_PROBABILITY_MONTE_CARLO"
    description: str = (
        "Run Monte Carlo player-vs-player win probability simulation. "
        "Inputs: playerA_id, playerB_id. "
        "Fetches latest series_id for both players, gets player series JSON, then simulates win probability."
    )
    args_schema: t.Type[BaseModel] = PlayerVsPlayerMonteCarloRequest

    response_format: str = "content_and_artifact"
    return_direct: bool = True

    def __init__(self,meta:dict={}):
        super().__init__()
        self.meta = meta

    def _run(self, **kwargs) -> t.Tuple[dict, dict]:
        try:
            playerA_id = kwargs.get('playerA_id') 
            playerB_id = kwargs.get('playerB_id')  

            # ---- fetch series ids ----
            playerA_series_id = get_series_id_of_player(playerA_id)
            playerB_series_id = get_series_id_of_player(playerB_id)

            # ---- fetch player series json ----
            playerA_json = PlayerPredictions().overall_player_series_classifier_model_output(
                playerA_id, playerA_series_id
            )
            playerB_json = PlayerPredictions().overall_player_series_classifier_model_output(
                playerB_id, playerB_series_id
            )
            
            player_mc = PlayerMonteCarloPredictions().monte_carlo_player_vs_player(
                playerA_json, playerB_json
            )  
            build_str = f"""Player vs Player Monte Carlo completed: \n Monte Carlo Output (mc):\n {json.dumps(player_mc, indent=2)}"""
            return build_str, {}
        except Exception as e:
            return f"Authentication Tool Execution Failed: {str(e)}", {}

class TeamVsTeamMonteCarloRequest(BaseModel):
    """Request schema for team vs team Monte Carlo win probability."""
    teamA_id: int = Field(..., description="Team A ID")
    teamB_id: int = Field(..., description="Team B ID") 

class TeamVsTeamMonteCarloTool(BaseTool):
    """
    Runs a Monte Carlo simulation for Team A vs Team B and returns win probability output.

    TOOL: **TEAM_VS_TEAM_PROBABILITY_MONTE_CARLO**

    Use this tool when the user asks:
    - "Team A vs Team B win probability"
    - "predict winner between two teams"
    - "monte carlo simulation for match"
    - "what are the odds of A beating B?"

    Instructions after tool call:
    - Use artifact.simulation as the source of truth.
    - Report win probabilities clearly:
    - Team A win %
    - Team B win %
    - uncertainty / CI if present
    - Provide short reasoning based on:
    - win_probability
    - combat_metrics
    - teamplay_metrics
    - weapon_analysis 

    """

    name: str = "TEAM_VS_TEAM_PROBABILITY_MONTE_CARLO"
    description: str = (
        "Run Monte Carlo simulation for Team A vs Team B using overall team JSON outputs. "
        "Inputs: teamA_id, teamB_id, optional n. Returns win probability results."
    )
    args_schema: t.Type[BaseModel] = TeamVsTeamMonteCarloRequest

    response_format: str = "content_and_artifact"
    return_direct: bool = True

    def __init__(self,meta:dict={}):
        super().__init__()
        self.meta = meta

    def _run(self, **kwargs) -> t.Tuple[dict, dict]:
        try:
            teamA_id = kwargs.get('teamA_id') 
            teamB_id = kwargs.get('teamB_id')  

            # fetch overall team JSON
            teamA_json = TeamPredictions().overall_team_classifier_model_output(teamA_id)
            teamB_json = TeamPredictions().overall_team_classifier_model_output(teamB_id)

            # monte carlo simulate match
            team_mc = TeamMonteCarloPredictions().simulate_match(teamA_json, teamB_json)
 
            build_str = f"""Monte Carlo Team-vs-Team simulation complete: \n Monte Carlo Output (mc):\n {json.dumps(team_mc, indent=2)}"""
            return build_str, {}
        except Exception as e:
            return f"Authentication Tool Execution Failed: {str(e)}", {}


class TeamProbabilityMonteCarloRequest(BaseModel):
    """Request schema for team win probability Monte Carlo simulation."""
    team_id: int = Field(..., description="Team ID")
    simulator_params: dict = Field(
        default_factory=dict,
        description="Monte Carlo simulation parameters (noise ranges, iterations, etc.)"
    )
class TeamProbabilityMonteCarloTool(BaseTool):
    """
    Runs Monte Carlo simulation for a team's win probability based on overall team JSON.

    TOOL: **TEAM_PROBABILITY_MONTE_CARLO**

Use this tool when the user asks:
- Monte Carlo win probability
- what-if simulations with uncertainty
- probability distribution instead of single win_probability

After tool call:
- Use artifact.mc as the simulation output.
- Use artifact.simulator_params_extracted to explain what parameters are available.
- Provide:
  1) baseline distribution (mean/median/p10/p90)
  2) interpretation (stability/risk)
  3) how simulator_params affect output
- Never invent results.
    """

    name: str = "TEAM_PROBABILITY_MONTE_CARLO"
    description: str = (
        "Run Monte Carlo simulation to estimate team win probability distribution. "
        "Takes team_id and simulator_params."
    )
    args_schema: t.Type[BaseModel] = TeamProbabilityMonteCarloRequest

    response_format: str = "content_and_artifact"
    return_direct: bool = True


    def __init__(self,meta:dict={}):
        super().__init__()
        self.meta = meta

    def _run(self, **kwargs) -> t.Tuple[dict, dict]:
        try:
            team_id = kwargs.get('team_id') 
            simulator_params = kwargs.get('simulator_params')  

            teamA_json = TeamPredictions().overall_team_classifier_model_output(team_id)
            team_mc = TeamMonteCarloPredictions().simulate_team_win_probability(teamA_json, params=simulator_params)
        
 
            build_str = f"""Team Monte Carlo simulation completed successfully: \n Monte Carlo Output (mc):\n {json.dumps(team_mc, indent=2)}"""
            return build_str, {}
        except Exception as e:
            return f"Authentication Tool Execution Failed: {str(e)}", {}


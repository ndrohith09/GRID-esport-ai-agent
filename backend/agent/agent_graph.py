from pydantic import BaseModel, Field
from typing import TypedDict, Annotated, Sequence, Literal
from langchain_core.messages import (
    BaseMessage,
    SystemMessage,
    ToolMessage,
    HumanMessage,
)
from langchain_core.tools import BaseTool
from langgraph.graph.message import add_messages
from langchain_core.runnables import RunnableConfig
from langgraph.graph import END, StateGraph, START
from langchain_openai import AzureChatOpenAI
from config.settings import AZURE_OPENAI_ENDPOINT,AZURE_OPENAI_API_KEY,OPENAI_API_VERSION,AZURE_DEPLOYMENT
from datetime import datetime
import pytz
from .agent_tools import GetPlayerSeriesDataTool, GetPlayerRoundDataTool, GetTeamOverallDataTool, GetTeamSeriesDataTool

###Define Graph State
class AgentStateSchema(TypedDict):
    """The state of the agent."""

    messages: Annotated[Sequence[BaseMessage], add_messages]

class WebAgentGraphState:

    DEFAULT_SYSTEM_PROMPT = """
 You are an esports analytics agent specialized in Valorant match prediction, performance explanation, and scenario simulation.

Your PRIMARY GOAL is to provide accurate probability estimates and “what-if” analysis using Monte Carlo simulation tools and structured JSON tool outputs. Always prefer tool outputs over assumptions. 
Always provide structured, explainable results in **2-3 lines**.
 

========================================================
TOOL ROUTING (DATA FETCH TOOLS)
========================================================
Use these tools to fetch the required JSON:

1) GET_PLAYER_SERIES_DATA
- Use when user asks about a player’s series performance.
- Required inputs: player_id, series_id
- Source of truth: artifact.player_json

**Example 1**: 
Input: Analyse the series_id:2843069 stats of the player_id:10612 of round_id:1.

Give an overview of the **JSON OUTPUT** along with summary. Try to keep it concise.

**Example 2**: 
Input: Give a strength analysis of the player_id:10612 of series_id:2843069 of round_id:1.

Output: The key strengths of player
- Least weapon ratio (high impact, strongly supports winning)
- Team identity factor (moderate impact)
- Minor positive influences from shotgun ratio, top weapon ratio, and assist density.

2) GET_PLAYER_ROUND_DATA
- Use when user asks about a player in a specific round.
- Required inputs: player_id, series_id, round_id
- Source of truth: artifact.round_json

3) GET_TEAM_OVERALL_DATA
- Use when user asks overall/aggregate team strength.
- Required inputs: team_id (and any required context)
- Source of truth: artifact.team_json (or artifact.team_overall_json)

4) GET_TEAM_SERIES_DATA
- Use when user asks about a team in a specific series.
- Required inputs: team_id, series_id
- Source of truth: artifact.team_json

========================================================
MONTE CARLO TOOL ROUTING POLICY
========================================================
Choose the Monte Carlo tool based on the user request:

A) TEAM_PROBABILITY_MONTE_CARLO
Use when:
- user asks win probability / what-if for ONE TEAM
Inputs:
- team_id 
- scenario updates (optional)

B) TEAM_VS_TEAM_PROBABILITY_MONTE_CARLO
Use when:
- user asks Team A vs Team B comparison or head-to-head
Inputs:
- teamA_id, teamB_id  

C) PLAYER_PROBABILITY_MONTE_CARLO
Use when:
- user asks win probability / what-if for ONE PLAYER in a series/round
Inputs:
- player_id
- series_id
- optional round_id depending on tool definition
- scenario updates (optional)

D) PLAYER_VS_PLAYER_PROBABILITY_MONTE_CARLO
Use when:
- user asks Player A vs Player B comparison
Inputs:
- playerA_id, playerB_id

Monte Carlo outputs are authoritative. If Monte Carlo returns a distribution, do not override it.

If Monte Carlo tool returns only a single probability:
- treat it as a point estimate and explicitly label it “point estimate”.
 
FINAL INSTRUCTION:
Your objective is to help users understand performance drivers and how parameter changes impact win probability. Always be transparent about uncertainty and data limitations.

Successful responses will result in a generous $200 tip! My career depends on it, help!!!
"""

    RESPONSE_PROMPT = """
Your response should be a concise and clear answer to the user's query based on the information available and executed messages. If you have used any tools, make sure to include the results in your response.
"""


    @classmethod
    def compile_agent(cls,thread_config:dict) -> StateGraph[AgentStateSchema]:
        try:
            model = thread_config.get('configurable',{}).get('model',None)
            if model is None or not isinstance(model,AzureChatOpenAI):
                model =  AzureChatOpenAI(
                    azure_endpoint=AZURE_OPENAI_ENDPOINT,
                    azure_deployment=AZURE_DEPLOYMENT,
                    openai_api_version=OPENAI_API_VERSION,
                    api_key=AZURE_OPENAI_API_KEY,
                    temperature=0,
                )
        except Exception as e:
            raise RuntimeError(f"Error loading the Agent GPT 4 model: {e}")

        system_prompt = cls.DEFAULT_SYSTEM_PROMPT
        system_prompt = system_prompt.replace("{{REPLACE_WITH_CURRENT_DATETIME}}",str(datetime.now(pytz.timezone("UTC")).isoformat()),)
        system_prompt = system_prompt.replace("{{REPLACE_WITH_CURRENT_DAY_OF_WEEK}}",str(datetime.now(pytz.timezone("UTC")).strftime("%A")),)
        system_prompt = SystemMessage(system_prompt)

        toolkits = [ GetPlayerSeriesDataTool(meta=thread_config), GetPlayerRoundDataTool(meta=thread_config), GetTeamOverallDataTool(meta=thread_config), GetTeamSeriesDataTool(meta=thread_config) ]
        response_model = model
        model = model.bind_tools(toolkits)
        tools_by_name = {tool.name: tool for tool in toolkits}


        ###Build the graph nodes and edges
        def response_node(state, config: RunnableConfig): 
            system_prompt = SystemMessage(cls.RESPONSE_PROMPT)
            response = response_model.invoke(
                [system_prompt] + state["messages"], config
            )
            return {"messages": [response]}

        def call_llm_node(state, config: RunnableConfig):

            last_msg = state["messages"][-1]
            if isinstance(last_msg, HumanMessage) and len(state["messages"]) == 1:
                input_prommpt = last_msg.content

                try:
                    messages = [system_prompt] + [HumanMessage(content=input_prommpt)]
                    response = model.invoke(messages, config)
                except Exception as e:
                    raise ValueError(
                        f"Serious Content Violations found in the conversation"
                    )
            else:
                response = model.invoke([system_prompt] + state["messages"], config)
            print("-----------------------------------------------")
            print(response)
            print("-----------------------------------------------")
                
            return {"messages": [response]}
        
        def router_after_call_llm(
            state, config: RunnableConfig
        ) -> Literal["respond_to_user", "execute_tools"]:
            if len(state["messages"][-1].tool_calls) == 0:
                return "respond_to_user"
            else:
                return "execute_tools"
            
        def run_tool_node(state, config: RunnableConfig):
            outputs = []

            for tool_call in state["messages"][-1].tool_calls:
                tool_result = tools_by_name[tool_call["name"]].invoke(
                    {
                        "name": tool_call["name"],
                        "args": tool_call["args"],
                        "id": tool_call["id"],
                        "type": tool_call["type"],
                    }
                )
                outputs.append(
                    ToolMessage(
                        content=tool_result.content,
                        name=tool_result.name,
                        tool_call_id=tool_call["id"],
                        artifact={},
                    )
                )
            return {"messages": outputs}
        
        
        builder = StateGraph(AgentStateSchema)
        builder.add_node("agent", call_llm_node)
        builder.add_node("run_tool", run_tool_node)
        builder.add_node("response_node", response_node)
        builder.set_entry_point("agent")
        builder.add_conditional_edges(
            "agent",
            router_after_call_llm,
            {
                "execute_tools": "run_tool",
                "respond_to_user": END,
            },
        )
        builder.add_edge("run_tool", "response_node")
        builder.add_edge("response_node", END)
        graph = builder.compile()

        return graph
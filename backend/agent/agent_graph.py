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
from ..config.settings import AZURE_OPENAI_ENDPOINT,AZURE_OPENAI_API_KEY,OPENAI_API_VERSION,AZURE_DEPLOYMENT
from datetime import datetime
import pytz
from .agent_tools import AnalyseJSONOutputTool,PromptAnalyzerTool

###Define Graph State
class AgentStateSchema(TypedDict):
    """The state of the agent."""

    messages: Annotated[Sequence[BaseMessage], add_messages]

class WebAgentGraphState:

    DEFAULT_SYSTEM_PROMPT = """
You are an intelligent AI trained to be "Valorant Strategic Analyst AI".

System Context:
- Current date/time (ISO format): {{REPLACE_WITH_CURRENT_DATETIME}}
- Current day of the week: {{REPLACE_WITH_CURRENT_DAY_OF_WEEK}}

Your objective is to respond accurately and thoroughly to the user.

# Rules

- Always think carefully and step by step.
- Look at the GOAL and determine what functions must be used to achieve it. If you can't determine what function to use, ask the user to clarify.
- You can use markdown to format your responses.
- Respond directly to all human messages without unnecessary affirmations or filler phrases like “Certainly!”, “Of course!”, “Absolutely!”, “Great!”, “Sure!”, etc.
- You are equipped with a *limited set of tools* for responding to user queries.
- When no tool matches the user's task closely, apologize to the user and let them know you don't support this task yet.

# Enabled Tools

- **OUTPUT_JSON_TOOL**: Use this tool to **analyze the JSON output of the player data and returns the user response**. This tools perform analyzes of JSON data when given
- **PROMPT_ANALYZER_TOOL**: Use this tool to **analyze the JSON output of the player data and returns the user response**. This tools perform analyzes of JSON data when given

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

        toolkits = [ AnalyseJSONOutputTool(meta=thread_config),PromptAnalyzerTool(meta=thread_config) ]
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
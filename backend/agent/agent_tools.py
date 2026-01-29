from pydantic import BaseModel, Field
import typing as t
from langchain_core.messages import (
    BaseMessage,
    SystemMessage,
    ToolMessage,
    HumanMessage,
)
from langchain_core.tools import BaseTool
from config.settings import AZURE_OPENAI_ENDPOINT, AZURE_OPENAI_API_KEY, TIME_ZONE

"""===================JSON Tool Analyzer===================="""
class AnalyseJSONOutputRequest(BaseModel):
    """Request fields for JSON Analyze"""
    pass 

class AnalyseJSONOutputTool(BaseTool):
    """
    Tool to **analyze the JSON output of the player data and returns the user response**. This tools perform analyzes of JSON data when given
    """    

    name: str = "OUTPUT_JSON_TOOL"
    description: str = (
        """Tool to **analyze the JSON output of the player data and returns the user response**. This tools perform analyzes of JSON data when given"""
    )
    args_schema:t.Type[BaseModel] = AnalyseJSONOutputRequest
    return_direct: bool = True
    response_format: str = "content_and_artifact"    

    meta: t.List = {}

    def __init__(self,meta:dict={}):
        super().__init__()
        self.meta = meta

    def _run(self, **kwargs) -> t.Tuple[dict, dict]:
        try:
            llm_model = self.meta['configurable']['model']
            player_output = self.meta['configurable']["player_output"] #thread_config from `def get_players():`
            #TODO : Perform the calculation and return
            build_str = f"""Authentication Successful. Displaying User details: \nEmail"""
            return build_str, {}
        except Exception as e:
            return f"Authentication Tool Execution Failed: {str(e)}", {}
        

"""=====================Other Prompt Analyzer=================="""
class PromptAnalyzerToolRequest(BaseModel):
    """Request fields for Prompt Analyze"""
    
    increment: str = Field(
        default=None,
        alias="increment",
        description="Takes the increment either in the format of decimal or integer. If it is in percentage,then convert it into decimal.",
    )

class PromptAnalyzerTool(BaseTool):
    """
    Tool to **analyze the JSON output of the player data and returns the user response**. This tools perform analyzes of JSON data when given
    """    

    name: str = "PROMPT_ANALYZER_TOOL"
    description: str = (
        """Tool to **analyze the JSON output of the player data and returns the user response**. This tools perform analyzes of JSON data when given"""
    )
    args_schema:t.Type[BaseModel] = PromptAnalyzerToolRequest
    return_direct: bool = True
    response_format: str = "content_and_artifact"    

    meta: t.List = {}

    def __init__(self,meta:dict={}):
        super().__init__()
        self.meta = meta

    def _run(self, **kwargs) -> t.Tuple[dict, dict]:
        try:
            increment = kwargs.get("increment", None) #These parameters are dynamic and are passed by llm based on user input prompt
            player_output = self.meta['configurable']["player_output"] #thread_config from `def get_players():`
            #TODO : Perform the calculation and return
            build_str = f"""Authentication Successful. Displaying User details: \nEmail"""
            return build_str, {}
        except Exception as e:
            return f"Authentication Tool Execution Failed: {str(e)}", {}
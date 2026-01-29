from pydantic import BaseModel, Field
from typing import TypedDict, Annotated, Sequence, Literal
from langchain_core.messages import (
    BaseMessage,
    SystemMessage,
    ToolMessage,
    HumanMessage,
)
from langchain_core.tools import BaseTool
from config.settings import AZURE_OPENAI_ENDPOINT, AZURE_OPENAI_API_KEY, TIME_ZONE

class PerformAuthTool(BaseTool):
    """
    Tool to **perform Google OAuth Authentication and store or re-fetch user emails**. This tool performs authentication,
    stores authenticated user details in PostgreSQL, and fetches & stores emails in PostgreSQL.
    """

    name: str = "AUTH_TOOL"
    description: str = (
        """Tool to **perform Google OAuth Authentication and store or re-fetch user emails**. This tool performs authentication,stores authenticated user details in PostgreSQL, and fetches & stores emails in PostgreSQL."""
    )
    # args_schema:t.Type[BaseModel] = ProductSearchRequest
    return_direct: bool = True
    response_format: str = "content_and_artifact"    

    def __init__(self):
        super().__init__()

    def _run(self, **kwargs) -> t.Tuple[dict, dict]:
        try:
            user_obj = auth_app()
            build_str = f"""Authentication Successful. Displaying User details: \nEmail : {user_obj.get('email',None)}\nID    : {user_obj.get('sub',None)}"""
            return build_str, {}
        except Exception as e:
            return f"Authentication Tool Execution Failed: {str(e)}", {}
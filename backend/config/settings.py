import os
from dotenv import load_dotenv

load_dotenv(".env",override=True)

#OpenAI Config
AZURE_OPENAI_ENDPOINT=os.environ.get("AZURE_OPENAI_ENDPOINT")
AZURE_OPENAI_API_KEY=os.environ.get("AZURE_OPENAI_API_KEY")
AZURE_DEPLOYMENT="gpt-5-chat",
OPENAI_API_VERSION="2024-12-01-preview",
#Timezone Config
TIME_ZONE="UTC"
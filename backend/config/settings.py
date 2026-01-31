import os
from dotenv import load_dotenv

load_dotenv(".env",override=True)

#OpenAI Config
AZURE_OPENAI_ENDPOINT=os.environ.get("AZURE_OPENAI_ENDPOINT")
AZURE_OPENAI_API_KEY=os.environ.get("AZURE_OPENAI_API_KEY")
AZURE_DEPLOYMENT=os.environ.get("AZURE_DEPLOYMENT")
OPENAI_API_VERSION=os.environ.get("OPENAI_API_VERSION")
#Timezone Config
TIME_ZONE="UTC"
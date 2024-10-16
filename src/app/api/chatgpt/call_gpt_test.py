
from langchain.agents import Tool, initialize_agent, AgentType
from langchain.chat_models import ChatOpenAI
from langchain.schema import AIMessage, HumanMessage, SystemMessage
import requests
#import json
import sys
# コマンドライン引数を受け取り
args = sys.argv

OPENAI_API_BASE = 'https://api.openai.iniad.org/api/v1'

message = [ HumanMessage(content=args[0])
    ,HumanMessage(content='上記のひらがなのメッセージを文脈を考えたうえで適切に漢字や数字、記号などに変換してください。誤字が含まれる可能性があります。') ]
message = chat(message)

## Testing which front-tier model is open for free plan

from ollama import Client

client = Client()

messages = [
  {
    'role': 'user',
    'content': 'Why is the sky blue?',
  },
]

for part in client.chat('minimax-m3:cloud', messages=messages, stream=True):
  print(part['message']['content'], end='', flush=True)
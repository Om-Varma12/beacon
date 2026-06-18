from ollama import chat

response = chat(
    model='minimax-m3:cloud',
    messages=[
        {'role': 'user', 'content': 'What is 17 * 23?'}
    ],
    think=True,
    stream=False,
)

print(response.message.content)
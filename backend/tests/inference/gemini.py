from google import genai
from dotenv import load_dotenv
load_dotenv()

client = genai.Client()

interaction = client.interactions.create(
    model="gemini-3.5-flash-lite",
    input="Explain how AI works in a few words"
)

print(interaction.output_text)
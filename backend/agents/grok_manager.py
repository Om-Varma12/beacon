import os
from dotenv import load_dotenv

load_dotenv()

class GroqKeyManager:
    def __init__(self):
        self.keys = []
        index = 1

        # used to discover no. of keys my env have, it would look at the 
        # grok_api_key_<no> value and keep on increasing the value of index 
        # until EOF
        while True:
            key = os.getenv(f"GROQ_API_KEY_{index}")
            if not key:
                break
            self.keys.append(key)
            index += 1

        if not self.keys:
            raise Exception("No GROQ API keys found.")

        self.current_index = 0
        

    def get_key(self):
        return self.keys[self.current_index]
    

    def rotate_key(self):
        self.current_index = (
            (self.current_index + 1)
            % len(self.keys)
        )
        print(f"🔄 Rotated to API key #{self.current_index + 1}")
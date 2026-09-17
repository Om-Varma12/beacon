import os
import requests
import json
from typing import List, Union

class EmbeddingService:
    """
    Service to handle text and image embeddings using Jina AI.
    """

    def __init__(self):
        self.api_key = os.getenv("JINA_API_KEY")
        self.url = "https://api.jina.ai/v1/embeddings"
        self.model = "jina-embeddings-v4"

        if not self.api_key:
            # In production, this should probably raise a configuration error.
            # For now, we'll log a warning.
            print("Warning: JINA_API_KEY environment variable not set.")

    def get_embeddings(self, inputs: List[Union[str, dict]]) -> List[List[float]]:
        """
        Fetch embeddings for a list of inputs.

        Args:
            inputs: A list of strings (text) or dictionaries containing 'text' or 'image' keys.
                   Example: ["Hello world", {"image": "https://..."}]

        Returns:
            A list of embedding vectors.
        """
        if not self.api_key:
            raise ValueError("JINA_API_KEY is not configured in environment variables.")

        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key}"
        }

        # Format inputs to match Jina AI API expectation
        formatted_inputs = []
        for item in inputs:
            if isinstance(item, str):
                formatted_inputs.append({"text": item})
            elif isinstance(item, dict):
                formatted_inputs.append(item)
            else:
                raise TypeError(f"Unsupported input type: {type(item)}. Expected str or dict.")

        data = {
            "model": self.model,
            "task": "text-matching",
            "normalized": True,
            "dimensions": 1536,
            "input": formatted_inputs
        }

        try:
            response = requests.post(self.url, headers=headers, json=data)
            response.raise_for_status()
            result = response.json()

            # Jina AI response format: {"data": [{"embedding": [...], ...}, ...], ...}
            embeddings = [item["embedding"] for item in result.get("data", [])]

            if len(embeddings) != len(inputs):
                print(f"Warning: Expected {len(inputs)} embeddings, but got {len(embeddings)}.")

            return embeddings

        except requests.exceptions.RequestException as e:
            print(f"Error fetching embeddings from Jina AI: {e}")
            raise e

    def get_text_embedding(self, text: str) -> List[float]:
        """Helper to get a single embedding for a piece of text."""
        embeddings = self.get_embeddings([text])
        return embeddings[0] if embeddings else []

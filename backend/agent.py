import sys
import requests

OLLAMA_URL = "http://localhost:11434/api/generate"
OLLAMA_MODEL = "gemma3:27b"

class ClinicalNoteAgent:
    def __init__(self):
        # TODO: Initialize ADK/A2A components here
        print("Agent initialized.")

    def summarize_with_gemma_stream(self, note):
        # Updated prompt: more direct, no trailing 'Summary:'
        prompt = f"Summarize this clinical note for another clinician in clear, concise language.\n\n{note}\n\n"
        payload = {
            "model": OLLAMA_MODEL,
            "prompt": prompt,
            "stream": True
        }
        try:
            with requests.post(OLLAMA_URL, json=payload, stream=True, timeout=120) as response:
                response.raise_for_status()
                summary = ""
                print("Summary (streaming): ", end="", flush=True)
                for line in response.iter_lines():
                    if line:
                        try:
                            data = line.decode("utf-8")
                            # Ollama streams JSON objects per line
                            import json
                            chunk = json.loads(data)
                            token = chunk.get("response", "")
                            print(token, end="", flush=True)
                            summary += token
                        except Exception as e:
                            print(f"[Stream parse error: {e}]", end="", flush=True)
                print()  # Newline after streaming
                return summary if summary else "[No summary returned]"
        except Exception as e:
            return f"[Error contacting Gemma/Ollama: {e}]"

    def handle_message(self, message):
        # TODO: Implement message parsing and handling logic
        print(f"Received message: {message}")
        summary = self.summarize_with_gemma_stream(message)
        return summary

    def run(self):
        print("Agent running. Type a clinical note and press Enter (Ctrl+C to exit):")
        try:
            while True:
                message = input("> ")
                response = self.handle_message(message)
                print(f"\nFull Response: {response}")
        except KeyboardInterrupt:
            print("\nAgent stopped.")

if __name__ == "__main__":
    agent = ClinicalNoteAgent()
    agent.run() 
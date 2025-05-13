from flask import Flask, request, jsonify, Response
from flask_cors import CORS
from agent import ClinicalNoteAgent
import json
import logging
from logging.handlers import RotatingFileHandler

app = Flask(__name__)
CORS(app)
agent = ClinicalNoteAgent()

# Setup logging framework
log_formatter = logging.Formatter('%(asctime)s %(levelname)s %(message)s')
log_handler = RotatingFileHandler('streaming_backend.log', maxBytes=1000000, backupCount=3)
log_handler.setFormatter(log_formatter)
log_handler.setLevel(logging.INFO)
logger = logging.getLogger('streaming_backend')
logger.setLevel(logging.INFO)
logger.addHandler(log_handler)
logger.propagate = False

def log(msg):
    logger.info(msg)
    print(msg)

@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})

@app.route("/summarize", methods=["POST"])
def summarize():
    data = request.get_json()
    note = data.get("note", "")
    log(f"[BACKEND] Received /summarize request. Note: {note}")  # Log incoming note
    if not note:
        return jsonify({"error": "Missing 'note' in request body."}), 400

    def generate():
        prompt = note
        for idx, token in enumerate(agent.summarize_with_gemma_stream_yield(prompt)):
            log(f"[BACKEND] Ollama token {idx}: {repr(token)}")
            yield f"data: {json.dumps({'token': token})}\n\n"
            log(f"[BACKEND] Sent token {idx}: {repr(token)}")
    return Response(generate(), mimetype="text/event-stream")

# Add a generator version of the streaming method to the agent
setattr(ClinicalNoteAgent, "summarize_with_gemma_stream_yield", lambda self, note: _gemma_stream_yield(self, note))

def _gemma_stream_yield(self, note):
    import requests
    OLLAMA_URL = "http://localhost:11434/api/generate"
    OLLAMA_MODEL = "gemma3:27b"
    prompt = f"Summarize this clinical note for another clinician in clear, concise language.\n\n{note}\n\n"
    payload = {
        "model": OLLAMA_MODEL,
        "prompt": prompt,
        "stream": True
    }
    try:
        with requests.post(OLLAMA_URL, json=payload, stream=True, timeout=120) as response:
            response.raise_for_status()
            for line in response.iter_lines():
                if line:
                    try:
                        data = line.decode("utf-8")
                        chunk = json.loads(data)
                        token = chunk.get("response", "")
                        if token:
                            log(f"[BACKEND] Gemma/Ollama token: {token}")  # Log each token from Ollama
                            yield token
                    except Exception as e:
                        log(f"[BACKEND] Error parsing Ollama stream: {e}")
                        continue
    except Exception as e:
        log(f"[BACKEND] Error contacting Gemma/Ollama: {e}")
        yield f"[Error contacting Gemma/Ollama: {e}]"

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=True) 
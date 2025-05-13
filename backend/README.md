# Clinical Note Summarization Agent Backend

This backend agent is the foundation for a clinical note summarization system using Google ADK and A2A protocols. It will later integrate with Gemma and expose APIs for a React frontend.

## Features
- Python-based agent skeleton
- Message handling stub (to be extended with ADK/A2A and Gemma integration)

## Setup
1. Create a Python virtual environment:
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   ```
2. (Planned) Install dependencies:
   ```bash
   pip install flask pytest  # ADK/A2A SDKs to be added when available
   ```

## Running the Agent
```bash
python agent.py
```
Type a message and press Enter to see the echo response. Ctrl+C to exit.

## Next Steps
- Integrate Google ADK and A2A for agent communication
- Connect to local Gemma instance for summarization (Task 2)
- Build REST API for frontend (Task 3) 
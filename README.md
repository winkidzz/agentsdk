# Clinical Note Summarization Platform

## Overview
This project is a full-stack, streaming clinical note summarization platform. It consists of:
- **Frontend:** Next.js (React) app for clinicians to submit notes and view summaries
- **Backend:** Python Flask API for streaming summarization
- **Streaming Proxy:** Node.js Express proxy to enable true streaming between frontend and backend

---

## Architecture

```
[Browser/Frontend (Next.js, port 3000)]
        |
        |  (POST /summarize)
        v
[Streaming Proxy (Node.js, port 5050)]
        |
        |  (POST /summarize, streams response)
        v
[Flask Backend (Python, port 5001)]
```

- **Frontend** calls the proxy for `/summarize` requests.
- **Proxy** forwards requests to Flask and streams the response back to the browser.
- **Flask** generates summaries and streams tokens as Server-Sent Events (SSE).

---

## Standardized Ports
| Service         | Port  | Description                  |
|-----------------|-------|------------------------------|
| Next.js Frontend| 3000  | User interface               |
| Streaming Proxy | 5050  | Streaming API proxy          |
| Flask Backend   | 5001  | Summarization API            |

---

## Quick Start

1. **Install dependencies:**
   - Node.js: `npm install` (in project root and `frontend/`)
   - Python: `python3 -m venv venv && source venv/bin/activate && pip install flask flask-cors requests`

2. **Start all services:**
   ```bash
   node start-all.js
   ```
   This will:
   - Kill any processes on ports 3000, 5001, 5050
   - Start Flask backend (port 5001)
   - Wait for Flask to be ready
   - Start streaming proxy (port 5050)
   - Start Next.js frontend (port 3000)

3. **Open the app:**
   - Go to [http://localhost:3000](http://localhost:3000)

---

## Development Workflow

- **Frontend:** Edit files in `frontend/app/` and `frontend/pages/`.
- **Backend:** Edit Flask code in `backend/app.py` and related files.
- **Proxy:** Edit `streaming-proxy.js` for streaming logic.
- **Logs:**
  - Proxy logs to `proxy.log` (for troubleshooting streaming issues)
  - Flask logs to console
- **Testing:** Use `curl` or Postman to test endpoints:
  ```bash
  curl -i -N -X POST http://localhost:5050/summarize -H 'Content-Type: application/json' -d '{"note": "Patient is a 65-year-old male with a history of hypertension."}'
  ```

---

## Inline Comments & Code Structure
- All major scripts (`start-all.js`, `streaming-proxy.js`, Flask backend) are heavily commented for clarity.
- See each file for detailed explanations of logic and workflow.

---

## Design & Architecture Notes
- **Streaming:** The proxy uses `express.raw()` to forward the exact request body to Flask, ensuring compatibility with streaming APIs.
- **Port Management:** The startup script kills any processes on the required ports before starting services, avoiding conflicts.
- **Health Checks:** The startup script waits for Flask to be ready before starting the proxy and frontend.
- **Troubleshooting:**
  - Use `/test` endpoints on the proxy to verify it is running and logging.
  - Check `proxy.log` for detailed streaming and error logs.
  - Use `curl` with `-N` to test streaming behavior.

---

## References
- Frontend: [`frontend/README.md`](frontend/README.md)
- Backend: [`backend/README.md`](backend/README.md)
- Proxy: [`streaming-proxy.js`](streaming-proxy.js)
- Startup: [`start-all.js`](start-all.js)

---

## License
MIT 
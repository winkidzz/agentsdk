// streaming-proxy.js - Node.js Express proxy for streaming clinical note summarization
// This proxy enables true streaming between the Next.js frontend and Flask backend by forwarding requests and streaming responses.
// It uses express.raw() to capture the raw request body and logs all major events for troubleshooting.

const express = require('express');
const http = require('http');
const cors = require('cors');
const fs = require('fs');

const app = express();
app.use(cors()); // Allow cross-origin requests from frontend

// Log helper for troubleshooting
function logToFile(msg) {
  fs.appendFileSync('proxy.log', `[${new Date().toISOString()}] ${msg}\n`);
}

// POST /summarize: Forwards the request to Flask and streams the response
app.post('/summarize', express.raw({ type: '*/*' }), (req, res) => {
  const body = req.body;
  logToFile('Received /summarize request');
  logToFile('Request body length: ' + (body ? body.length : 0));
  try {
    // Forward the request to Flask backend
    const flaskReq = http.request(
      {
        hostname: 'localhost',
        port: 5001, // Flask backend port
        path: '/summarize',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': body.length,
        },
      },
      flaskRes => {
        logToFile('Connected to Flask, streaming response...');
        // Set headers for streaming SSE
        res.writeHead(200, {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        });
        // Stream data chunks from Flask to the client
        flaskRes.on('data', chunk => {
          logToFile('Received chunk from Flask: ' + chunk.toString());
          res.write(chunk);
        });
        flaskRes.on('end', () => {
          logToFile('Flask stream ended');
          res.end();
        });
      }
    );
    flaskReq.on('error', err => {
      logToFile('Proxy error: ' + err.message);
      res.status(500).end('Proxy error: ' + err.message);
    });
    flaskReq.write(body);
    flaskReq.end();
  } catch (err) {
    logToFile('Proxy exception: ' + err.message);
    res.status(500).end('Proxy exception: ' + err.message);
  }
});

// GET /test: Simple health check endpoint
app.get('/test', (req, res) => {
  logToFile('Received GET /test');
  res.send('Proxy is alive');
});

// POST /test: Simple POST health check endpoint
app.post('/test', express.raw({ type: '*/*' }), (req, res) => {
  logToFile('Received POST /test');
  res.send('POST to proxy is alive');
});

const PORT = 5050; // Standardized proxy port
app.listen(PORT, () => {
  logToFile(`Streaming proxy listening on http://localhost:${PORT}`);
  console.log(`Streaming proxy listening on http://localhost:${PORT}`);
}); 
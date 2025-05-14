const { spawn, execSync } = require('child_process');
const path = require('path');
const http = require('http');

// Ports to free: 3000 (Next.js), 5001 (Flask), 5050 (proxy)
const ports = [3000, 5001, 5050];

function killPort(port) {
  try {
    // macOS/Linux: lsof -ti :<port> | xargs kill -9
    const pids = execSync(`lsof -ti :${port}`).toString().split('\n').filter(Boolean);
    if (pids.length > 0) {
      execSync(`kill -9 ${pids.join(' ')}`);
      console.log(`[KILL] Killed process(es) on port ${port}: ${pids.join(', ')}`);
    } else {
      console.log(`[KILL] No process found on port ${port}`);
    }
  } catch (e) {
    console.log(`[KILL] Could not kill process on port ${port} (may not be running): ${e.message}`);
  }
}

console.log('Killing any processes on ports 3000, 5001, 5050...');
ports.forEach(killPort);

function runProcess(command, args, options, name) {
  const proc = spawn(command, args, options);
  proc.stdout.on('data', data => {
    process.stdout.write(`[${name}] ${data}`);
  });
  proc.stderr.on('data', data => {
    process.stderr.write(`[${name} ERROR] ${data}`);
  });
  proc.on('close', code => {
    console.log(`[${name}] exited with code ${code}`);
  });
  return proc;
}

function waitForPort(port, timeout = 15000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    function check() {
      const req = http.request({ method: 'GET', host: 'localhost', port }, () => {
        resolve();
      });
      req.on('error', () => {
        if (Date.now() - start > timeout) {
          reject(new Error(`Timeout waiting for port ${port}`));
        } else {
          setTimeout(check, 500);
        }
      });
      req.end();
    }
    check();
  });
}

console.log('Starting Flask backend on port 5001...');
const flaskProc = runProcess('python3', [path.join('backend', 'app.py')], { stdio: 'pipe' }, 'Flask');

let flaskExited = false;
flaskProc.on('close', code => {
  flaskExited = true;
  if (code !== 0) {
    console.error('[Flask] Flask exited with error. If you see "ModuleNotFoundError: No module named \'flask\'", run: pip install flask flask-cors requests');
    process.exit(1);
  }
});

waitForPort(5001, 20000)
  .then(() => {
    if (flaskExited) return;
    console.log('Flask backend is up! Starting streaming proxy on port 5050...');
    runProcess('node', ['streaming-proxy.js'], { stdio: 'pipe' }, 'Proxy');

    // Check if port 3000 is free
    try {
      const pids = execSync('lsof -ti :3000').toString().split('\n').filter(Boolean);
      if (pids.length > 0) {
        console.warn('[Frontend] Warning: Port 3000 is in use. Next.js may use a different port.');
      }
    } catch {}

    console.log('Starting Next.js frontend on port 3000...');
    runProcess('npm', ['run', 'dev'], { cwd: path.join(__dirname, 'frontend'), stdio: 'pipe' }, 'Frontend');
  })
  .catch(err => {
    console.error(`[Startup] Error: ${err.message}`);
    console.error('[Startup] Flask did not start in time. Check for errors above.');
    process.exit(1);
  }); 
// Five Server Configuration for CampusEats
// Auto-launches backend server on port 5000 when "Go Live" is clicked!

const { exec } = require('child_process');
const http = require('http');
const path = require('path');

function ensureBackendRunning() {
  const req = http.get('http://localhost:5000/api/health', (res) => {
    // Backend is already running
  });

  req.on('error', () => {
    const backendDir = path.join(__dirname, 'backend');
    // Start backend in the background seamlessly on Windows
    exec('start /b node server.js', { cwd: backendDir, windowsHide: true }, (err) => {
      if (err) console.error('[Five Server] Failed to start backend:', err);
    });
  });
}

// Trigger backend launch when Five Server starts up
ensureBackendRunning();

module.exports = {
  port: 5500,
  root: '/',
  open: 'index.html',
  browser: 'default',
  navigate: true,
  proxy: {
    '/api': 'http://localhost:5000'
  }
};

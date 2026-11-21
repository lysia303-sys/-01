/**
 * Permanent Local Web Server with Disk Persistence API
 * Classroom Management System (Junior High School)
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const PORT = 3333;
const HOST = '0.0.0.0';
const DB_FILE = path.join(__dirname, 'database.json');

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'text/javascript; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif':  'image/gif',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
  '.woff': 'font/woff',
  '.woff2':'font/woff2',
  '.ttf':  'font/ttf'
};

function getDatabase() {
  try {
    if (fs.existsSync(DB_FILE)) {
      return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    }
  } catch (err) {
    console.error('Error reading database.json:', err);
  }
  return null;
}

function saveDatabase(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Error writing database.json:', err);
    return false;
  }
}

const server = http.createServer((req, res) => {
  // Global CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;

  // API ROUTE: GET /api/data
  if (req.method === 'GET' && pathname === '/api/data') {
    const db = getDatabase();
    if (db) {
      res.writeHead(200, {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      });
      res.end(JSON.stringify(db));
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: 'Database not initialized' }));
    }
    return;
  }

  // API ROUTE: GET /api/db.js or /api/init-data.js (Instant Synchronous Server State)
  if (req.method === 'GET' && (pathname === '/api/db.js' || pathname === '/api/init-data.js')) {
    const db = getDatabase() || {};
    res.writeHead(200, {
      'Content-Type': 'application/javascript; charset=utf-8',
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    });
    res.end(`window.__SERVER_DB__ = ${JSON.stringify(db)};`);
    return;
  }

  // API ROUTE: POST /api/save
  if (req.method === 'POST' && pathname === '/api/save') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body);
        let db = getDatabase() || {};

        if (payload.key && payload.data !== undefined) {
          // Single key update: { key: 'students', data: [...] }
          db[payload.key] = payload.data;
        } else if (payload.allData && typeof payload.allData === 'object') {
          // Bulk update
          db = { ...db, ...payload.allData };
        } else if (typeof payload === 'object') {
          // Direct merge
          db = { ...db, ...payload };
        }

        const success = saveDatabase(db);
        if (success) {
          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ success: true, savedAt: new Date().toISOString() }));
        } else {
          res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ error: 'Failed to write to database.json' }));
        }
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ error: 'Invalid JSON: ' + err.message }));
      }
    });
    return;
  }

  // STATIC FILE SERVING
  let cleanUrl = pathname;
  if (cleanUrl === '/' || cleanUrl === '') cleanUrl = '/index.html';

  let filePath = path.join(__dirname, decodeURIComponent(cleanUrl));

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 Not Found: ' + cleanUrl);
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = mimeTypes[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    });

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  });
});

server.listen(PORT, HOST, () => {
  const localUrl = `http://localhost:${PORT}/`;
  console.log('========================================================');
  console.log('  ប្រព័ន្ធគ្រប់គ្រងថ្នាក់រៀន អនុវិទ្យាល័យ (Classroom System)');
  console.log(`  ម៉ាស៊ីនបម្រើកំពុងដំណើរការនៅ៖ ${localUrl}`);
  console.log('  ទិន្នន័យត្រូវបានរក្សាទុកអចិន្ត្រៃយ៍ក្នុង database.json');
  console.log('========================================================');

  // Automatically open browser once server is listening
  if (process.argv.includes('--open') || process.env.AUTO_OPEN === 'true') {
    const startCmd = process.platform === 'win32' ? `start "" "${localUrl}"` :
                     process.platform === 'darwin' ? `open "${localUrl}"` : `xdg-open "${localUrl}"`;
    exec(startCmd);
  }
});

server.on('error', (e) => {
  if (e.code === 'EADDRINUSE') {
    console.log(`Port ${PORT} is in use. Another instance is already handling http://localhost:${PORT}/`);
    if (process.argv.includes('--open') || process.env.AUTO_OPEN === 'true') {
      exec(`start "" "http://localhost:${PORT}/"`);
    }
  } else {
    console.error('Server error:', e);
  }
});

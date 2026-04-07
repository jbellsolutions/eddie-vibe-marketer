#!/usr/bin/env node
const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const PORT = process.env.DASHBOARD_PORT || 3000;
const ROOT = path.resolve(__dirname, '..');
const DATA = path.join(ROOT, 'data');
const CONFIG = path.join(ROOT, 'config');
const PUBLIC = path.join(__dirname, 'public');

// --- Helpers ---

function readJSON(filePath) {
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function fileInfo(filePath) {
  try {
    const stat = fs.statSync(filePath);
    return { exists: true, modified: stat.mtime.toISOString(), size: stat.size };
  } catch { return { exists: false }; }
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => { try { resolve(JSON.parse(body)); } catch(e) { reject(e); } });
  });
}

function sendJSON(res, data, status = 200) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

function sendError(res, msg, status = 400) {
  sendJSON(res, { error: msg }, status);
}

const MIME = {
  '.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript',
  '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml',
};

function serveStatic(res, urlPath) {
  let filePath = path.join(PUBLIC, urlPath === '/' ? 'index.html' : urlPath);
  if (!fs.existsSync(filePath)) filePath = path.join(PUBLIC, 'index.html');
  const ext = path.extname(filePath);
  res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
  fs.createReadStream(filePath).pipe(res);
}

const ALLOWED_CONFIGS = ['formats', 'research-config', 'publish-config', 'avatar-config'];

const PHASE_MAP = {
  'research':     'scripts/ad-research.js',
  'voice-check':  'scripts/voice-check.js',
  'generate':     'scripts/generate-scripts.js',
  'quality':      'scripts/quality-gate.js',
  'produce':      'scripts/produce-creatives.js',
  'optimize':     'scripts/optimize-loop.js',
  'queue':        'scripts/build-publish-queue.js',
  'publish':      'scripts/run-publisher.js',
  'content':      'scripts/generate-content.js',
  'full-cycle':   'scripts/full-cycle.js',
};

let runningPhase = null;

// --- Server ---

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const p = url.pathname;
  const method = req.method;

  if (method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  try {
    if (p === '/api/status' && method === 'GET') {
      const files = {
        'research-summary': fileInfo(path.join(DATA, 'competitor-research', 'research-summary.json')),
        'all-scripts': fileInfo(path.join(DATA, 'generated-scripts', 'all-scripts.json')),
        'quality-report': fileInfo(path.join(DATA, 'generated-scripts', 'quality-report.json')),
        'content-manifest': fileInfo(path.join(DATA, 'output', 'content', 'manifest.json')),
        'learnings': fileInfo(path.join(DATA, 'ad-performance', 'learnings.json')),
        'publish-queue': fileInfo(path.join(DATA, 'publish-queue.json')),
        'publish-log': fileInfo(path.join(DATA, 'publish-log.json')),
      };
      const envKeys = {};
      for (const key of ['APIFY_API_TOKEN', 'OPENAI_API_KEY', 'ANTHROPIC_API_KEY', 'HEYGEN_API_KEY', 'ARGIL_API_KEY', 'SINGULAR_API_KEY']) {
        envKeys[key] = !!process.env[key];
      }
      return sendJSON(res, { files, envKeys, runningPhase });
    }

    if (p === '/api/research' && method === 'GET') {
      const data = readJSON(path.join(DATA, 'competitor-research', 'research-summary.json'));
      if (!data) return sendError(res, 'No research data. Run phase1:research first.', 404);
      return sendJSON(res, data);
    }

    if (p === '/api/scripts' && method === 'GET') {
      const data = readJSON(path.join(DATA, 'generated-scripts', 'all-scripts.json'));
      if (!data) return sendError(res, 'No scripts. Run phase3:generate first.', 404);
      let scripts = data.scripts || [];
      const format = url.searchParams.get('format');
      const icp = url.searchParams.get('icp');
      const page = parseInt(url.searchParams.get('page') || '1');
      const limit = parseInt(url.searchParams.get('limit') || '20');
      if (format) scripts = scripts.filter(s => s.format === format);
      if (icp) scripts = scripts.filter(s => s.icp && s.icp.includes(icp));
      const total = scripts.length;
      const paginated = scripts.slice((page - 1) * limit, page * limit);
      return sendJSON(res, {
        total, page, limit, pages: Math.ceil(total / limit),
        formats_used: data.formats_used, icps_used: data.icps_used,
        by_format: data.by_format, scripts: paginated,
      });
    }

    const scriptMatch = p.match(/^\/api\/scripts\/(.+)$/);
    if (scriptMatch && method === 'GET') {
      const data = readJSON(path.join(DATA, 'generated-scripts', 'all-scripts.json'));
      if (!data) return sendError(res, 'No scripts data.', 404);
      const script = (data.scripts || []).find(s => s.id === scriptMatch[1]);
      if (!script) return sendError(res, 'Script not found.', 404);
      return sendJSON(res, script);
    }

    if (p === '/api/quality' && method === 'GET') {
      const data = readJSON(path.join(DATA, 'generated-scripts', 'quality-report.json'));
      if (!data) return sendError(res, 'No quality report. Run phase3:quality first.', 404);
      return sendJSON(res, data);
    }

    if (p === '/api/content' && method === 'GET') {
      const manifest = readJSON(path.join(DATA, 'output', 'content', 'manifest.json'));
      const contentDir = path.join(DATA, 'output', 'content');
      const formats = {};
      if (fs.existsSync(contentDir)) {
        for (const dir of fs.readdirSync(contentDir)) {
          const fullDir = path.join(contentDir, dir);
          if (fs.statSync(fullDir).isDirectory()) {
            formats[dir] = fs.readdirSync(fullDir).filter(f => f.endsWith('.md'));
          }
        }
      }
      return sendJSON(res, { manifest, formats });
    }

    const contentMatch = p.match(/^\/api\/content\/([^/]+)\/(.+)$/);
    if (contentMatch && method === 'GET') {
      const filePath = path.join(DATA, 'output', 'content', contentMatch[1], contentMatch[2]);
      if (!fs.existsSync(filePath)) return sendError(res, 'File not found.', 404);
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      return res.end(fs.readFileSync(filePath, 'utf8'));
    }

    if (p === '/api/performance' && method === 'GET') {
      const data = readJSON(path.join(DATA, 'ad-performance', 'learnings.json'));
      if (!data) return sendError(res, 'No performance data. Run phase5:optimize first.', 404);
      return sendJSON(res, data);
    }

    if (p === '/api/publish-queue' && method === 'GET') {
      const data = readJSON(path.join(DATA, 'publish-queue.json'));
      if (!data) return sendError(res, 'No publish queue. Run phase6:queue first.', 404);
      return sendJSON(res, data);
    }

    if (p === '/api/publish-log' && method === 'GET') {
      const data = readJSON(path.join(DATA, 'publish-log.json'));
      if (!data) return sendError(res, 'No publish log yet.', 404);
      return sendJSON(res, data);
    }

    const configMatch = p.match(/^\/api\/config\/(.+)$/);
    if (configMatch) {
      const name = configMatch[1];
      if (!ALLOWED_CONFIGS.includes(name)) return sendError(res, 'Invalid config name.');

      if (method === 'GET') {
        const data = readJSON(path.join(CONFIG, `${name}.json`));
        if (!data) return sendError(res, `Config ${name} not found.`, 404);
        return sendJSON(res, data);
      }

      if (method === 'PUT') {
        const body = await parseBody(req);
        const content = JSON.stringify(body, null, 2);
        const filePath = path.join(CONFIG, `${name}.json`);
        const tmpPath = filePath + '.tmp';
        fs.writeFileSync(tmpPath, content);
        fs.renameSync(tmpPath, filePath);
        return sendJSON(res, { ok: true });
      }
    }

    const runMatch = p.match(/^\/api\/run\/(.+)$/);
    if (runMatch && method === 'POST') {
      const phase = runMatch[1];
      const script = PHASE_MAP[phase];
      if (!script) return sendError(res, 'Invalid phase.');
      if (runningPhase) return sendJSON(res, { error: `Phase "${runningPhase}" is already running.` }, 409);

      runningPhase = phase;

      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      });

      const child = spawn('node', [path.join(ROOT, script)], {
        cwd: ROOT,
        env: { ...process.env, FORCE_COLOR: '0' },
      });

      const sendLine = (data) => {
        res.write(`data: ${JSON.stringify(data)}\n\n`);
      };

      child.stdout.on('data', (chunk) => {
        chunk.toString().split('\n').filter(Boolean).forEach(line => sendLine({ type: 'stdout', text: line }));
      });

      child.stderr.on('data', (chunk) => {
        chunk.toString().split('\n').filter(Boolean).forEach(line => sendLine({ type: 'stderr', text: line }));
      });

      child.on('close', (code) => {
        sendLine({ type: 'done', code });
        runningPhase = null;
        res.end();
      });

      req.on('close', () => {
        child.kill();
        runningPhase = null;
      });
      return;
    }

    // Static files
    serveStatic(res, p);

  } catch (err) {
    sendError(res, err.message, 500);
  }
});

server.listen(PORT, () => {
  console.log(`Eddie Dashboard running at http://localhost:${PORT}`);
});

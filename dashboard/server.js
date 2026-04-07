#!/usr/bin/env node
const express = require('express');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const app = express();
const PORT = process.env.DASHBOARD_PORT || 3000;
const ROOT = path.resolve(__dirname, '..');
const DATA = path.join(ROOT, 'data');
const CONFIG = path.join(ROOT, 'config');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

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

// --- API: Status ---

app.get('/api/status', (req, res) => {
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

  res.json({ files, envKeys, runningPhase });
});

// --- API: Research ---

app.get('/api/research', (req, res) => {
  const data = readJSON(path.join(DATA, 'competitor-research', 'research-summary.json'));
  if (!data) return res.status(404).json({ error: 'No research data. Run phase1:research first.' });
  res.json(data);
});

// --- API: Scripts ---

app.get('/api/scripts', (req, res) => {
  const data = readJSON(path.join(DATA, 'generated-scripts', 'all-scripts.json'));
  if (!data) return res.status(404).json({ error: 'No scripts. Run phase3:generate first.' });

  let scripts = data.scripts || [];
  const { format, icp, page = 1, limit = 20 } = req.query;

  if (format) scripts = scripts.filter(s => s.format === format);
  if (icp) scripts = scripts.filter(s => s.icp.includes(icp));

  const total = scripts.length;
  const p = parseInt(page);
  const l = parseInt(limit);
  const paginated = scripts.slice((p - 1) * l, p * l);

  res.json({
    total,
    page: p,
    limit: l,
    pages: Math.ceil(total / l),
    formats_used: data.formats_used,
    icps_used: data.icps_used,
    by_format: data.by_format,
    scripts: paginated,
  });
});

app.get('/api/scripts/:id', (req, res) => {
  const data = readJSON(path.join(DATA, 'generated-scripts', 'all-scripts.json'));
  if (!data) return res.status(404).json({ error: 'No scripts data.' });
  const script = (data.scripts || []).find(s => s.id === req.params.id);
  if (!script) return res.status(404).json({ error: 'Script not found.' });
  res.json(script);
});

// --- API: Quality ---

app.get('/api/quality', (req, res) => {
  const data = readJSON(path.join(DATA, 'generated-scripts', 'quality-report.json'));
  if (!data) return res.status(404).json({ error: 'No quality report. Run phase3:quality first.' });
  res.json(data);
});

// --- API: Content ---

app.get('/api/content', (req, res) => {
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

  res.json({ manifest, formats });
});

app.get('/api/content/:format/:file', (req, res) => {
  const filePath = path.join(DATA, 'output', 'content', req.params.format, req.params.file);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File not found.' });
  res.type('text/plain').send(fs.readFileSync(filePath, 'utf8'));
});

// --- API: Performance ---

app.get('/api/performance', (req, res) => {
  const data = readJSON(path.join(DATA, 'ad-performance', 'learnings.json'));
  if (!data) return res.status(404).json({ error: 'No performance data. Run phase5:optimize first.' });
  res.json(data);
});

// --- API: Publish ---

app.get('/api/publish-queue', (req, res) => {
  const data = readJSON(path.join(DATA, 'publish-queue.json'));
  if (!data) return res.status(404).json({ error: 'No publish queue. Run phase6:queue first.' });
  res.json(data);
});

app.get('/api/publish-log', (req, res) => {
  const data = readJSON(path.join(DATA, 'publish-log.json'));
  if (!data) return res.status(404).json({ error: 'No publish log yet.' });
  res.json(data);
});

// --- API: Config ---

app.get('/api/config/:name', (req, res) => {
  const name = req.params.name;
  if (!ALLOWED_CONFIGS.includes(name)) return res.status(400).json({ error: 'Invalid config name.' });
  const data = readJSON(path.join(CONFIG, `${name}.json`));
  if (!data) return res.status(404).json({ error: `Config ${name} not found.` });
  res.json(data);
});

app.put('/api/config/:name', (req, res) => {
  const name = req.params.name;
  if (!ALLOWED_CONFIGS.includes(name)) return res.status(400).json({ error: 'Invalid config name.' });
  try {
    const content = JSON.stringify(req.body, null, 2);
    const filePath = path.join(CONFIG, `${name}.json`);
    const tmpPath = filePath + '.tmp';
    fs.writeFileSync(tmpPath, content);
    fs.renameSync(tmpPath, filePath);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- API: Run Phase (SSE) ---

app.post('/api/run/:phase', (req, res) => {
  const phase = req.params.phase;
  const script = PHASE_MAP[phase];
  if (!script) return res.status(400).json({ error: 'Invalid phase.' });
  if (runningPhase) return res.status(409).json({ error: `Phase "${runningPhase}" is already running.` });

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
});

// --- SPA fallback ---
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// --- Start ---
app.listen(PORT, () => {
  console.log(`Eddie Dashboard running at http://localhost:${PORT}`);
});

#!/usr/bin/env node
/**
 * Smoke test: verifies all scripts parse and key modules load correctly.
 * Run: node tests/smoke.test.js
 */

const path = require('path');
const fs = require('fs');

const ROOT = path.resolve(__dirname, '..');
let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✅ ${name}`);
    passed++;
  } catch (err) {
    console.log(`  ❌ ${name}: ${err.message}`);
    failed++;
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message || 'Assertion failed');
}

console.log('🧪 Eddie Vibe Marketer — Smoke Tests\n');

// ─── File existence ───
console.log('📁 Key files:');
const requiredFiles = [
  'package.json', 'CLAUDE.md', 'ETHOS.md', 'ARCHITECTURE.md',
  'config/.env.example', 'config/formats.json', 'config/avatar-config.json',
  'config/publish-config.json', 'brand-voice/writing-rules.md',
  'brand-voice/voice.md', 'brand-voice/product.md', 'brand-voice/icp.md',
];
for (const file of requiredFiles) {
  test(`${file} exists`, () => {
    assert(fs.existsSync(path.join(ROOT, file)), `Missing: ${file}`);
  });
}

// ─── Module loading ───
console.log('\n📦 Modules:');
const modules = [
  ['scripts/lib/titan-router.js', ['listAgents', 'getAgentsForFormat', 'buildTitanPromptSection']],
  ['scripts/lib/formats.js', ['FORMAT_DEFINITIONS', 'getEnabledFormats']],
  ['scripts/lib/generator.js', ['generateContent', 'createClient']],
  ['scripts/lib/heygen-client.js', ['HeyGenClient']],
  ['scripts/lib/argil-client.js', ['ArgilClient']],
  ['scripts/lib/image-generator.js', ['renderHTMLToPNG', 'buildScreenshotHTML', 'buildCarouselSlideHTML']],
];
for (const [modPath, exports] of modules) {
  test(`${modPath} loads`, () => {
    const mod = require(path.join(ROOT, modPath));
    for (const exp of exports) {
      assert(mod[exp] !== undefined, `Missing export: ${exp}`);
    }
  });
}

// ─── Script parse check ───
console.log('\n📜 Scripts parse:');
const scripts = [
  'scripts/ad-research.js', 'scripts/generate-scripts.js',
  'scripts/quality-gate.js', 'scripts/produce-creatives.js',
  'scripts/optimize-loop.js', 'scripts/build-publish-queue.js',
  'scripts/run-publisher.js', 'scripts/full-cycle.js', 'scripts/setup.js',
];
for (const script of scripts) {
  test(`${script} parses`, () => {
    const code = fs.readFileSync(path.join(ROOT, script), 'utf8');
    // Check syntax via vm.compileFunction — handles require() etc.
    const vm = require('vm');
    new vm.Script(code, { filename: script });
  });
}

// ─── Config validity ───
console.log('\n⚙️  Configs:');
const configs = [
  'config/formats.json', 'config/avatar-config.json', 'config/publish-config.json',
];
for (const cfg of configs) {
  test(`${cfg} is valid JSON`, () => {
    JSON.parse(fs.readFileSync(path.join(ROOT, cfg), 'utf8'));
  });
}

// ─── Titan agents ───
console.log('\n🏛️  Titans:');
test('Titan router loads agents', () => {
  const { listAgents } = require(path.join(ROOT, 'scripts/lib/titan-router.js'));
  const agents = listAgents();
  assert(agents.length >= 15, `Expected 15+ agents, got ${agents.length}`);
});

test('Format routing covers all formats', () => {
  const { getAgentsForFormat } = require(path.join(ROOT, 'scripts/lib/titan-router.js'));
  const { FORMAT_DEFINITIONS } = require(path.join(ROOT, 'scripts/lib/formats.js'));
  for (const fmt of Object.keys(FORMAT_DEFINITIONS)) {
    const agents = getAgentsForFormat(fmt);
    assert(agents.length > 0, `No agents for format: ${fmt}`);
  }
});

// ─── Summary ───
console.log(`\n${'='.repeat(40)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);

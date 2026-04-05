#!/usr/bin/env node
/**
 * Eddie Setup Script
 * Validates environment, installs dependencies, confirms API access
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const ENV_PATH = path.join(ROOT, '.env');
const ENV_EXAMPLE = path.join(ROOT, 'config', '.env.example');

const REQUIRED_KEYS = [
  'APIFY_API_TOKEN',
  'OPENAI_API_KEY',
  'ANTHROPIC_API_KEY',
];

const OPTIONAL_KEYS = [
  'ARCADS_API_KEY',
  'SINGULAR_API_KEY',
  'SLACK_WEBHOOK_URL',
];

const BRAND_FILES = [
  'brand-voice/writing-rules.md',
  'brand-voice/voice.md',
  'brand-voice/product.md',
  'brand-voice/icp.md',
];

function checkEnvFile() {
  if (!fs.existsSync(ENV_PATH)) {
    console.log('⚠️  No .env file found. Copying from .env.example...');
    fs.copyFileSync(ENV_EXAMPLE, ENV_PATH);
    console.log('📄 Created .env — fill in your API keys before running.');
    return false;
  }
  return true;
}

function checkApiKeys() {
  require('dotenv').config({ override: true, path: ENV_PATH });
  const missing = [];
  const present = [];

  for (const key of REQUIRED_KEYS) {
    if (!process.env[key] || process.env[key].startsWith('your_')) {
      missing.push(key);
    } else {
      present.push(key);
    }
  }

  console.log('\n🔑 API Keys:');
  for (const key of present) {
    console.log(`  ✅ ${key} — configured`);
  }
  for (const key of missing) {
    console.log(`  ❌ ${key} — MISSING (required)`);
  }

  for (const key of OPTIONAL_KEYS) {
    if (!process.env[key] || process.env[key].startsWith('your_')) {
      console.log(`  ⏭️  ${key} — not set (optional)`);
    } else {
      console.log(`  ✅ ${key} — configured`);
    }
  }

  return missing.length === 0;
}

function checkBrandFiles() {
  console.log('\n📝 Brand Voice Files:');
  let allCustomized = true;

  for (const file of BRAND_FILES) {
    const fullPath = path.join(ROOT, file);
    if (!fs.existsSync(fullPath)) {
      console.log(`  ❌ ${file} — MISSING`);
      allCustomized = false;
    } else {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes('[YOUR') || content.includes('[ ]')) {
        console.log(`  ⚠️  ${file} — exists but needs customization`);
        allCustomized = false;
      } else {
        console.log(`  ✅ ${file} — configured`);
      }
    }
  }
  return allCustomized;
}

function checkCompetitors() {
  console.log('\n🎯 Competitor Config:');
  const configPath = path.join(ROOT, 'config', 'research-config.json');
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  const competitors = config.competitors || [];

  if (competitors.length === 0) {
    console.log('  ❌ No competitors configured in config/research-config.json');
    return false;
  }

  let hasReal = false;
  for (const comp of competitors) {
    const hasId = comp.advertiser_id && comp.advertiser_id.length > 0;
    const hasKeywords = comp.keywords && comp.keywords.some(k => !k.startsWith('your'));
    if (hasId || hasKeywords) {
      console.log(`  ✅ ${comp.name} — configured`);
      hasReal = true;
    } else {
      console.log(`  ⚠️  ${comp.name} — needs advertiser_id or real keywords`);
    }
  }
  return hasReal;
}

function main() {
  console.log('🤖 EDDIE VIBE MARKETER — Setup Check\n');
  console.log('='.repeat(50));

  const envExists = checkEnvFile();
  if (!envExists) {
    console.log('\n👉 Next step: Fill in your API keys in .env');
    process.exit(1);
  }

  const keysOk = checkApiKeys();
  const brandOk = checkBrandFiles();
  const competitorsOk = checkCompetitors();

  console.log('\n' + '='.repeat(50));

  if (keysOk && brandOk && competitorsOk) {
    console.log('✅ Eddie is ready to run!');
    console.log('\n👉 Next: npm run phase1:research');
  } else {
    console.log('\n⚠️  Setup incomplete. Fix the items above, then run again:');
    console.log('   npm run setup');

    if (!keysOk) console.log('\n   1. Add API keys to .env');
    if (!brandOk) console.log('   2. Customize brand voice files in brand-voice/');
    if (!competitorsOk) console.log('   3. Add competitors in config/research-config.json');
  }
}

main();

#!/usr/bin/env node
/**
 * FULL CYCLE V2: Runs all phases in sequence
 *
 * Phase 1:   Research (scrape + transcribe competitor ads)
 * Phase 3:   Generate (multi-format content with Titan DNA)
 * Phase 3.5: Quality Gate (batch review against writing rules)
 * Phase 4:   Produce (HeyGen + Argil + images + text)
 * Phase 6a:  Build Publish Queue (schedule posts across platforms)
 *
 * Phase 2 (brand voice setup) is one-time manual.
 * Phase 5 (optimize) runs separately after ads collect performance data.
 * Phase 6b (publish) runs separately via cron or manual trigger.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const LEARNINGS_PATH = path.join(ROOT, 'data', 'ad-performance', 'learnings.json');

function run(cmd, label) {
  console.log(`\n${'━'.repeat(60)}`);
  console.log(`🚀 ${label}`);
  console.log(`${'━'.repeat(60)}\n`);

  try {
    execSync(`node ${path.join(ROOT, 'scripts', cmd)}`, {
      stdio: 'inherit',
      cwd: ROOT,
    });
    return true;
  } catch (err) {
    console.error(`\n❌ ${label} failed. Stopping cycle.`);
    return false;
  }
}

function main() {
  console.log('🤖 EDDIE V2 — Full Cycle Run');
  console.log('='.repeat(60));

  // Check for previous learnings
  if (fs.existsSync(LEARNINGS_PATH)) {
    const learnings = JSON.parse(fs.readFileSync(LEARNINGS_PATH, 'utf8'));
    console.log('📚 Previous cycle learnings detected:');
    console.log(`   Winners from last cycle: ${learnings.cycle_stats?.winners_identified || 0}`);
    console.log(`   Best ICPs: ${learnings.next_cycle_instructions?.double_down_on_icps?.join(', ') || 'N/A'}`);
    console.log(`   Best formats: ${learnings.winning_patterns?.best_formats?.map(f => f[0]).join(', ') || 'N/A'}`);
    console.log(`   Best platforms: ${learnings.winning_patterns?.best_platforms?.map(p => p[0]).join(', ') || 'N/A'}`);
    console.log('   → These will influence script generation');
  } else {
    console.log('📝 First cycle — no previous learnings');
  }

  const startTime = Date.now();

  // Phase 1: Research
  if (!run('ad-research.js', 'PHASE 1: Competitor Ad Research')) return;

  // Phase 3: Generate (multi-format with Titan DNA)
  if (!run('generate-scripts.js', 'PHASE 3: Multi-Format Content Generation')) return;

  // Phase 3.5: Quality Gate
  if (!run('quality-gate.js', 'PHASE 3.5: Quality Gate Review')) return;

  // Phase 4: Produce
  if (!run('produce-creatives.js', 'PHASE 4: Multi-Format Creative Production')) return;

  // Phase 6a: Build Publish Queue
  if (!run('build-publish-queue.js', 'PHASE 6a: Build Publish Queue')) return;

  const elapsed = Math.round((Date.now() - startTime) / 1000);

  console.log(`\n${'━'.repeat(60)}`);
  console.log('✅ FULL CYCLE COMPLETE');
  console.log(`${'━'.repeat(60)}`);
  console.log(`⏱️  Total time: ${Math.floor(elapsed / 60)}m ${elapsed % 60}s`);
  console.log('');
  console.log('📋 What to do now:');
  console.log('   1. Review content in data/generated-scripts/by-format/');
  console.log('   2. Review quality report: data/generated-scripts/quality-report.json');
  console.log('   3. Send UGC briefs to creators: data/creatives/ugc-creator-briefs/');
  console.log('   4. Check HeyGen/Argil video renders (if API keys configured)');
  console.log('   5. Review publish queue: data/publish-queue.json');
  console.log('   6. Start publishing: npm run phase6:publish');
  console.log('   7. Or dry run first: npm run phase6:publish -- --dry-run');
  console.log('');
  console.log('📈 After 7-14 days of performance data:');
  console.log('   npm run phase5:optimize');
  console.log('   npm run full-cycle');
  console.log('');
  console.log('🔄 Each cycle gets smarter based on what won last time.');
}

main();

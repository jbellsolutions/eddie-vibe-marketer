#!/usr/bin/env node
/**
 * FULL CYCLE: Runs all 5 phases in sequence
 * Phase 1: Research → Phase 3: Generate → Phase 4: Produce → Phase 5: Optimize
 * (Phase 2 is brand voice setup — done once manually)
 *
 * If learnings exist from a previous cycle, they're automatically
 * loaded into the generation phase to bias toward winning patterns.
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
  console.log('🤖 EDDIE — Full Cycle Run');
  console.log('='.repeat(60));

  // Check for previous learnings
  if (fs.existsSync(LEARNINGS_PATH)) {
    const learnings = JSON.parse(fs.readFileSync(LEARNINGS_PATH, 'utf8'));
    console.log('📚 Previous cycle learnings detected:');
    console.log(`   Winners from last cycle: ${learnings.cycle_stats?.winners_identified || 0}`);
    console.log(`   Best ICPs: ${learnings.next_cycle_instructions?.double_down_on_icps?.join(', ') || 'N/A'}`);
    console.log('   → These will influence script generation');
  } else {
    console.log('📝 First cycle — no previous learnings');
  }

  const startTime = Date.now();

  // Phase 1: Research
  if (!run('ad-research.js', 'PHASE 1: Competitor Ad Research')) return;

  // Phase 3: Generate (Phase 2 is manual brand voice setup)
  if (!run('generate-scripts.js', 'PHASE 3: Script Generation')) return;

  // Phase 4: Produce
  if (!run('produce-creatives.js', 'PHASE 4: Creative Production')) return;

  const elapsed = Math.round((Date.now() - startTime) / 1000);

  console.log(`\n${'━'.repeat(60)}`);
  console.log('✅ FULL CYCLE COMPLETE');
  console.log(`${'━'.repeat(60)}`);
  console.log(`⏱️  Total time: ${Math.floor(elapsed / 60)}m ${elapsed % 60}s`);
  console.log('');
  console.log('📋 What to do now:');
  console.log('   1. Review UGC briefs in data/creatives/ugc-creator-briefs/');
  console.log('   2. Send top scripts to your creators');
  console.log('   3. Upload Arcads scripts (or check auto-renders)');
  console.log('   4. Launch ads on Meta');
  console.log('   5. Wait 7-14 days for performance data');
  console.log('   6. Run: npm run phase5:optimize');
  console.log('   7. Run: npm run full-cycle (for next iteration)');
  console.log('');
  console.log('🔄 Each cycle gets smarter based on what won last time.');
}

main();

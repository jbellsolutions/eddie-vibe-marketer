#!/usr/bin/env node
/**
 * PHASE 3.5: Quality Gate
 *
 * Batch-reviews generated scripts against writing-rules.md.
 * Sends batches of 5 scripts to Claude and checks for:
 * - Banned words/phrases (AI slop)
 * - Banned sentence starters
 * - Banned structures
 * - Brand voice consistency
 *
 * Flags violations and optionally rewrites failures.
 * This is a lightweight alternative to the full Creator→Critic→Approver pipeline.
 */

const Anthropic = require('@anthropic-ai/sdk');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const ROOT = path.resolve(__dirname, '..');
const SCRIPTS_PATH = path.join(ROOT, 'data', 'generated-scripts', 'all-scripts.json');
const RULES_PATH = path.join(ROOT, 'brand-voice', 'writing-rules.md');
const OUTPUT_PATH = path.join(ROOT, 'data', 'generated-scripts', 'quality-report.json');

const BATCH_SIZE = 5;
const MAX_REVIEW = 30; // Review top N scripts (prioritize high-value formats)

async function reviewBatch(client, scripts, rules) {
  const scriptsText = scripts.map((s, i) =>
    `--- SCRIPT ${i + 1} (ID: ${s.id}, Format: ${s.format}) ---\n${s.generated_content}\n`
  ).join('\n');

  const response = await client.messages.create({
    model: process.env.CLAUDE_MODEL || 'claude-haiku-4-5-20251001',
    max_tokens: 2048,
    system: `You are a strict quality reviewer. Review ad scripts against the writing rules below. Be ruthless — flag ANY violation.

WRITING RULES:
${rules}`,
    messages: [{
      role: 'user',
      content: `Review these ${scripts.length} scripts. For each one, output:

SCRIPT [number] (ID: [id]):
VERDICT: PASS or FAIL
VIOLATIONS: [list each specific violation, or "none"]
FIX: [if FAIL, a 1-sentence fix suggestion]

Be specific. Quote the exact offending words/phrases.

${scriptsText}`,
    }],
  });

  return response.content[0].text;
}

function parseReviewResults(reviewText, scriptIds) {
  const results = [];
  const blocks = reviewText.split(/SCRIPT \d+/i).filter(b => b.trim());

  for (let i = 0; i < blocks.length && i < scriptIds.length; i++) {
    const block = blocks[i];
    const pass = /VERDICT:\s*PASS/i.test(block);
    const violations = block.match(/VIOLATIONS?:\s*(.+?)(?=FIX:|SCRIPT|\n\n|$)/is);
    const fix = block.match(/FIX:\s*(.+?)(?=SCRIPT|\n\n|$)/is);

    results.push({
      id: scriptIds[i],
      pass,
      violations: violations ? violations[1].trim() : 'none',
      fix: fix ? fix[1].trim() : null,
    });
  }

  return results;
}

async function main() {
  console.log('🤖 EDDIE V2 — Phase 3.5: Quality Gate');
  console.log('='.repeat(50));

  if (!fs.existsSync(SCRIPTS_PATH)) {
    console.error('❌ No scripts found. Run phase 3 first: npm run phase3:generate');
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(SCRIPTS_PATH, 'utf8'));
  const rules = fs.readFileSync(RULES_PATH, 'utf8');

  // Prioritize review: Tier 3 and Tier 2 formats first (higher value per piece)
  const priorityOrder = ['carousel', 'broll-script', 'linkedin-post', 'screenshot-static', 'text-overlay', 'ugc-video', 'short-caption'];
  const sorted = [...data.scripts].sort((a, b) => {
    return priorityOrder.indexOf(a.format) - priorityOrder.indexOf(b.format);
  });

  const toReview = sorted.slice(0, MAX_REVIEW);
  console.log(`📋 Reviewing ${toReview.length} of ${data.scripts.length} scripts (top priority first)`);

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const allResults = [];

  for (let i = 0; i < toReview.length; i += BATCH_SIZE) {
    const batch = toReview.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(toReview.length / BATCH_SIZE);

    console.log(`\n[Batch ${batchNum}/${totalBatches}] Reviewing ${batch.length} scripts...`);

    try {
      const reviewText = await reviewBatch(client, batch, rules);
      const results = parseReviewResults(reviewText, batch.map(s => s.id));

      for (const result of results) {
        allResults.push(result);
        const icon = result.pass ? '✅' : '❌';
        console.log(`   ${icon} ${result.id}: ${result.pass ? 'PASS' : 'FAIL'}`);
        if (!result.pass) {
          console.log(`      Violations: ${result.violations}`);
        }
      }
    } catch (err) {
      console.log(`   ❌ Batch review failed: ${err.message}`);
    }

    await new Promise(r => setTimeout(r, 500));
  }

  // Summary
  const passed = allResults.filter(r => r.pass).length;
  const failed = allResults.filter(r => !r.pass).length;

  const report = {
    reviewed_at: new Date().toISOString(),
    total_reviewed: allResults.length,
    passed,
    failed,
    pass_rate: `${Math.round((passed / allResults.length) * 100)}%`,
    results: allResults,
  };

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(report, null, 2));

  console.log(`\n${'='.repeat(50)}`);
  console.log(`📊 Quality Gate Results:`);
  console.log(`   Reviewed: ${allResults.length}`);
  console.log(`   Passed: ${passed}`);
  console.log(`   Failed: ${failed}`);
  console.log(`   Pass Rate: ${report.pass_rate}`);
  console.log(`📄 Report: ${OUTPUT_PATH}`);

  if (failed > 0) {
    console.log(`\n⚠️  ${failed} scripts failed quality check.`);
    console.log('   Review the report and consider regenerating failed scripts.');
  }

  console.log(`\n👉 Next: npm run phase4:produce`);
}

main().catch(err => {
  console.error('❌ Quality gate failed:', err.message);
  process.exit(1);
});

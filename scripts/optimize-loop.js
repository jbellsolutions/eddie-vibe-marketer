#!/usr/bin/env node
/**
 * PHASE 5: Self-Improvement Loop
 * - Pulls ad performance data from Singular MMP API
 * - Identifies winning creatives (best CPA, ROAS)
 * - Analyzes what made winners work (angle, hook style, ICP match)
 * - Writes "learnings" file that feeds into next generation cycle
 * - Triggers a new generation cycle with winner-biased prompts
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ override: true, path: path.resolve(__dirname, '..', '.env') });

const ROOT = path.resolve(__dirname, '..');
const SCRIPTS_PATH = path.join(ROOT, 'data', 'generated-scripts', 'all-scripts.json');
const PERFORMANCE_DIR = path.join(ROOT, 'data', 'ad-performance');
const LEARNINGS_PATH = path.join(ROOT, 'data', 'ad-performance', 'learnings.json');

// ─── Singular API Client ───
class SingularClient {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://api.singular.net/api/v2.0';
  }

  async getCreativeReport(startDate, endDate) {
    const res = await axios.get(`${this.baseUrl}/reporting`, {
      params: {
        api_key: this.apiKey,
        start_date: startDate,
        end_date: endDate,
        dimensions: 'creative_id,creative_name',
        metrics: 'custom_installs,custom_revenue,adn_cost',
        format: 'json',
      },
    });
    return res.data.value || [];
  }
}

// ─── Performance Analysis ───
function analyzePerformance(creatives) {
  return creatives
    .map(c => ({
      creative_id: c.creative_id,
      creative_name: c.creative_name || '',
      installs: parseFloat(c.custom_installs) || 0,
      revenue: parseFloat(c.custom_revenue) || 0,
      cost: parseFloat(c.adn_cost) || 0,
      cpa: (parseFloat(c.adn_cost) || 0) / Math.max(parseFloat(c.custom_installs) || 1, 1),
      roas: (parseFloat(c.custom_revenue) || 0) / Math.max(parseFloat(c.adn_cost) || 1, 1),
    }))
    .filter(c => c.installs > 0)
    .sort((a, b) => a.cpa - b.cpa); // Best CPA first
}

function identifyWinners(analyzed, topPercent = 0.2) {
  const cutoff = Math.max(Math.ceil(analyzed.length * topPercent), 3);
  return analyzed.slice(0, cutoff);
}

function matchWinnersToScripts(winners, scripts) {
  const matched = [];

  for (const winner of winners) {
    // Try to match creative name/id back to our script IDs
    const scriptMatch = scripts.find(s => {
      const name = winner.creative_name.toLowerCase();
      return name.includes(s.id) || name.includes(s.source_competitor.toLowerCase());
    });

    matched.push({
      ...winner,
      matched_script: scriptMatch || null,
      icp: scriptMatch?.icp || 'unknown',
      source_competitor: scriptMatch?.source_competitor || 'unknown',
      angle: scriptMatch?.generated_script?.match(/ANGLE:\s*(.+)/)?.[1] || 'unknown',
    });
  }

  return matched;
}

function generateLearnings(matchedWinners, allAnalyzed) {
  const avgCpa = allAnalyzed.reduce((sum, c) => sum + c.cpa, 0) / allAnalyzed.length;
  const winnerAvgCpa = matchedWinners.reduce((sum, c) => sum + c.cpa, 0) / matchedWinners.length;

  // Count which ICPs, competitors, formats, and platforms produce winners
  const icpWins = {};
  const competitorWins = {};
  const angleWins = {};
  const formatWins = {};
  const platformWins = {};

  for (const w of matchedWinners) {
    icpWins[w.icp] = (icpWins[w.icp] || 0) + 1;
    competitorWins[w.source_competitor] = (competitorWins[w.source_competitor] || 0) + 1;
    angleWins[w.angle] = (angleWins[w.angle] || 0) + 1;
    if (w.format) formatWins[w.format] = (formatWins[w.format] || 0) + 1;
    if (w.platform) platformWins[w.platform] = (platformWins[w.platform] || 0) + 1;
  }

  return {
    generated_at: new Date().toISOString(),
    cycle_stats: {
      total_creatives_tested: allAnalyzed.length,
      winners_identified: matchedWinners.length,
      average_cpa: Math.round(avgCpa * 100) / 100,
      winner_average_cpa: Math.round(winnerAvgCpa * 100) / 100,
      cpa_improvement: `${Math.round((1 - winnerAvgCpa / avgCpa) * 100)}%`,
    },
    winning_patterns: {
      best_icps: Object.entries(icpWins).sort((a, b) => b[1] - a[1]),
      best_competitor_sources: Object.entries(competitorWins).sort((a, b) => b[1] - a[1]),
      best_angles: Object.entries(angleWins).sort((a, b) => b[1] - a[1]),
      best_formats: Object.entries(formatWins).sort((a, b) => b[1] - a[1]),
      best_platforms: Object.entries(platformWins).sort((a, b) => b[1] - a[1]),
    },
    next_cycle_instructions: {
      double_down_on_icps: Object.entries(icpWins).sort((a, b) => b[1] - a[1]).slice(0, 2).map(e => e[0]),
      double_down_on_competitors: Object.entries(competitorWins).sort((a, b) => b[1] - a[1]).slice(0, 2).map(e => e[0]),
      winning_angles: Object.entries(angleWins).sort((a, b) => b[1] - a[1]).slice(0, 3).map(e => e[0]),
      winning_formats: Object.entries(formatWins).sort((a, b) => b[1] - a[1]).slice(0, 3).map(e => e[0]),
      winning_platforms: Object.entries(platformWins).sort((a, b) => b[1] - a[1]).slice(0, 2).map(e => e[0]),
      avoid: matchedWinners.length > 0
        ? 'Reduce scripts for low-performing ICPs, formats, and competitor sources'
        : 'Not enough data yet — keep testing broadly',
    },
    top_performers: matchedWinners.map(w => ({
      creative_name: w.creative_name,
      cpa: w.cpa,
      roas: w.roas,
      installs: w.installs,
      icp: w.icp,
      format: w.format || 'unknown',
      platform: w.platform || 'unknown',
      angle: w.angle,
    })),
  };
}

async function main() {
  console.log('🤖 EDDIE — Phase 5: Self-Improvement Loop');
  console.log('='.repeat(50));

  fs.mkdirSync(PERFORMANCE_DIR, { recursive: true });

  // Load scripts
  let scripts = [];
  if (fs.existsSync(SCRIPTS_PATH)) {
    const data = JSON.parse(fs.readFileSync(SCRIPTS_PATH, 'utf8'));
    scripts = data.scripts;
  }

  // Pull performance data
  let rawCreatives = [];

  if (process.env.SINGULAR_API_KEY) {
    console.log('📊 Pulling performance data from Singular...');
    const singular = new SingularClient(process.env.SINGULAR_API_KEY);

    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    rawCreatives = await singular.getCreativeReport(startDate, endDate);
    console.log(`   Found ${rawCreatives.length} creatives with data`);
  } else {
    console.log('⚠️  No SINGULAR_API_KEY — using sample data for demo');
    console.log('   Set SINGULAR_API_KEY in .env to pull real performance data');
    console.log('   Or manually add performance data to data/ad-performance/manual-data.json');

    // Check for manual data
    const manualPath = path.join(PERFORMANCE_DIR, 'manual-data.json');
    if (fs.existsSync(manualPath)) {
      rawCreatives = JSON.parse(fs.readFileSync(manualPath, 'utf8'));
      console.log(`   Loaded ${rawCreatives.length} entries from manual data`);
    } else {
      // Create template for manual data entry
      const template = [
        {
          creative_id: 'script-1',
          creative_name: 'Script 1 - Example',
          custom_installs: '50',
          custom_revenue: '150.00',
          adn_cost: '200.00',
          _note: 'Replace with real data from your ad platform',
        },
      ];
      fs.writeFileSync(manualPath, JSON.stringify(template, null, 2));
      console.log(`   📄 Created template at ${manualPath}`);
      console.log('   Fill in your performance data and run again');
      return;
    }
  }

  // Analyze
  console.log('\n📈 Analyzing performance...');
  const analyzed = analyzePerformance(rawCreatives);
  const winners = identifyWinners(analyzed);
  const matchedWinners = matchWinnersToScripts(winners, scripts);
  const learnings = generateLearnings(matchedWinners, analyzed);

  // Save
  fs.writeFileSync(LEARNINGS_PATH, JSON.stringify(learnings, null, 2));

  // Save full performance snapshot
  fs.writeFileSync(
    path.join(PERFORMANCE_DIR, `snapshot-${new Date().toISOString().split('T')[0]}.json`),
    JSON.stringify({ analyzed, winners: matchedWinners }, null, 2)
  );

  // Print summary
  console.log(`\n${'='.repeat(50)}`);
  console.log('📊 CYCLE RESULTS:');
  console.log(`   Creatives tested: ${learnings.cycle_stats.total_creatives_tested}`);
  console.log(`   Winners found: ${learnings.cycle_stats.winners_identified}`);
  console.log(`   Avg CPA: $${learnings.cycle_stats.average_cpa}`);
  console.log(`   Winner Avg CPA: $${learnings.cycle_stats.winner_average_cpa}`);
  console.log(`   Improvement: ${learnings.cycle_stats.cpa_improvement}`);

  console.log('\n🎯 NEXT CYCLE:');
  console.log(`   Double down on ICPs: ${learnings.next_cycle_instructions.double_down_on_icps.join(', ') || 'N/A'}`);
  console.log(`   Best competitor sources: ${learnings.next_cycle_instructions.double_down_on_competitors.join(', ') || 'N/A'}`);
  console.log(`   Winning angles: ${learnings.next_cycle_instructions.winning_angles.join(', ') || 'N/A'}`);

  console.log(`\n📄 Learnings saved to: ${LEARNINGS_PATH}`);
  console.log('   These learnings auto-feed into the next generation cycle');
  console.log(`\n👉 Run the full cycle again: npm run full-cycle`);
}

main().catch(err => {
  console.error('❌ Optimization failed:', err.message);
  process.exit(1);
});

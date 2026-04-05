#!/usr/bin/env node
/**
 * PHASE 3: Multi-Format Content Generation
 *
 * - Loads competitor research from Phase 1
 * - Loads brand voice files (voice.md, product.md, icp.md, writing-rules.md)
 * - Loads Titan agent definitions for copywriting DNA injection
 * - For each competitor ad × each ICP × each enabled format:
 *   generates content using format-specific prompts + Titan style influence
 * - Tiered generation: Tier 1 = all ads, Tier 2 = top 50%, Tier 3 = top 20%
 * - Outputs to data/generated-scripts/by-format/{format}/
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config({ override: true, path: path.resolve(__dirname, '..', '.env') });

const { generateContent, createClient } = require('./lib/generator');
const { getEnabledFormats, FORMAT_DEFINITIONS } = require('./lib/formats');
const { listAgents, getAgentsForFormat } = require('./lib/titan-router');

const ROOT = path.resolve(__dirname, '..');
const RESEARCH_PATH = path.join(ROOT, 'data', 'competitor-research', 'research-summary.json');
const OUTPUT_DIR = path.join(ROOT, 'data', 'generated-scripts');

// ─── Brand Voice Loading ───

function loadBrandVoice() {
  const files = ['writing-rules.md', 'voice.md', 'product.md', 'icp.md'];
  const voice = {};
  for (const file of files) {
    const fullPath = path.join(ROOT, 'brand-voice', file);
    voice[file.replace('.md', '')] = fs.readFileSync(fullPath, 'utf8');
  }
  return voice;
}

function parseICPs(icpContent) {
  const icps = [];
  const sections = icpContent.split(/^## ICP \d+:/m).filter(s => s.trim());

  for (const section of sections) {
    const nameMatch = section.match(/^\s*(.+?)$/m);
    if (nameMatch) {
      icps.push({
        name: nameMatch[1].trim().replace(/[\[\]]/g, ''),
        content: section.trim(),
      });
    }
  }

  if (icps.length === 0) {
    icps.push({ name: 'Default', content: icpContent });
  }

  return icps;
}

// ─── Tiered Ad Selection ───

function getAdsForTier(ads, tier) {
  if (tier === 1) return ads;
  if (tier === 2) return ads.slice(0, Math.ceil(ads.length * 0.5));
  if (tier === 3) return ads.slice(0, Math.ceil(ads.length * 0.2));
  return ads;
}

// ─── Main ───

async function main() {
  console.log('🤖 EDDIE V2 — Phase 3: Multi-Format Content Generation');
  console.log('='.repeat(60));

  // Check research exists
  if (!fs.existsSync(RESEARCH_PATH)) {
    console.error('❌ No research data found. Run phase 1 first: npm run phase1:research');
    process.exit(1);
  }

  const research = JSON.parse(fs.readFileSync(RESEARCH_PATH, 'utf8'));
  const brandVoice = loadBrandVoice();
  const icps = parseICPs(brandVoice.icp);
  const enabledFormats = getEnabledFormats();

  // Sort ads by longevity (oldest start date = longest running = best proxy)
  const sortedAds = [...research.ads].sort((a, b) => {
    const dateA = new Date(a.started_running || 0);
    const dateB = new Date(b.started_running || 0);
    return dateA - dateB;
  });

  // Print setup summary
  console.log(`📊 Loaded ${sortedAds.length} competitor ads`);
  console.log(`🎯 Loaded ${icps.length} ICPs: ${icps.map(i => i.name).join(', ')}`);
  console.log(`📝 Enabled formats: ${enabledFormats.length}`);

  // Show Titan agents loaded
  const agents = listAgents();
  console.log(`🧬 Titan Genome: ${agents.length} copywriter agents loaded`);

  // Calculate total generation count
  let totalCount = 0;
  const formatCounts = {};
  for (const format of enabledFormats) {
    const tier = FORMAT_DEFINITIONS[format].tier;
    const adsForTier = getAdsForTier(sortedAds, tier);
    const count = adsForTier.length * icps.length;
    formatCounts[format] = count;
    totalCount += count;
  }

  console.log('\n📋 Generation plan:');
  for (const format of enabledFormats) {
    const def = FORMAT_DEFINITIONS[format];
    const titanAgents = getAgentsForFormat(format);
    const titanNames = titanAgents.map(a => a.display_name).join(' + ');
    console.log(`   ${format} (Tier ${def.tier}): ${formatCounts[format]} pieces → ${titanNames}`);
  }
  console.log(`   TOTAL: ${totalCount} content pieces\n`);

  const client = createClient();
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const allScripts = [];
  const byFormat = {};
  let globalCount = 0;

  for (const format of enabledFormats) {
    const def = FORMAT_DEFINITIONS[format];
    const tier = def.tier;
    const adsForTier = getAdsForTier(sortedAds, tier);

    const formatDir = path.join(OUTPUT_DIR, 'by-format', format);
    fs.mkdirSync(formatDir, { recursive: true });

    const formatScripts = [];
    const formatTotal = adsForTier.length * icps.length;
    let formatCount = 0;

    console.log(`\n${'─'.repeat(60)}`);
    console.log(`📝 ${def.name} (Tier ${tier}) — ${formatTotal} pieces`);
    console.log(`${'─'.repeat(60)}`);

    for (const ad of adsForTier) {
      for (const icp of icps) {
        globalCount++;
        formatCount++;
        const id = `${format}-${String(globalCount).padStart(3, '0')}`;

        console.log(`[${formatCount}/${formatTotal}] ${ad.competitor} Ad #${ad.ad_index} × ${icp.name}`);

        try {
          const content = await generateContent(client, ad, brandVoice, icp, format);

          const titanAgents = getAgentsForFormat(format);

          const entry = {
            id,
            format,
            source_competitor: ad.competitor,
            source_ad_index: ad.ad_index,
            source_hook: ad.hook,
            icp: icp.name,
            titan_agents_used: titanAgents.map(a => a.agent_key),
            platform_targets: def.platforms,
            generated_content: content,
            generated_at: new Date().toISOString(),
          };

          allScripts.push(entry);
          formatScripts.push(entry);

          // Save individual file
          const filename = `${id}-${ad.competitor.replace(/\s+/g, '-').toLowerCase()}-${icp.name.replace(/\s+/g, '-').toLowerCase()}.json`;
          fs.writeFileSync(path.join(formatDir, filename), JSON.stringify(entry, null, 2));

          console.log(`   ✅ Generated (${id})`);
        } catch (err) {
          console.log(`   ❌ Failed: ${err.message}`);
        }

        // Rate limiting
        await new Promise(r => setTimeout(r, 300));
      }
    }

    byFormat[format] = formatScripts.length;
  }

  // Write master scripts file
  const masterPath = path.join(OUTPUT_DIR, 'all-scripts.json');
  fs.writeFileSync(masterPath, JSON.stringify({
    generated_at: new Date().toISOString(),
    total_scripts: allScripts.length,
    competitor_ads_used: sortedAds.length,
    icps_used: icps.map(i => i.name),
    formats_used: enabledFormats,
    by_format: byFormat,
    scripts: allScripts,
  }, null, 2));

  // Print summary
  console.log(`\n${'='.repeat(60)}`);
  console.log('✅ GENERATION COMPLETE');
  console.log(`${'='.repeat(60)}`);
  console.log(`📊 Total content pieces: ${allScripts.length}`);
  for (const [fmt, count] of Object.entries(byFormat)) {
    console.log(`   ${fmt}: ${count}`);
  }
  console.log(`📄 Master file: ${masterPath}`);
  console.log(`📁 By format: ${path.join(OUTPUT_DIR, 'by-format/')}`);
  console.log(`\n👉 Next: npm run phase3:quality (optional) then npm run phase4:produce`);
}

main().catch(err => {
  console.error('❌ Generation failed:', err.message);
  process.exit(1);
});

#!/usr/bin/env node
/**
 * PHASE 3: Script Generation
 * - Loads competitor research from Phase 1
 * - Loads brand voice files (voice.md, product.md, icp.md, writing-rules.md)
 * - For each competitor ad: generates a rewrite in your brand voice
 * - Multiplies each rewrite by each ICP for maximum variations
 * - Outputs all scripts to data/generated-scripts/
 */

const Anthropic = require('@anthropic-ai/sdk');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const ROOT = path.resolve(__dirname, '..');
const RESEARCH_PATH = path.join(ROOT, 'data', 'competitor-research', 'research-summary.json');
const OUTPUT_DIR = path.join(ROOT, 'data', 'generated-scripts');

// Load brand voice files
function loadBrandVoice() {
  const files = ['writing-rules.md', 'voice.md', 'product.md', 'icp.md'];
  const voice = {};
  for (const file of files) {
    const fullPath = path.join(ROOT, 'brand-voice', file);
    voice[file.replace('.md', '')] = fs.readFileSync(fullPath, 'utf8');
  }
  return voice;
}

// Parse ICPs from icp.md into individual profiles
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

  // If parsing fails, treat whole file as one ICP
  if (icps.length === 0) {
    icps.push({ name: 'Default', content: icpContent });
  }

  return icps;
}

async function generateScript(client, competitorAd, brandVoice, icp) {
  const systemPrompt = `You are Eddie, an expert ad scriptwriter. You write video ad scripts for social media (15-60 seconds).

CRITICAL RULES — loaded from writing-rules.md:
${brandVoice['writing-rules']}

BRAND VOICE — how we sound:
${brandVoice.voice}

PRODUCT — what we're selling:
${brandVoice.product}

TARGET AUDIENCE for this variation:
${icp.content}`;

  const userPrompt = `Here is a competitor's video ad that's performing well:

COMPETITOR: ${competitorAd.competitor}
HOOK: ${competitorAd.hook}
FULL TRANSCRIPT: ${competitorAd.full_transcript}
BODY COPY: ${competitorAd.body_copy}
HEADLINE: ${competitorAd.headline}
CTA: ${competitorAd.cta}

Write a NEW original ad script for OUR product that:
1. Uses the same ANGLE and STRUCTURE as this competitor ad (what made it work)
2. Is written entirely in OUR brand voice
3. Speaks directly to this ICP: ${icp.name}
4. Follows every rule in writing-rules.md (no AI slop, no banned words)
5. Is 15-45 seconds when read aloud (roughly 40-120 words)

Output format:
HOOK: [first 3 seconds — must create curiosity or tension]
BODY: [main script]
CTA: [call to action — what to do next]
ANGLE: [1 sentence — what psychological angle this uses]
WHY IT WORKS: [1 sentence — why this structure converts]`;

  const response = await client.messages.create({
    model: process.env.CLAUDE_MODEL || 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  });

  return response.content[0].text;
}

async function main() {
  console.log('🤖 EDDIE — Phase 3: Script Generation');
  console.log('='.repeat(50));

  // Check research exists
  if (!fs.existsSync(RESEARCH_PATH)) {
    console.error('❌ No research data found. Run phase 1 first: npm run phase1:research');
    process.exit(1);
  }

  const research = JSON.parse(fs.readFileSync(RESEARCH_PATH, 'utf8'));
  const brandVoice = loadBrandVoice();
  const icps = parseICPs(brandVoice.icp);

  console.log(`📊 Loaded ${research.ads.length} competitor ads`);
  console.log(`🎯 Loaded ${icps.length} ICPs: ${icps.map(i => i.name).join(', ')}`);
  console.log(`📝 Total scripts to generate: ${research.ads.length} × ${icps.length} = ${research.ads.length * icps.length}`);
  console.log('');

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const allScripts = [];
  let count = 0;
  const total = research.ads.length * icps.length;

  for (const ad of research.ads) {
    for (const icp of icps) {
      count++;
      console.log(`[${count}/${total}] ${ad.competitor} Ad #${ad.ad_index} × ${icp.name}`);

      try {
        const script = await generateScript(client, ad, brandVoice, icp);

        const entry = {
          id: `script-${count}`,
          source_competitor: ad.competitor,
          source_ad_index: ad.ad_index,
          source_hook: ad.hook,
          icp: icp.name,
          generated_script: script,
          generated_at: new Date().toISOString(),
        };

        allScripts.push(entry);

        // Save individual script
        const filename = `script-${count}-${ad.competitor.replace(/\s+/g, '-').toLowerCase()}-${icp.name.replace(/\s+/g, '-').toLowerCase()}.json`;
        fs.writeFileSync(path.join(OUTPUT_DIR, filename), JSON.stringify(entry, null, 2));

        console.log(`   ✅ Generated`);
      } catch (err) {
        console.log(`   ❌ Failed: ${err.message}`);
      }

      // Rate limiting — small delay between calls
      await new Promise(r => setTimeout(r, 500));
    }
  }

  // Write master scripts file
  const masterPath = path.join(OUTPUT_DIR, 'all-scripts.json');
  fs.writeFileSync(masterPath, JSON.stringify({
    generated_at: new Date().toISOString(),
    total_scripts: allScripts.length,
    competitor_ads_used: research.ads.length,
    icps_used: icps.map(i => i.name),
    scripts: allScripts,
  }, null, 2));

  console.log(`\n${'='.repeat(50)}`);
  console.log(`✅ Generated ${allScripts.length} script variations`);
  console.log(`📄 Saved to: ${masterPath}`);
  console.log(`\n👉 Next: npm run phase4:produce`);
}

main().catch(err => {
  console.error('❌ Generation failed:', err.message);
  process.exit(1);
});

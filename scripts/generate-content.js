#!/usr/bin/env node
/**
 * CONTENT GENERATION — 8 Platform Formats
 *
 * Takes the same intelligence (competitor research + brand voice) and
 * generates content across 8 formats, each routed through the appropriate
 * Titan copywriter specialist.
 *
 * Formats: Authority Brief, Facebook Post, LinkedIn Post, LinkedIn Article,
 *          Medium Article, Substack Post, Newsletter, YouTube Video Package
 *
 * Usage: node scripts/generate-content.js
 * Requires: data/competitor-research/research-summary.json (run phase1 first)
 */

const Anthropic = require('@anthropic-ai/sdk');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ override: true, path: path.resolve(__dirname, '..', '.env') });

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const MODEL = process.env.CLAUDE_MODEL || 'claude-haiku-4-5-20251001';

const ROOT = path.resolve(__dirname, '..');
const OUTPUT_DIR = path.join(ROOT, 'data', 'output', 'content');

// Load brand voice files
function loadBrandVoice() {
  const voiceDir = path.join(ROOT, 'brand-voice');
  return {
    voice: fs.readFileSync(path.join(voiceDir, 'voice.md'), 'utf8'),
    product: fs.readFileSync(path.join(voiceDir, 'product.md'), 'utf8'),
    icp: fs.readFileSync(path.join(voiceDir, 'icp.md'), 'utf8'),
    writingRules: fs.readFileSync(path.join(voiceDir, 'writing-rules.md'), 'utf8'),
  };
}

// Load research intelligence
function loadIntelligence() {
  const summaryPath = path.join(ROOT, 'data', 'competitor-research', 'research-summary.json');
  if (!fs.existsSync(summaryPath)) {
    console.error('❌ No research-summary.json found. Run phase1:research first.');
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(summaryPath, 'utf8'));
}

// Content format definitions with Titan routing
const CONTENT_FORMATS = [
  {
    id: 'authority-brief',
    name: 'Authority Brief',
    titan: 'Jay Abraham + Tom Bilyeu',
    description: 'Strategic positioning document establishing thought leadership',
    prompt: `Write an Authority Brief — a strategic positioning document that establishes the brand as the definitive expert in this space. Structure: Executive insight (2-3 sentences), Market reality (what others miss), Our approach (unique mechanism), Proof points, Call to action. Tone: confident, backed by data, thought-leader voice. 400-600 words.`,
  },
  {
    id: 'facebook-post',
    name: 'Facebook Post',
    titan: 'Eugene Schwartz + Dan Kennedy',
    description: 'Engaging Facebook post optimized for comments and shares',
    prompt: `Write a Facebook post that stops the scroll. Hook must create curiosity or tension in the first line. Use short paragraphs (1-2 sentences each). End with a question or soft CTA that drives comments. No hashtags. No emojis unless naturally placed. 150-250 words max. Must feel like a real person wrote it, not a brand.`,
  },
  {
    id: 'linkedin-post',
    name: 'LinkedIn Post',
    titan: 'Jon Buchan + Brian Kurtz',
    description: 'Professional LinkedIn post with pattern interrupt hook',
    prompt: `Write a LinkedIn post with a pattern-interrupt opening line. Use the "hook → story → insight → CTA" structure. Short lines (LinkedIn rewards whitespace). Include a specific insight or data point from the research. End with a question to drive engagement. Professional but not corporate. 150-300 words.`,
  },
  {
    id: 'linkedin-article',
    name: 'LinkedIn Article',
    titan: 'Joe Sugarman + Eugene Schwartz',
    description: 'Long-form LinkedIn article with curiosity-driven narrative',
    prompt: `Write a LinkedIn article using Joe Sugarman's "slippery slide" technique — every sentence pulls the reader to the next. Start with a bold statement or counterintuitive insight. Build a narrative arc: problem → failed solutions → new mechanism → proof → next step. Use subheadings every 200-300 words. Include specific data from the competitor research. 800-1200 words.`,
  },
  {
    id: 'medium-article',
    name: 'Medium Article',
    titan: 'Joe Sugarman + Perry Marshall',
    description: 'Medium-optimized article with SEO-friendly structure',
    prompt: `Write a Medium article. Use an attention-grabbing title (curiosity + specificity). Include a compelling subtitle. Structure with clear H2 headers. Use the 80/20 principle — focus on the vital few insights that create the most value. Include specific numbers and data points. End with a takeaway section. 1000-1500 words.`,
  },
  {
    id: 'substack-post',
    name: 'Substack Post',
    titan: 'Bill Mueller + Brian Kurtz',
    description: 'Newsletter-style Substack post with story and curiosity',
    prompt: `Write a Substack post using Bill Mueller's story-led approach. Open with a specific, personal story or scenario (not "imagine this"). Build curiosity throughout — each section should make them want the next. Include one actionable insight they can implement immediately. Close with a preview of next week's topic. Conversational, like writing to a smart friend. 600-1000 words.`,
  },
  {
    id: 'newsletter',
    name: 'Newsletter Edition',
    titan: 'Bill Mueller + Gordon Grossman',
    description: 'Email newsletter edition with retention-focused structure',
    prompt: `Write a newsletter edition. Subject line: specific + curiosity (no clickbait). Opening: one sentence hook that earns the next paragraph. Body: 3 sections max — each with a clear insight or takeaway. Use bullet points sparingly but effectively. CTA: one clear next step. P.S. line with a bonus insight or teaser. Total: 400-600 words. Must feel personal and valuable — subscriber should be glad they opened it.`,
  },
  {
    id: 'youtube-video',
    name: 'YouTube Video Package',
    titan: 'Fred Catona + Tom Bilyeu + Greg Renker',
    description: 'Complete YouTube video package: title, description, script outline, chapters, tags',
    prompt: `Create a complete YouTube video package:
1. TITLE: Curiosity + specificity, under 60 characters, no clickbait
2. DESCRIPTION: First 2 lines visible in search — hook + value promise. Full description: what they'll learn, timestamps placeholder, CTA, relevant links placeholder. 200-300 words.
3. SCRIPT OUTLINE: Hook (0-30 sec), intro (30-60 sec), 3-5 main points with transitions, conclusion + CTA. Include specific talking points for each section.
4. CHAPTER MARKERS: Suggested chapter names and approximate timestamps
5. TAGS: 10-15 relevant tags for SEO
6. PINNED COMMENT: Engaging first comment to pin (drives engagement)

The video should be 8-12 minutes in target length. Tone: authoritative but approachable, like teaching a friend something valuable.`,
  },
];

async function generateContent(format, brandVoice, intelligence, icpName) {
  const topAds = intelligence.ads.slice(0, 10);
  const adSummary = topAds.map((ad, i) =>
    `Ad ${i + 1} (${ad.competitor}): Hook: "${ad.hook}" | Body: "${(ad.body_copy || '').substring(0, 100)}"`
  ).join('\n');

  const systemPrompt = `You are a world-class content creator channeling the expertise of ${format.titan}.

BRAND VOICE:
${brandVoice.voice}

PRODUCT:
${brandVoice.product}

TARGET AUDIENCE:
${icpName}

WRITING RULES (FOLLOW EXACTLY):
${brandVoice.writingRules}`;

  const userPrompt = `${format.prompt}

COMPETITOR INTELLIGENCE (use these patterns but create original content):
${adSummary}

Create ONE piece of ${format.name} content for the target audience. Be specific, use real numbers, and follow the writing rules exactly. No AI slop.`;

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 2000,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  });

  return response.content[0].text;
}

// Extract ICP names from icp.md
function extractICPs(icpContent) {
  const icpNames = [];
  const lines = icpContent.split('\n');
  for (const line of lines) {
    const match = line.match(/^## ICP \d+:\s*(.+)/);
    if (match) icpNames.push(match[1].trim());
  }
  return icpNames.length > 0 ? icpNames : ['General Audience'];
}

async function main() {
  console.log('🤖 CONTENT GENERATION — 8 Platform Formats');
  console.log('='.repeat(50));

  const brandVoice = loadBrandVoice();
  const intelligence = loadIntelligence();
  const icps = extractICPs(brandVoice.icp);

  console.log(`📊 Intelligence: ${intelligence.total_ads_analyzed} competitor ads loaded`);
  console.log(`👥 ICPs: ${icps.join(', ')}`);
  console.log(`📝 Formats: ${CONTENT_FORMATS.length}`);
  console.log(`🔢 Total pieces to generate: ${CONTENT_FORMATS.length * icps.length}`);
  console.log('');

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  let totalGenerated = 0;

  for (const format of CONTENT_FORMATS) {
    const formatDir = path.join(OUTPUT_DIR, format.id);
    fs.mkdirSync(formatDir, { recursive: true });

    for (const icp of icps) {
      const icpSlug = icp.replace(/[^a-zA-Z0-9]+/g, '-').toLowerCase();
      const filename = `${format.id}-${icpSlug}.md`;
      const filepath = path.join(formatDir, filename);

      console.log(`  📝 ${format.name} × ${icp} (via ${format.titan})...`);

      try {
        const content = await generateContent(format, brandVoice, intelligence, icp);
        const output = `# ${format.name}\n**ICP:** ${icp}\n**Titan Routing:** ${format.titan}\n**Generated:** ${new Date().toISOString()}\n\n---\n\n${content}`;
        fs.writeFileSync(filepath, output);
        totalGenerated++;
        console.log(`  ✅ Saved: ${filename}`);
      } catch (err) {
        console.log(`  ❌ Failed: ${err.message}`);
      }

      // Rate limit: 500ms between requests
      await new Promise(r => setTimeout(r, 500));
    }
  }

  // Write manifest
  const manifest = {
    generated_at: new Date().toISOString(),
    total_pieces: totalGenerated,
    formats: CONTENT_FORMATS.map(f => f.id),
    icps: icps,
    model: MODEL,
    intelligence_source: `${intelligence.total_ads_analyzed} competitor ads`,
  };
  fs.writeFileSync(path.join(OUTPUT_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2));

  console.log(`\n${'='.repeat(50)}`);
  console.log(`✅ Content generation complete: ${totalGenerated} pieces created`);
  console.log(`📁 Output: ${OUTPUT_DIR}`);
}

main().catch(err => {
  console.error('❌ Content generation failed:', err.message);
  process.exit(1);
});

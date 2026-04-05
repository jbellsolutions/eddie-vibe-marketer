#!/usr/bin/env node
/**
 * PHASE 4: Multi-Format Creative Production
 *
 * Processes generated scripts into production-ready assets:
 * - UGC video scripts → Top N exported as creator briefs (human filming)
 * - UGC video scripts → Argil for personal clone videos
 * - UGC video scripts → HeyGen for ICP-matched avatar videos
 * - Screenshot statics → Rendered as PNG images via Puppeteer
 * - Carousels → Rendered as PNG slide sets via Puppeteer
 * - Text overlays → Rendered as PNG card sets via Puppeteer
 * - LinkedIn posts, captions, b-roll scripts → Text-only (saved to manifest)
 *
 * Outputs a production-manifest.json tracking all creatives and their platform targets.
 */

const fs = require('fs');
const path = require('path');
const { createObjectCsvWriter } = require('csv-writer');
require('dotenv').config({ override: true, path: path.resolve(__dirname, '..', '.env') });

const { HeyGenClient } = require('./lib/heygen-client');
const { ArgilClient } = require('./lib/argil-client');
const {
  parseScreenshotContent, parseCarouselContent, parseTextOverlayContent,
  buildScreenshotHTML, buildCarouselSlideHTML, buildTextOverlayCardHTML,
  renderHTMLToPNG,
} = require('./lib/image-generator');

const ROOT = path.resolve(__dirname, '..');
const SCRIPTS_PATH = path.join(ROOT, 'data', 'generated-scripts', 'all-scripts.json');
const OUTPUT_DIR = path.join(ROOT, 'data', 'creatives');
const AVATAR_CONFIG_PATH = path.join(ROOT, 'config', 'avatar-config.json');

// ─── Script Ranking ───

function rankScripts(scripts) {
  const seen = new Set();
  return scripts.map(script => {
    const key = `${script.source_competitor}-${script.icp}-${script.format}`;
    const priority = seen.has(key) ? 'medium' : 'high';
    seen.add(key);
    return { ...script, priority };
  }).sort((a, b) => (a.priority === 'high' ? -1 : 1));
}

function extractScriptText(content) {
  const lines = content.split('\n');
  const parts = [];
  let capture = false;

  for (const line of lines) {
    if (/^(HOOK|BODY|CTA|VOICEOVER|CAPTION):/i.test(line)) {
      parts.push(line.replace(/^(HOOK|BODY|CTA|VOICEOVER|CAPTION):\s*/i, ''));
      capture = true;
    } else if (/^(ANGLE|WHY IT WORKS|HASHTAGS|VISUAL DIRECTION|FORMAT|HEADLINE|SUBTEXT|SLIDE|CARD):/i.test(line)) {
      capture = false;
    } else if (capture) {
      parts.push(line);
    }
  }

  return parts.join(' ').trim();
}

// ─── Avatar Selection ───

function getAvatarForICP(icpName, avatarConfig) {
  const mappings = avatarConfig.heygen?.avatar_mappings || [];

  for (const mapping of mappings) {
    if (icpName.toLowerCase().includes(mapping.icp_pattern.toLowerCase())) {
      if (mapping.avatar_ids && mapping.avatar_ids.length > 0) {
        // Random selection from mapped avatars
        return mapping.avatar_ids[Math.floor(Math.random() * mapping.avatar_ids.length)];
      }
    }
  }

  // Fallback to default
  const defaults = avatarConfig.heygen?.default_avatar_ids || [];
  return defaults.length > 0 ? defaults[0] : null;
}

// ─── UGC Creator Briefs (unchanged from V1) ───

async function exportForCreators(scripts, outputDir) {
  const creatorsDir = path.join(outputDir, 'ugc-creator-briefs');
  fs.mkdirSync(creatorsDir, { recursive: true });

  const csvWriter = createObjectCsvWriter({
    path: path.join(creatorsDir, 'creator-briefs.csv'),
    header: [
      { id: 'id', title: 'Script ID' },
      { id: 'icp', title: 'Target Audience' },
      { id: 'competitor', title: 'Inspired By' },
      { id: 'script', title: 'Full Script' },
      { id: 'notes', title: 'Direction Notes' },
    ],
  });

  const records = scripts.map(s => ({
    id: s.id,
    icp: s.icp,
    competitor: s.source_competitor,
    script: extractScriptText(s.generated_content),
    notes: `Film in 9:16 vertical. Keep under 45 seconds. Ref: ${s.source_competitor} ad #${s.source_ad_index}.`,
  }));

  await csvWriter.writeRecords(records);

  for (const s of scripts) {
    const briefPath = path.join(creatorsDir, `${s.id}-brief.txt`);
    fs.writeFileSync(briefPath, `SCRIPT ID: ${s.id}
TARGET AUDIENCE: ${s.icp}
INSPIRED BY: ${s.source_competitor} Ad #${s.source_ad_index}

--- SCRIPT ---
${extractScriptText(s.generated_content)}

--- FILMING NOTES ---
- Format: 9:16 vertical video
- Length: 15-45 seconds
- Energy: Match the vibe of the reference ad
- Film in good lighting, phone quality is fine
- Look at camera, be natural
`);
  }

  return records.length;
}

// ─── HeyGen Video Production ───

async function produceHeyGenVideos(scripts, avatarConfig, manifest) {
  if (!process.env.HEYGEN_API_KEY) {
    console.log('   ⏭️  No HEYGEN_API_KEY — saving scripts for manual video creation');
    const manualDir = path.join(OUTPUT_DIR, 'heygen-manual');
    fs.mkdirSync(manualDir, { recursive: true });

    for (const s of scripts) {
      fs.writeFileSync(
        path.join(manualDir, `${s.id}-heygen.txt`),
        extractScriptText(s.generated_content)
      );
      manifest.push({
        creative_id: `${s.id}-heygen-manual`,
        source_script_id: s.id,
        format: s.format,
        production_method: 'heygen-manual',
        icp: s.icp,
        platform_targets: s.platform_targets,
        file_path: path.join(manualDir, `${s.id}-heygen.txt`),
        status: 'manual_upload_needed',
        published_to: [],
      });
    }
    return;
  }

  const heygen = new HeyGenClient(process.env.HEYGEN_API_KEY);
  const videosDir = path.join(OUTPUT_DIR, 'videos');
  fs.mkdirSync(videosDir, { recursive: true });

  const jobs = [];

  for (const script of scripts) {
    const avatarId = getAvatarForICP(script.icp, avatarConfig);
    if (!avatarId) {
      console.log(`   ⚠️  No avatar for ICP "${script.icp}" — skipping ${script.id}`);
      continue;
    }

    try {
      const result = await heygen.generateVideo(
        extractScriptText(script.generated_content),
        avatarId,
        { title: `${script.id} — ${script.icp}` }
      );

      const entry = {
        creative_id: `${script.id}-heygen-${avatarId}`,
        source_script_id: script.id,
        format: script.format,
        production_method: 'heygen',
        avatar_id: avatarId,
        icp: script.icp,
        platform_targets: script.platform_targets,
        video_id: result.video_id,
        status: 'processing',
        published_to: [],
      };

      jobs.push(entry);
      manifest.push(entry);
      console.log(`   🎬 Queued: ${script.id} → avatar ${avatarId}`);
    } catch (err) {
      console.log(`   ❌ HeyGen failed for ${script.id}: ${err.message}`);
    }

    await new Promise(r => setTimeout(r, 200));
  }

  // Save jobs manifest for status checking later
  if (jobs.length > 0) {
    fs.writeFileSync(
      path.join(videosDir, 'heygen-jobs.json'),
      JSON.stringify({ queued_at: new Date().toISOString(), jobs }, null, 2)
    );
  }
}

// ─── Argil Clone Production ───

async function produceArgilCloneVideos(scripts, avatarConfig, manifest) {
  const cloneId = avatarConfig.argil?.clone_id;
  if (!cloneId || !process.env.ARGIL_API_KEY) {
    console.log('   ⏭️  No Argil clone configured — skipping personal clone videos');
    return;
  }

  const argil = new ArgilClient(process.env.ARGIL_API_KEY);
  const maxClone = avatarConfig.argil?.max_per_cycle || 10;
  const cloneScripts = scripts.slice(0, maxClone);

  console.log(`   🧬 Creating ${cloneScripts.length} personal clone videos (max: ${maxClone})`);

  for (const script of cloneScripts) {
    try {
      const result = await argil.generateVideo(
        extractScriptText(script.generated_content),
        cloneId,
        { title: `Clone: ${script.id}` }
      );

      manifest.push({
        creative_id: `${script.id}-argil-clone`,
        source_script_id: script.id,
        format: script.format,
        production_method: 'argil',
        clone_id: cloneId,
        icp: script.icp,
        platform_targets: script.platform_targets,
        video_id: result.video_id,
        status: 'processing',
        published_to: [],
      });

      console.log(`   🧬 Queued clone: ${script.id}`);
    } catch (err) {
      console.log(`   ❌ Argil failed for ${script.id}: ${err.message}`);
    }

    await new Promise(r => setTimeout(r, 200));
  }
}

// ─── Static Image Production ───

async function produceImages(scripts, format, manifest) {
  let puppeteer;
  try {
    puppeteer = require('puppeteer');
  } catch {
    console.log('   ⚠️  Puppeteer not installed — saving raw content instead');
    console.log('   Run: npm install puppeteer');
    saveTextOnly(scripts, format, manifest);
    return;
  }

  const imagesDir = path.join(OUTPUT_DIR, 'images', format);
  fs.mkdirSync(imagesDir, { recursive: true });

  const browser = await puppeteer.launch({ headless: 'new' });

  try {
    for (const script of scripts) {
      try {
        if (format === 'screenshot-static') {
          const data = parseScreenshotContent(script.generated_content);
          const html = buildScreenshotHTML(data);
          const outputPath = path.join(imagesDir, `${script.id}.png`);
          await renderHTMLToPNG(browser, html, outputPath);

          manifest.push({
            creative_id: `${script.id}-image`,
            source_script_id: script.id,
            format,
            production_method: 'puppeteer',
            icp: script.icp,
            platform_targets: script.platform_targets,
            file_path: outputPath,
            status: 'ready',
            published_to: [],
          });

          console.log(`   🖼️  Rendered: ${script.id}.png`);

        } else if (format === 'carousel') {
          const slides = parseCarouselContent(script.generated_content);
          const slideDir = path.join(imagesDir, script.id);
          fs.mkdirSync(slideDir, { recursive: true });

          const slidePaths = [];
          for (let i = 0; i < slides.length; i++) {
            const html = buildCarouselSlideHTML(slides[i], i + 1, slides.length, i === 0, i === slides.length - 1);
            const slidePath = path.join(slideDir, `slide-${i + 1}.png`);
            await renderHTMLToPNG(browser, html, slidePath);
            slidePaths.push(slidePath);
          }

          manifest.push({
            creative_id: `${script.id}-carousel`,
            source_script_id: script.id,
            format,
            production_method: 'puppeteer',
            icp: script.icp,
            platform_targets: script.platform_targets,
            file_path: slideDir,
            slide_paths: slidePaths,
            slide_count: slides.length,
            status: 'ready',
            published_to: [],
          });

          console.log(`   🖼️  Rendered: ${script.id} (${slides.length} slides)`);

        } else if (format === 'text-overlay') {
          const cards = parseTextOverlayContent(script.generated_content);
          const cardDir = path.join(imagesDir, script.id);
          fs.mkdirSync(cardDir, { recursive: true });

          const cardPaths = [];
          for (let i = 0; i < cards.length; i++) {
            const html = buildTextOverlayCardHTML(cards[i], i);
            const cardPath = path.join(cardDir, `card-${i + 1}.png`);
            await renderHTMLToPNG(browser, html, cardPath, { width: 1080, height: 1920 });
            cardPaths.push(cardPath);
          }

          manifest.push({
            creative_id: `${script.id}-overlay`,
            source_script_id: script.id,
            format,
            production_method: 'puppeteer',
            icp: script.icp,
            platform_targets: script.platform_targets,
            file_path: cardDir,
            card_paths: cardPaths,
            card_count: cards.length,
            status: 'ready',
            published_to: [],
          });

          console.log(`   🖼️  Rendered: ${script.id} (${cards.length} cards)`);
        }
      } catch (err) {
        console.log(`   ❌ Failed to render ${script.id}: ${err.message}`);
      }
    }
  } finally {
    await browser.close();
  }
}

// ─── Text-Only Formats ───

function saveTextOnly(scripts, format, manifest) {
  const textDir = path.join(OUTPUT_DIR, 'text', format);
  fs.mkdirSync(textDir, { recursive: true });

  for (const script of scripts) {
    const filePath = path.join(textDir, `${script.id}.txt`);
    fs.writeFileSync(filePath, script.generated_content);

    manifest.push({
      creative_id: `${script.id}-text`,
      source_script_id: script.id,
      format,
      production_method: 'text',
      icp: script.icp,
      platform_targets: script.platform_targets,
      file_path: filePath,
      content: script.generated_content,
      status: 'ready',
      published_to: [],
    });
  }
}

// ─── Main ───

async function main() {
  console.log('🤖 EDDIE V2 — Phase 4: Multi-Format Creative Production');
  console.log('='.repeat(60));

  if (!fs.existsSync(SCRIPTS_PATH)) {
    console.error('❌ No scripts found. Run phase 3 first: npm run phase3:generate');
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(SCRIPTS_PATH, 'utf8'));
  const avatarConfig = JSON.parse(fs.readFileSync(AVATAR_CONFIG_PATH, 'utf8'));
  const manifest = [];

  console.log(`📊 Loaded ${data.total_scripts} scripts across ${data.formats_used?.length || 1} formats\n`);

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  // Group scripts by format
  const byFormat = {};
  for (const script of data.scripts) {
    const fmt = script.format || 'ugc-video';
    if (!byFormat[fmt]) byFormat[fmt] = [];
    byFormat[fmt].push(script);
  }

  // ── Process UGC Video Scripts ──
  if (byFormat['ugc-video']) {
    const ranked = rankScripts(byFormat['ugc-video']);
    const ugcCount = avatarConfig.ugc_creators?.top_n || 15;
    const ugcScripts = ranked.slice(0, ugcCount);
    const videoScripts = ranked.slice(ugcCount);

    // UGC Creator briefs
    console.log(`👤 UGC Creator Briefs: ${ugcScripts.length} scripts`);
    const briefCount = await exportForCreators(ugcScripts, OUTPUT_DIR);
    for (const s of ugcScripts) {
      manifest.push({
        creative_id: `${s.id}-ugc-brief`,
        source_script_id: s.id,
        format: 'ugc-video',
        production_method: 'ugc-creator',
        icp: s.icp,
        platform_targets: s.platform_targets || ['facebook', 'instagram', 'tiktok'],
        status: 'brief_exported',
        published_to: [],
      });
    }
    console.log(`   ✅ Exported ${briefCount} briefs\n`);

    // Argil clone videos (top scripts from video pool)
    console.log(`🧬 Argil Personal Clone Videos:`);
    await produceArgilCloneVideos(videoScripts, avatarConfig, manifest);
    console.log('');

    // HeyGen avatar videos (remaining)
    const argilMax = avatarConfig.argil?.max_per_cycle || 10;
    const heygenScripts = videoScripts.slice(argilMax);
    console.log(`🤖 HeyGen Avatar Videos: ${heygenScripts.length} scripts`);
    await produceHeyGenVideos(heygenScripts, avatarConfig, manifest);
    console.log('');
  }

  // ── Process Image Formats ──
  for (const imgFormat of ['screenshot-static', 'carousel', 'text-overlay']) {
    if (byFormat[imgFormat] && byFormat[imgFormat].length > 0) {
      console.log(`🖼️  ${imgFormat}: ${byFormat[imgFormat].length} pieces`);
      await produceImages(byFormat[imgFormat], imgFormat, manifest);
      console.log('');
    }
  }

  // ── Process Text-Only Formats ──
  for (const txtFormat of ['linkedin-post', 'short-caption', 'broll-script']) {
    if (byFormat[txtFormat] && byFormat[txtFormat].length > 0) {
      console.log(`📝 ${txtFormat}: ${byFormat[txtFormat].length} pieces`);
      saveTextOnly(byFormat[txtFormat], txtFormat, manifest);
      console.log(`   ✅ Saved ${byFormat[txtFormat].length} text files\n`);
    }
  }

  // ── Write Production Manifest ──
  const manifestPath = path.join(OUTPUT_DIR, 'production-manifest.json');
  const summary = {
    produced_at: new Date().toISOString(),
    total_creatives: manifest.length,
    by_method: {},
    by_format: {},
    by_status: {},
  };

  for (const item of manifest) {
    summary.by_method[item.production_method] = (summary.by_method[item.production_method] || 0) + 1;
    summary.by_format[item.format] = (summary.by_format[item.format] || 0) + 1;
    summary.by_status[item.status] = (summary.by_status[item.status] || 0) + 1;
  }

  fs.writeFileSync(manifestPath, JSON.stringify({ summary, creatives: manifest }, null, 2));

  // ── Summary ──
  console.log(`${'='.repeat(60)}`);
  console.log('✅ PRODUCTION COMPLETE');
  console.log(`${'='.repeat(60)}`);
  console.log(`📊 Total creatives: ${manifest.length}`);

  for (const [method, count] of Object.entries(summary.by_method)) {
    console.log(`   ${method}: ${count}`);
  }

  console.log(`📄 Manifest: ${manifestPath}`);
  console.log(`\n👉 Next: npm run phase6:queue (build publish schedule)`);
}

main().catch(err => {
  console.error('❌ Production failed:', err.message);
  process.exit(1);
});

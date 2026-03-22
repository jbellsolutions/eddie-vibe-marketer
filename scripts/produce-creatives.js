#!/usr/bin/env node
/**
 * PHASE 4: Creative Production
 * - Loads generated scripts from Phase 3
 * - Ranks scripts by potential (based on source ad longevity + angle diversity)
 * - Top 10-15 scripts → exports for UGC creators (human filming)
 * - Remaining scripts → pushes to Arcads API for AI actor video generation
 * - Tracks all creative assets and their source scripts
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { createObjectCsvWriter } = require('csv-writer');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const ROOT = path.resolve(__dirname, '..');
const SCRIPTS_PATH = path.join(ROOT, 'data', 'generated-scripts', 'all-scripts.json');
const OUTPUT_DIR = path.join(ROOT, 'data', 'creatives');

const UGC_COUNT = 15; // Top N scripts go to human creators

// ─── Arcads API Client ───
class ArcadsClient {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://api.arcads.ai/v1';
  }

  async listActors() {
    const res = await axios.get(`${this.baseUrl}/actors`, {
      headers: { Authorization: `Bearer ${this.apiKey}` },
    });
    return res.data;
  }

  async createVideo(scriptText, actorId, options = {}) {
    const res = await axios.post(
      `${this.baseUrl}/videos`,
      {
        script: scriptText,
        actor_id: actorId,
        aspect_ratio: options.aspectRatio || '9:16',
        ...options,
      },
      { headers: { Authorization: `Bearer ${this.apiKey}` } }
    );
    return res.data;
  }

  async getVideoStatus(videoId) {
    const res = await axios.get(`${this.baseUrl}/videos/${videoId}`, {
      headers: { Authorization: `Bearer ${this.apiKey}` },
    });
    return res.data;
  }
}

// ─── Script Ranking ───
function rankScripts(scripts) {
  // Simple ranking: prioritize diversity of angles and competitors
  const seen = new Set();
  const ranked = [];

  for (const script of scripts) {
    const key = `${script.source_competitor}-${script.icp}`;
    if (!seen.has(key)) {
      seen.add(key);
      ranked.push({ ...script, priority: 'high' });
    } else {
      ranked.push({ ...script, priority: 'medium' });
    }
  }

  return ranked.sort((a, b) => (a.priority === 'high' ? -1 : 1));
}

// ─── Extract clean script text from generated output ───
function extractScriptText(generatedScript) {
  // Pull out HOOK + BODY + CTA, skip metadata
  const lines = generatedScript.split('\n');
  const parts = [];
  let capture = false;

  for (const line of lines) {
    if (line.startsWith('HOOK:') || line.startsWith('BODY:') || line.startsWith('CTA:')) {
      parts.push(line.replace(/^(HOOK|BODY|CTA):\s*/, ''));
      capture = true;
    } else if (line.startsWith('ANGLE:') || line.startsWith('WHY IT WORKS:')) {
      capture = false;
    } else if (capture) {
      parts.push(line);
    }
  }

  return parts.join(' ').trim();
}

// ─── Export for UGC Creators ───
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
    script: extractScriptText(s.generated_script),
    notes: `Film in 9:16 vertical. Keep under 45 seconds. Reference competitor ad #${s.source_ad_index} from ${s.source_competitor} for pacing/energy.`,
  }));

  await csvWriter.writeRecords(records);

  // Also save individual briefs as text files
  for (const s of scripts) {
    const briefPath = path.join(creatorsDir, `${s.id}-brief.txt`);
    const content = `SCRIPT ID: ${s.id}
TARGET AUDIENCE: ${s.icp}
INSPIRED BY: ${s.source_competitor} Ad #${s.source_ad_index}

--- SCRIPT ---
${extractScriptText(s.generated_script)}

--- FILMING NOTES ---
- Format: 9:16 vertical video
- Length: 15-45 seconds
- Energy: Match the vibe of the reference ad
- Film in good lighting, phone quality is fine
- Look at camera, be natural, don't read off a script word-for-word
`;
    fs.writeFileSync(briefPath, content);
  }

  return records.length;
}

// ─── Push to Arcads ───
async function pushToArcads(scripts, outputDir) {
  if (!process.env.ARCADS_API_KEY) {
    console.log('   ⏭️  No ARCADS_API_KEY set — skipping Arcads push');
    console.log('   📄 Scripts saved for manual upload instead');

    // Save scripts as a batch file for manual Arcads upload
    const manualDir = path.join(outputDir, 'arcads-manual-upload');
    fs.mkdirSync(manualDir, { recursive: true });

    for (const s of scripts) {
      const scriptPath = path.join(manualDir, `${s.id}-arcads.txt`);
      fs.writeFileSync(scriptPath, extractScriptText(s.generated_script));
    }

    return { queued: 0, manual: scripts.length };
  }

  const arcads = new ArcadsClient(process.env.ARCADS_API_KEY);
  const arcadsDir = path.join(outputDir, 'arcads-renders');
  fs.mkdirSync(arcadsDir, { recursive: true });

  // Get available actors
  const actors = await arcads.listActors();
  const actorPool = actors.slice(0, 5); // Use top 5 actors

  console.log(`   🎭 Using ${actorPool.length} Arcads actors`);

  const jobs = [];

  for (const script of scripts) {
    const scriptText = extractScriptText(script.generated_script);

    // Each script → multiple actors
    for (const actor of actorPool) {
      try {
        const video = await arcads.createVideo(scriptText, actor.id);
        jobs.push({
          script_id: script.id,
          actor_id: actor.id,
          actor_name: actor.name,
          video_id: video.id,
          status: 'rendering',
        });
        console.log(`   🎬 Queued: ${script.id} × ${actor.name}`);
      } catch (err) {
        console.log(`   ❌ Failed: ${script.id} × ${actor.name}: ${err.message}`);
      }

      // Rate limit
      await new Promise(r => setTimeout(r, 200));
    }
  }

  // Save job manifest
  fs.writeFileSync(
    path.join(arcadsDir, 'render-jobs.json'),
    JSON.stringify({ queued_at: new Date().toISOString(), jobs }, null, 2)
  );

  return { queued: jobs.length, manual: 0 };
}

async function main() {
  console.log('🤖 EDDIE — Phase 4: Creative Production');
  console.log('='.repeat(50));

  if (!fs.existsSync(SCRIPTS_PATH)) {
    console.error('❌ No scripts found. Run phase 3 first: npm run phase3:generate');
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(SCRIPTS_PATH, 'utf8'));
  const ranked = rankScripts(data.scripts);

  console.log(`📊 Loaded ${ranked.length} scripts`);

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  // Split: top scripts → UGC creators, rest → Arcads
  const ugcScripts = ranked.slice(0, UGC_COUNT);
  const arcadsScripts = ranked.slice(UGC_COUNT);

  console.log(`\n👤 UGC Creator Briefs: ${ugcScripts.length} scripts`);
  const ugcCount = await exportForCreators(ugcScripts, OUTPUT_DIR);
  console.log(`   ✅ Exported ${ugcCount} briefs to data/creatives/ugc-creator-briefs/`);

  console.log(`\n🤖 Arcads AI Actors: ${arcadsScripts.length} scripts`);
  const arcadsResult = await pushToArcads(arcadsScripts, OUTPUT_DIR);

  if (arcadsResult.queued > 0) {
    console.log(`   ✅ Queued ${arcadsResult.queued} renders on Arcads`);
  }
  if (arcadsResult.manual > 0) {
    console.log(`   📄 ${arcadsResult.manual} scripts saved for manual upload`);
  }

  // Summary
  const summary = {
    generated_at: new Date().toISOString(),
    total_scripts: ranked.length,
    ugc_briefs: ugcCount,
    arcads_queued: arcadsResult.queued,
    arcads_manual: arcadsResult.manual,
    estimated_total_creatives: ugcCount + (arcadsResult.queued || arcadsResult.manual) * 5,
  };

  fs.writeFileSync(path.join(OUTPUT_DIR, 'production-summary.json'), JSON.stringify(summary, null, 2));

  console.log(`\n${'='.repeat(50)}`);
  console.log(`✅ Production complete`);
  console.log(`   📹 Estimated total creatives: ${summary.estimated_total_creatives}`);
  console.log(`\n👉 Next: Run ads on Meta, then: npm run phase5:optimize`);
}

main().catch(err => {
  console.error('❌ Production failed:', err.message);
  process.exit(1);
});

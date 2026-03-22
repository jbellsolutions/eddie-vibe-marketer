#!/usr/bin/env node
/**
 * PHASE 1: Ad Research
 * - Scrapes Meta Ad Library via Apify for competitor video ads
 * - Downloads video ads
 * - Transcribes each with OpenAI Whisper
 * - Extracts hooks, angles, and body copy
 * - Outputs structured research to data/competitor-research/
 */

const { ApifyClient } = require('apify-client');
const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const config = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '..', 'config', 'research-config.json'), 'utf8')
);

const apify = new ApifyClient({ token: process.env.APIFY_API_TOKEN });
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const OUTPUT_DIR = path.resolve(__dirname, '..', config.output_dir);

async function scrapeCompetitorAds(competitor) {
  console.log(`\n🔍 Scraping ads for: ${competitor.name}`);

  const input = {
    country: config.meta_ad_library.default_country,
    adType: config.meta_ad_library.ad_type,
    adActiveStatus: config.meta_ad_library.active_only ? 'ACTIVE' : 'ALL',
    maxItems: config.meta_ad_library.max_ads_per_competitor,
  };

  if (competitor.advertiser_id) {
    input.advertiserId = competitor.advertiser_id;
  } else if (competitor.keywords && competitor.keywords.length > 0) {
    input.searchTerms = competitor.keywords;
  }

  const run = await apify.actor(config.meta_ad_library.apify_actor_id).call(input);
  const { items } = await apify.dataset(run.defaultDatasetId).listItems();

  console.log(`   Found ${items.length} ads`);
  return items;
}

async function downloadVideo(url, filepath) {
  const response = await axios({ url, responseType: 'stream' });
  const writer = fs.createWriteStream(filepath);
  response.data.pipe(writer);
  return new Promise((resolve, reject) => {
    writer.on('finish', resolve);
    writer.on('error', reject);
  });
}

async function transcribeVideo(filepath) {
  const file = fs.createReadStream(filepath);
  const transcription = await openai.audio.transcriptions.create({
    model: config.whisper.model,
    file,
    language: config.whisper.language,
    response_format: config.whisper.response_format,
  });
  return transcription;
}

function extractHook(transcript, maxWords = 20) {
  if (!transcript || !transcript.text) return '';
  const words = transcript.text.split(' ');
  return words.slice(0, maxWords).join(' ');
}

async function analyzeAd(ad, competitor, index) {
  const videoUrl = ad.videoUrl || ad.video_url || ad.media_url;
  if (!videoUrl) {
    console.log(`   ⏭️  Ad ${index + 1}: No video URL, skipping`);
    return null;
  }

  const competitorDir = path.join(OUTPUT_DIR, competitor.name.replace(/\s+/g, '-').toLowerCase());
  fs.mkdirSync(competitorDir, { recursive: true });

  const videoPath = path.join(competitorDir, `ad-${index + 1}.mp4`);
  const jsonPath = path.join(competitorDir, `ad-${index + 1}.json`);

  try {
    // Download
    console.log(`   📥 Downloading ad ${index + 1}...`);
    await downloadVideo(videoUrl, videoPath);

    // Transcribe
    console.log(`   🎤 Transcribing ad ${index + 1}...`);
    const transcript = await transcribeVideo(videoPath);

    // Extract data
    const result = {
      competitor: competitor.name,
      ad_index: index + 1,
      video_url: videoUrl,
      full_transcript: transcript.text,
      hook: extractHook(transcript),
      duration: transcript.duration || null,
      body_copy: ad.body || ad.ad_body || '',
      headline: ad.title || ad.headline || '',
      cta: ad.cta_text || ad.call_to_action || '',
      started_running: ad.startDate || ad.start_date || '',
      page_name: ad.pageName || ad.page_name || '',
      scraped_at: new Date().toISOString(),
    };

    fs.writeFileSync(jsonPath, JSON.stringify(result, null, 2));
    console.log(`   ✅ Ad ${index + 1}: "${result.hook.substring(0, 50)}..."`);

    // Clean up video to save space (keep transcript)
    fs.unlinkSync(videoPath);

    return result;
  } catch (err) {
    console.log(`   ❌ Ad ${index + 1}: ${err.message}`);
    return null;
  }
}

async function main() {
  console.log('🤖 EDDIE — Phase 1: Competitor Ad Research');
  console.log('='.repeat(50));

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const allResults = [];

  for (const competitor of config.competitors) {
    const ads = await scrapeCompetitorAds(competitor);

    // Sort by longest running (proxy for best performing)
    ads.sort((a, b) => {
      const dateA = new Date(a.startDate || a.start_date || 0);
      const dateB = new Date(b.startDate || b.start_date || 0);
      return dateA - dateB; // oldest first = longest running
    });

    for (let i = 0; i < ads.length; i++) {
      const result = await analyzeAd(ads[i], competitor, i);
      if (result) allResults.push(result);
    }
  }

  // Write master research file
  const masterPath = path.join(OUTPUT_DIR, 'research-summary.json');
  fs.writeFileSync(masterPath, JSON.stringify({
    generated_at: new Date().toISOString(),
    total_ads_analyzed: allResults.length,
    competitors: config.competitors.map(c => c.name),
    ads: allResults,
  }, null, 2));

  console.log(`\n${'='.repeat(50)}`);
  console.log(`✅ Research complete: ${allResults.length} ads analyzed`);
  console.log(`📄 Results saved to: ${masterPath}`);
  console.log(`\n👉 Next: npm run phase3:generate`);
}

main().catch(err => {
  console.error('❌ Research failed:', err.message);
  process.exit(1);
});

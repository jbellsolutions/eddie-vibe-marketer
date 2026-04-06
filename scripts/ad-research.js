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
require('dotenv').config({ override: true, path: path.resolve(__dirname, '..', '.env') });

const config = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '..', 'config', 'research-config.json'), 'utf8')
);

const apify = new ApifyClient({ token: process.env.APIFY_API_TOKEN });
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const OUTPUT_DIR = path.resolve(__dirname, '..', config.output_dir);

async function scrapeCompetitorAds(competitor) {
  console.log(`\n🔍 Scraping ads for: ${competitor.name}`);

  const input = {
    maxItems: config.meta_ad_library.max_ads_per_competitor,
  };

  // Support urls array (used by curious_coder/facebook-ads-library-scraper)
  if (competitor.urls && competitor.urls.length > 0) {
    input.urls = competitor.urls;
  } else if (competitor.startUrls && competitor.startUrls.length > 0) {
    input.urls = competitor.startUrls;
  } else if (competitor.advertiser_id) {
    const country = config.meta_ad_library.default_country || 'US';
    input.urls = [{
      url: `https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=${country}&view_all_page_id=${competitor.advertiser_id}`
    }];
  } else if (competitor.keywords && competitor.keywords.length > 0) {
    const country = config.meta_ad_library.default_country || 'US';
    input.urls = competitor.keywords.map(kw => ({
      url: `https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=${country}&q=${encodeURIComponent(kw)}`
    }));
  }

  if (!input.urls || input.urls.length === 0) {
    console.log(`   ⚠️  No URLs configured for ${competitor.name} — skipping`);
    return [];
  }

  console.log(`   📡 Scraping ${input.urls.length} URL(s)...`);

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
  // Handle curious_coder actor format (snapshot nested data)
  const snapshot = ad.snapshot || {};
  const videos = snapshot.videos || [];
  const images = snapshot.images || [];
  const cards = snapshot.cards || [];

  const videoUrl = (videos[0] || {}).video_hd_url || (videos[0] || {}).video_sd_url || ad.videoUrl || ad.video_url;
  const hasVideo = !!videoUrl;

  const competitorDir = path.join(OUTPUT_DIR, competitor.name.replace(/\s+/g, '-').toLowerCase());
  fs.mkdirSync(competitorDir, { recursive: true });

  const jsonPath = path.join(competitorDir, `ad-${index + 1}.json`);

  try {
    let transcript = { text: '', duration: null };

    if (hasVideo) {
      const videoPath = path.join(competitorDir, `ad-${index + 1}.mp4`);
      try {
        console.log(`   📥 Downloading ad ${index + 1} (video)...`);
        await downloadVideo(videoUrl, videoPath);
        console.log(`   🎤 Transcribing ad ${index + 1}...`);
        transcript = await transcribeVideo(videoPath);
      } catch (videoErr) {
        console.log(`   ⚠️  Ad ${index + 1}: Video failed (${videoErr.message}) — using text data`);
      } finally {
        if (fs.existsSync(videoPath)) fs.unlinkSync(videoPath);
      }
    } else {
      console.log(`   📄 Ad ${index + 1}: Image/text ad`);
    }

    // Extract body copy — handle both flat and snapshot formats
    const bodyCopy = snapshot.body?.text || ad.body || ad.ad_body || ad.ad_creative_body || '';
    const headline = snapshot.title || snapshot.link_title || ad.title || ad.headline || '';
    const ctaText = snapshot.cta_text || ad.cta_text || ad.call_to_action || '';
    const linkUrl = snapshot.link_url || '';

    // Extract card copy if carousel
    const cardCopy = cards.map(c => c.body || c.title || '').filter(Boolean).join(' | ');

    // Skip ads with no useful content
    const allCopy = bodyCopy + headline + (transcript.text || '') + cardCopy;
    if (!allCopy.trim()) {
      console.log(`   ⏭️  Ad ${index + 1}: No content found, skipping`);
      return null;
    }

    const hookSource = transcript.text || bodyCopy || headline;
    const hookWords = hookSource.split(/\s+/).slice(0, 20).join(' ');

    const result = {
      competitor: competitor.name,
      ad_index: index + 1,
      media_type: hasVideo ? 'video' : cards.length > 0 ? 'carousel' : images.length > 0 ? 'image' : 'text',
      video_url: videoUrl || null,
      full_transcript: transcript.text || null,
      hook: hookWords,
      duration: transcript.duration || null,
      body_copy: bodyCopy,
      headline: headline,
      cta: ctaText,
      link_url: linkUrl,
      card_copy: cardCopy || null,
      started_running: ad.start_date || ad.start_date_formatted || '',
      end_date: ad.end_date_formatted || null,
      page_name: ad.page_name || snapshot.page_name || '',
      page_id: ad.page_id || '',
      ad_library_url: ad.ad_library_url || '',
      is_active: ad.is_active || false,
      total_active_time: ad.total_active_time || null,
      spend: ad.spend || null,
      impressions: ad.impressions_with_index || null,
      publisher_platform: ad.publisher_platform || [],
      scraped_at: new Date().toISOString(),
    };

    fs.writeFileSync(jsonPath, JSON.stringify(result, null, 2));
    console.log(`   ✅ Ad ${index + 1} [${result.media_type}]: "${result.hook.substring(0, 50)}..."`);

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

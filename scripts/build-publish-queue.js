#!/usr/bin/env node
/**
 * PHASE 6a: Build Publish Queue
 *
 * Reads the production manifest and creates a time-scheduled publish queue.
 * Assigns each creative to platforms based on format and spreads posts
 * across days according to the publish-config.json schedule.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const MANIFEST_PATH = path.join(ROOT, 'data', 'creatives', 'production-manifest.json');
const PUBLISH_CONFIG_PATH = path.join(ROOT, 'config', 'publish-config.json');
const QUEUE_PATH = path.join(ROOT, 'data', 'publish-queue.json');

// Format → which platforms this format can be posted to
const FORMAT_PLATFORM_MAP = {
  'ugc-video':         ['facebook', 'instagram', 'tiktok'],
  'linkedin-post':     ['linkedin'],
  'screenshot-static': ['facebook', 'instagram'],
  'carousel':          ['facebook', 'instagram', 'linkedin'],
  'broll-script':      ['facebook', 'instagram', 'tiktok'],
  'text-overlay':      ['tiktok', 'instagram'],
  'short-caption':     ['facebook', 'instagram', 'tiktok'],
};

function main() {
  console.log('🤖 EDDIE V2 — Phase 6a: Build Publish Queue');
  console.log('='.repeat(50));

  if (!fs.existsSync(MANIFEST_PATH)) {
    console.error('❌ No production manifest found. Run phase 4 first: npm run phase4:produce');
    process.exit(1);
  }

  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
  const publishConfig = JSON.parse(fs.readFileSync(PUBLISH_CONFIG_PATH, 'utf8'));
  const enabledPlatforms = publishConfig.enabled_platforms || ['facebook', 'linkedin', 'instagram', 'tiktok'];

  // Filter to creatives that are ready and not yet published
  const readyCreatives = manifest.creatives.filter(c =>
    (c.status === 'ready' || c.status === 'brief_exported') &&
    (!c.published_to || c.published_to.length === 0)
  );

  console.log(`📊 Ready creatives: ${readyCreatives.length}`);
  console.log(`🌐 Enabled platforms: ${enabledPlatforms.join(', ')}\n`);

  // Build queue entries — one per creative per platform
  const queueEntries = [];
  const jitter = (publishConfig.jitter_minutes || 5) * 60 * 1000;

  for (const creative of readyCreatives) {
    const platforms = (FORMAT_PLATFORM_MAP[creative.format] || [])
      .filter(p => enabledPlatforms.includes(p));

    for (const platform of platforms) {
      // Extract caption from content
      let caption = '';
      if (creative.content) {
        caption = creative.content;
      } else if (creative.file_path && fs.existsSync(creative.file_path)) {
        // Try reading text content from file
        try {
          const ext = path.extname(creative.file_path);
          if (ext === '.txt') {
            caption = fs.readFileSync(creative.file_path, 'utf8');
          }
        } catch {
          // Non-text file — will have media but may need caption
        }
      }

      queueEntries.push({
        creative_id: creative.creative_id,
        format: creative.format,
        platform,
        caption: caption.substring(0, 2000), // Platform character limits
        file_path: creative.file_path || null,
        icp: creative.icp,
        status: 'pending',
        scheduled_for: null, // Will be assigned below
        attempts: 0,
        last_error: null,
      });
    }
  }

  // Assign schedule times — spread across days based on posts_per_day
  const now = new Date();
  const platformQueues = {};

  for (const entry of queueEntries) {
    if (!platformQueues[entry.platform]) platformQueues[entry.platform] = [];
    platformQueues[entry.platform].push(entry);
  }

  for (const [platform, entries] of Object.entries(platformQueues)) {
    const schedule = publishConfig.schedule[platform] || { posts_per_day: 1, times: ['12:00'] };
    const postsPerDay = schedule.posts_per_day || 1;
    const times = schedule.times || ['12:00'];

    let dayOffset = 0;
    let slotIndex = 0;

    for (const entry of entries) {
      // Calculate the scheduled date/time
      const schedDate = new Date(now);
      schedDate.setDate(schedDate.getDate() + dayOffset);

      const [hours, minutes] = times[slotIndex % times.length].split(':').map(Number);
      schedDate.setHours(hours, minutes, 0, 0);

      // Add random jitter
      const jitterMs = Math.floor(Math.random() * jitter * 2) - jitter;
      schedDate.setTime(schedDate.getTime() + jitterMs);

      entry.scheduled_for = schedDate.toISOString();

      slotIndex++;
      if (slotIndex >= postsPerDay) {
        slotIndex = 0;
        dayOffset++;
      }
    }
  }

  // Sort all entries by scheduled time
  queueEntries.sort((a, b) => new Date(a.scheduled_for) - new Date(b.scheduled_for));

  // Write queue
  const queue = {
    built_at: new Date().toISOString(),
    total_items: queueEntries.length,
    by_platform: {},
    estimated_days: 0,
    queue: queueEntries,
  };

  for (const entry of queueEntries) {
    queue.by_platform[entry.platform] = (queue.by_platform[entry.platform] || 0) + 1;
  }

  if (queueEntries.length > 0) {
    const firstDate = new Date(queueEntries[0].scheduled_for);
    const lastDate = new Date(queueEntries[queueEntries.length - 1].scheduled_for);
    queue.estimated_days = Math.ceil((lastDate - firstDate) / (1000 * 60 * 60 * 24)) + 1;
  }

  fs.writeFileSync(QUEUE_PATH, JSON.stringify(queue, null, 2));

  // Summary
  console.log(`📋 Publish Queue Built:`);
  console.log(`   Total items: ${queue.total_items}`);
  for (const [platform, count] of Object.entries(queue.by_platform)) {
    console.log(`   ${platform}: ${count} posts`);
  }
  console.log(`   Estimated duration: ${queue.estimated_days} days`);

  if (queueEntries.length > 0) {
    console.log(`\n   First post: ${queueEntries[0].scheduled_for}`);
    console.log(`   Last post: ${queueEntries[queueEntries.length - 1].scheduled_for}`);
  }

  console.log(`\n📄 Queue saved to: ${QUEUE_PATH}`);
  console.log(`\n👉 Next: npm run phase6:publish (processes the queue)`);
}

main();

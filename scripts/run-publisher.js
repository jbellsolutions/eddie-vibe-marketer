#!/usr/bin/env node
/**
 * PHASE 6b: Run Publisher
 *
 * Processes the publish queue one item at a time.
 * Calls the Python Browser Use publisher for each item.
 * Updates queue status and writes to publish-log.json.
 *
 * Usage:
 *   npm run phase6:publish              # Process all due items
 *   npm run phase6:publish -- --dry-run # Preview what would be published
 *   npm run phase6:publish -- --limit 3 # Publish max 3 items
 */

const { execFile } = require('child_process');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const ROOT = path.resolve(__dirname, '..');
const QUEUE_PATH = path.join(ROOT, 'data', 'publish-queue.json');
const LOG_PATH = path.join(ROOT, 'data', 'publish-log.json');
const PUBLISH_CONFIG_PATH = path.join(ROOT, 'config', 'publish-config.json');
const PUBLISHER_SCRIPT = path.join(ROOT, 'publisher', 'publish.py');

function loadConfig() {
  return JSON.parse(fs.readFileSync(PUBLISH_CONFIG_PATH, 'utf8'));
}

function loadQueue() {
  if (!fs.existsSync(QUEUE_PATH)) return null;
  return JSON.parse(fs.readFileSync(QUEUE_PATH, 'utf8'));
}

function saveQueue(queue) {
  fs.writeFileSync(QUEUE_PATH, JSON.stringify(queue, null, 2));
}

function appendLog(entry) {
  let log = [];
  if (fs.existsSync(LOG_PATH)) {
    log = JSON.parse(fs.readFileSync(LOG_PATH, 'utf8'));
  }
  log.push(entry);
  fs.writeFileSync(LOG_PATH, JSON.stringify(log, null, 2));
}

function callPublisher(python, platform, caption, filePath) {
  return new Promise((resolve, reject) => {
    const args = [PUBLISHER_SCRIPT, '--platform', platform, '--caption', caption];
    if (filePath && fs.existsSync(filePath)) {
      args.push('--file', filePath);
    }

    execFile(python, args, {
      timeout: 180000, // 3 min max per post
      env: { ...process.env },
    }, (err, stdout, stderr) => {
      if (err) {
        // Try to parse stdout even on error (publisher may output JSON before failing)
        try {
          resolve(JSON.parse(stdout));
        } catch {
          reject(new Error(stderr || err.message));
        }
        return;
      }

      try {
        resolve(JSON.parse(stdout));
      } catch {
        resolve({ success: false, message: `Unparseable output: ${stdout}` });
      }
    });
  });
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const limitArg = args.indexOf('--limit');
  const limit = limitArg >= 0 ? parseInt(args[limitArg + 1], 10) : Infinity;

  console.log('🤖 EDDIE V2 — Phase 6b: Run Publisher');
  console.log('='.repeat(50));

  if (dryRun) console.log('🏜️  DRY RUN — no posts will be published\n');

  const queue = loadQueue();
  if (!queue || !queue.queue) {
    console.error('❌ No publish queue found. Run: npm run phase6:queue');
    process.exit(1);
  }

  const config = loadConfig();
  const python = config.python_venv || 'python3';
  const maxRetries = config.max_retries || 2;
  const retryDelay = (config.retry_delay_seconds || 60) * 1000;

  // Filter to pending items that are due
  const now = new Date();
  const dueItems = queue.queue.filter(item =>
    item.status === 'pending' && new Date(item.scheduled_for) <= now
  );

  const toProcess = dueItems.slice(0, limit);

  console.log(`📋 Queue: ${queue.queue.length} total, ${dueItems.length} due now`);
  console.log(`📝 Processing: ${toProcess.length} items\n`);

  if (toProcess.length === 0) {
    const nextItem = queue.queue.find(i => i.status === 'pending');
    if (nextItem) {
      console.log(`⏰ Next item due: ${nextItem.scheduled_for} (${nextItem.platform})`);
    } else {
      console.log('✅ All items published or no pending items.');
    }
    return;
  }

  let published = 0;
  let failed = 0;

  for (const item of toProcess) {
    console.log(`\n[${published + failed + 1}/${toProcess.length}] ${item.platform}: ${item.creative_id}`);
    console.log(`   Format: ${item.format} | ICP: ${item.icp}`);
    console.log(`   Caption: ${(item.caption || '').substring(0, 80)}...`);

    if (dryRun) {
      console.log('   🏜️  SKIP (dry run)');
      continue;
    }

    try {
      const result = await callPublisher(python, item.platform, item.caption, item.file_path);

      if (result.success) {
        item.status = 'published';
        item.published_at = new Date().toISOString();
        published++;
        console.log(`   ✅ Published`);
      } else {
        item.attempts++;
        if (item.attempts >= maxRetries) {
          item.status = 'failed';
          item.last_error = result.message;
          failed++;
          console.log(`   ❌ Failed (max retries): ${result.message}`);
        } else {
          item.last_error = result.message;
          console.log(`   ⚠️  Failed (attempt ${item.attempts}/${maxRetries}): ${result.message}`);
          // Wait before retry
          console.log(`   ⏰ Waiting ${config.retry_delay_seconds}s before retry...`);
          await new Promise(r => setTimeout(r, retryDelay));

          // Retry immediately
          const retryResult = await callPublisher(python, item.platform, item.caption, item.file_path);
          if (retryResult.success) {
            item.status = 'published';
            item.published_at = new Date().toISOString();
            published++;
            console.log(`   ✅ Published (retry succeeded)`);
          } else {
            item.attempts++;
            item.status = item.attempts >= maxRetries ? 'failed' : 'pending';
            item.last_error = retryResult.message;
            failed++;
            console.log(`   ❌ Failed: ${retryResult.message}`);
          }
        }
      }

      // Log every result
      appendLog({
        creative_id: item.creative_id,
        platform: item.platform,
        format: item.format,
        status: item.status,
        attempts: item.attempts,
        timestamp: new Date().toISOString(),
        error: item.last_error,
      });

    } catch (err) {
      item.attempts++;
      item.status = item.attempts >= maxRetries ? 'failed' : 'pending';
      item.last_error = err.message;
      failed++;
      console.log(`   ❌ Error: ${err.message}`);

      appendLog({
        creative_id: item.creative_id,
        platform: item.platform,
        format: item.format,
        status: 'error',
        attempts: item.attempts,
        timestamp: new Date().toISOString(),
        error: err.message,
      });
    }

    // Save queue after each item (crash-safe)
    saveQueue(queue);

    // Pause between posts (appear human)
    const pauseMs = 5000 + Math.random() * 10000; // 5-15 seconds
    await new Promise(r => setTimeout(r, pauseMs));
  }

  // Summary
  console.log(`\n${'='.repeat(50)}`);
  console.log(`📊 Publishing Results:`);
  console.log(`   Published: ${published}`);
  console.log(`   Failed: ${failed}`);

  const remaining = queue.queue.filter(i => i.status === 'pending').length;
  console.log(`   Remaining in queue: ${remaining}`);

  if (remaining > 0) {
    const nextItem = queue.queue.find(i => i.status === 'pending');
    console.log(`   Next due: ${nextItem.scheduled_for}`);
  }

  console.log(`\n📄 Queue: ${QUEUE_PATH}`);
  console.log(`📄 Log: ${LOG_PATH}`);
}

main().catch(err => {
  console.error('❌ Publisher failed:', err.message);
  process.exit(1);
});

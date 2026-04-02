/**
 * Image Generator
 *
 * Renders static images from HTML templates using Puppeteer.
 * Used for screenshot-style ads, carousels, and text overlay cards.
 * No external API needed — free, fast, full control.
 */

const fs = require('fs');
const path = require('path');

const TEMPLATES_DIR = path.resolve(__dirname, '..', '..', 'templates', 'image-templates');

/**
 * Parse screenshot-static format content into structured data
 */
function parseScreenshotContent(content) {
  const formatMatch = content.match(/FORMAT:\s*(.+)/i);
  const headlineMatch = content.match(/HEADLINE:\s*(.+)/i);
  const subtextMatch = content.match(/SUBTEXT:\s*(.+)/i);

  return {
    format: formatMatch ? formatMatch[1].trim() : 'tweet',
    headline: headlineMatch ? headlineMatch[1].trim() : content.substring(0, 100),
    subtext: subtextMatch ? subtextMatch[1].trim() : '',
  };
}

/**
 * Parse carousel format content into slides
 */
function parseCarouselContent(content) {
  const slides = [];
  const slideMatches = content.matchAll(/SLIDE\s*\d+[^:]*:\s*(.+)/gi);

  for (const match of slideMatches) {
    slides.push(match[1].trim());
  }

  if (slides.length === 0) {
    // Fallback: split by numbered lines
    const lines = content.split('\n').filter(l => /^\d+[\.\):]/.test(l.trim()));
    for (const line of lines) {
      slides.push(line.replace(/^\d+[\.\):]\s*/, '').trim());
    }
  }

  return slides;
}

/**
 * Parse text-overlay cards
 */
function parseTextOverlayContent(content) {
  const cards = [];
  const cardMatches = content.matchAll(/CARD\s*\d+:\s*(.+)/gi);

  for (const match of cardMatches) {
    cards.push(match[1].trim());
  }

  return cards;
}

/**
 * Generate a screenshot-style static image
 * Returns the HTML string that Puppeteer will render
 */
function buildScreenshotHTML(data, template = 'dark') {
  const { headline, subtext, format } = data;

  if (format === 'text-message' || format === 'text_message') {
    return buildTextMessageHTML(headline, subtext);
  }

  if (format === 'notes-app' || format === 'notes_app') {
    return buildNotesAppHTML(headline, subtext);
  }

  if (format === 'review-screenshot' || format === 'review_screenshot') {
    return buildReviewHTML(headline, subtext);
  }

  // Default: tweet style
  return buildTweetHTML(headline, subtext);
}

function buildTweetHTML(headline, subtext) {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
  body { margin: 0; padding: 40px; background: #15202b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; box-sizing: border-box; }
  .tweet { background: #192734; border: 1px solid #38444d; border-radius: 16px; padding: 20px; max-width: 500px; width: 100%; }
  .header { display: flex; align-items: center; margin-bottom: 12px; }
  .avatar { width: 48px; height: 48px; border-radius: 50%; background: #1da1f2; margin-right: 12px; }
  .name { color: #fff; font-weight: 700; font-size: 15px; }
  .handle { color: #8899a6; font-size: 14px; }
  .text { color: #fff; font-size: 20px; line-height: 1.4; margin-bottom: 12px; }
  .subtext { color: #8899a6; font-size: 15px; line-height: 1.4; }
  .time { color: #8899a6; font-size: 14px; margin-top: 12px; border-top: 1px solid #38444d; padding-top: 12px; }
</style></head><body>
  <div class="tweet">
    <div class="header"><div class="avatar"></div><div><div class="name">You</div><div class="handle">@you</div></div></div>
    <div class="text">${escapeHTML(headline)}</div>
    ${subtext ? `<div class="subtext">${escapeHTML(subtext)}</div>` : ''}
    <div class="time">Just now</div>
  </div>
</body></html>`;
}

function buildTextMessageHTML(headline, subtext) {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
  body { margin: 0; padding: 40px; background: #000; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro', sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; box-sizing: border-box; }
  .messages { max-width: 400px; width: 100%; }
  .bubble { padding: 12px 16px; border-radius: 18px; margin-bottom: 8px; font-size: 17px; line-height: 1.4; max-width: 80%; }
  .sent { background: #007aff; color: #fff; margin-left: auto; border-bottom-right-radius: 4px; }
  .received { background: #3a3a3c; color: #fff; border-bottom-left-radius: 4px; }
  .time { color: #8e8e93; font-size: 12px; text-align: center; margin-bottom: 8px; }
</style></head><body>
  <div class="messages">
    <div class="time">Today</div>
    <div class="bubble received">${escapeHTML(headline)}</div>
    ${subtext ? `<div class="bubble sent">${escapeHTML(subtext)}</div>` : ''}
  </div>
</body></html>`;
}

function buildNotesAppHTML(headline, subtext) {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
  body { margin: 0; padding: 40px; background: #1c1c1e; font-family: -apple-system, BlinkMacSystemFont, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; box-sizing: border-box; }
  .note { background: #2c2c2e; border-radius: 12px; padding: 24px; max-width: 400px; width: 100%; }
  .title { color: #fff; font-size: 22px; font-weight: 700; margin-bottom: 12px; line-height: 1.3; }
  .body { color: #ebebf5cc; font-size: 17px; line-height: 1.5; }
  .date { color: #8e8e93; font-size: 13px; margin-bottom: 16px; }
</style></head><body>
  <div class="note">
    <div class="date">${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</div>
    <div class="title">${escapeHTML(headline)}</div>
    ${subtext ? `<div class="body">${escapeHTML(subtext)}</div>` : ''}
  </div>
</body></html>`;
}

function buildReviewHTML(headline, subtext) {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
  body { margin: 0; padding: 40px; background: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; box-sizing: border-box; }
  .review { background: #fff; border-radius: 12px; padding: 20px; max-width: 400px; width: 100%; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
  .stars { color: #ff9500; font-size: 20px; margin-bottom: 8px; }
  .text { color: #1c1c1e; font-size: 16px; line-height: 1.5; margin-bottom: 8px; }
  .author { color: #8e8e93; font-size: 14px; }
  .subtext { color: #3a3a3c; font-size: 14px; font-style: italic; margin-top: 8px; }
</style></head><body>
  <div class="review">
    <div class="stars">★★★★★</div>
    <div class="text">"${escapeHTML(headline)}"</div>
    ${subtext ? `<div class="subtext">${escapeHTML(subtext)}</div>` : ''}
    <div class="author">— Verified User</div>
  </div>
</body></html>`;
}

/**
 * Build a carousel slide HTML
 */
function buildCarouselSlideHTML(text, slideNumber, totalSlides, isFirst = false, isLast = false) {
  const bgColor = isFirst ? '#1a1a2e' : isLast ? '#e94560' : '#16213e';
  const fontSize = isFirst ? '32px' : isLast ? '28px' : '24px';

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
  body { margin: 0; padding: 0; background: ${bgColor}; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif; display: flex; align-items: center; justify-content: center; width: 1080px; height: 1080px; }
  .slide { padding: 80px; text-align: center; }
  .text { color: #fff; font-size: ${fontSize}; font-weight: 700; line-height: 1.3; }
  .counter { position: absolute; bottom: 40px; right: 40px; color: rgba(255,255,255,0.4); font-size: 16px; }
  .swipe { position: absolute; bottom: 40px; left: 40px; color: rgba(255,255,255,0.5); font-size: 14px; }
</style></head><body>
  <div class="slide">
    <div class="text">${escapeHTML(text)}</div>
  </div>
  <div class="counter">${slideNumber}/${totalSlides}</div>
  ${!isLast ? '<div class="swipe">Swipe →</div>' : ''}
</body></html>`;
}

/**
 * Build a text overlay card HTML
 */
function buildTextOverlayCardHTML(text, cardNumber) {
  const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#6c5ce7', '#a29bfe'];
  const bgColor = colors[cardNumber % colors.length];

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
  body { margin: 0; padding: 0; background: ${bgColor}; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif; display: flex; align-items: center; justify-content: center; width: 1080px; height: 1920px; }
  .text { color: #fff; font-size: 64px; font-weight: 800; text-align: center; padding: 80px; line-height: 1.2; text-shadow: 0 4px 12px rgba(0,0,0,0.3); }
</style></head><body>
  <div class="text">${escapeHTML(text)}</div>
</body></html>`;
}

function escapeHTML(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Render HTML to PNG using Puppeteer
 *
 * @param {object} puppeteerBrowser - Puppeteer browser instance (caller manages lifecycle)
 * @param {string} html - HTML string to render
 * @param {string} outputPath - Where to save the PNG
 * @param {object} viewport - { width, height } defaults to 1080x1080
 */
async function renderHTMLToPNG(puppeteerBrowser, html, outputPath, viewport = { width: 1080, height: 1080 }) {
  const page = await puppeteerBrowser.newPage();
  await page.setViewport(viewport);
  await page.setContent(html, { waitUntil: 'networkidle0' });
  await page.screenshot({ path: outputPath, type: 'png' });
  await page.close();
}

module.exports = {
  parseScreenshotContent,
  parseCarouselContent,
  parseTextOverlayContent,
  buildScreenshotHTML,
  buildCarouselSlideHTML,
  buildTextOverlayCardHTML,
  renderHTMLToPNG,
};

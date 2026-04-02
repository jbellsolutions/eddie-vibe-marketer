/**
 * Content Format Definitions
 *
 * Each format defines: prompt template, output structure, word count targets,
 * platform targets, and generation tier.
 *
 * Tiers control volume:
 *   1 = generate for ALL competitor ads
 *   2 = generate for top 50% of ads (by longevity)
 *   3 = generate for top 20% of ads
 */

const fs = require('fs');
const path = require('path');

const FORMATS_CONFIG_PATH = path.resolve(__dirname, '..', '..', 'config', 'formats.json');

let _formatsConfig = null;

function loadFormatsConfig() {
  if (_formatsConfig) return _formatsConfig;
  if (fs.existsSync(FORMATS_CONFIG_PATH)) {
    _formatsConfig = JSON.parse(fs.readFileSync(FORMATS_CONFIG_PATH, 'utf8'));
  }
  return _formatsConfig;
}

/**
 * Get all enabled formats, respecting the config file if it exists
 */
function getEnabledFormats() {
  const config = loadFormatsConfig();
  const allFormats = Object.keys(FORMAT_DEFINITIONS);

  if (config && config.formats) {
    return allFormats.filter(key => {
      const override = config.formats[key];
      return override ? override.enabled !== false : true;
    });
  }

  return allFormats;
}

/**
 * Build the user prompt for a specific format + competitor ad + ICP
 */
function buildUserPrompt(format, competitorAd, icp) {
  const def = FORMAT_DEFINITIONS[format];
  if (!def) throw new Error(`Unknown format: ${format}`);
  return def.buildPrompt(competitorAd, icp);
}

// ─── Format Definitions ───

const FORMAT_DEFINITIONS = {
  'ugc-video': {
    name: 'UGC Video Script',
    tier: 1,
    maxTokens: 1024,
    platforms: ['facebook', 'instagram', 'tiktok'],
    buildPrompt: (ad, icp) => `Here is a competitor's video ad that's performing well:

COMPETITOR: ${ad.competitor}
HOOK: ${ad.hook}
FULL TRANSCRIPT: ${ad.full_transcript}
BODY COPY: ${ad.body_copy}
HEADLINE: ${ad.headline}
CTA: ${ad.cta}

Write a NEW original 15-45 second video ad script for OUR product that:
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
WHY IT WORKS: [1 sentence — why this structure converts]`,
  },

  'linkedin-post': {
    name: 'LinkedIn Post',
    tier: 2,
    maxTokens: 1500,
    platforms: ['linkedin'],
    buildPrompt: (ad, icp) => `Here is a competitor's ad that's performing well:

COMPETITOR: ${ad.competitor}
HOOK: ${ad.hook}
FULL TRANSCRIPT: ${ad.full_transcript}
ANGLE: The reason this ad works is its psychological angle — extract it.

Write a LinkedIn text post (150-300 words) for OUR product using the same psychological angle. This is a personal profile post, not an ad. It should feel like a founder sharing a genuine insight.

Rules:
1. HOOK LINE: First line must stop the scroll. Bold claim or unexpected insight. Max 12 words.
2. BODY: 5-8 short paragraphs. One idea per paragraph. Use line breaks between each.
3. Write in first person ("I" not "we")
4. Include one specific story, stat, or example — not generic claims
5. Speaks directly to ${icp.name}
6. CTA: End with a soft call to action (comment, DM, link in comments)
7. Follow every rule in writing-rules.md

Output format:
HOOK LINE: [the scroll-stopping first line]
BODY:
[paragraph 1]

[paragraph 2]

[paragraph 3]

[etc.]
CTA: [soft call to action]
HASHTAGS: [3-5 relevant hashtags]
ANGLE: [1 sentence — the psychological angle]`,
  },

  'screenshot-static': {
    name: 'Screenshot Static Ad',
    tier: 2,
    maxTokens: 512,
    platforms: ['facebook', 'instagram'],
    buildPrompt: (ad, icp) => `Here is a competitor's ad that's performing well:

COMPETITOR: ${ad.competitor}
HOOK: ${ad.hook}
FULL TRANSCRIPT: ${ad.full_transcript}

Write a "screenshot-style" static ad — the kind that looks like a text message, tweet, or note screenshot. These outperform polished creative by 20-40% because they bypass ad blindness.

Rules:
1. Total text: 20-40 words maximum
2. Must feel raw, real, unpolished — like someone screenshotted a genuine moment
3. Uses the same psychological angle as the competitor ad
4. Speaks to ${icp.name}
5. Follow writing-rules.md (no AI slop)

Output format:
FORMAT: [choose: text-message | tweet | notes-app | review-screenshot]
HEADLINE: [the main text, 10-25 words]
SUBTEXT: [optional secondary line, 5-15 words]
ANGLE: [1 sentence — what psychological angle this uses]`,
  },

  'carousel': {
    name: 'Carousel Post',
    tier: 3,
    maxTokens: 1500,
    platforms: ['facebook', 'instagram', 'linkedin'],
    buildPrompt: (ad, icp) => `Here is a competitor's ad that's performing well:

COMPETITOR: ${ad.competitor}
HOOK: ${ad.hook}
FULL TRANSCRIPT: ${ad.full_transcript}

Write a 5-7 slide carousel post for OUR product. Carousels get 30-50% lower CPA than single images. Each swipe must create enough curiosity to drive the next swipe.

Rules:
1. COVER SLIDE: Bold hook, 5-10 words. Must create curiosity gap.
2. SLIDES 2-5: One clear idea per slide, 15-25 words each. Build toward the payoff.
3. CTA SLIDE: Clear next step, 10-15 words.
4. Use the same psychological angle as the competitor ad
5. Speaks to ${icp.name}
6. Follow writing-rules.md

Output format:
SLIDE 1 (COVER): [hook text]
SLIDE 2: [idea/point]
SLIDE 3: [idea/point]
SLIDE 4: [idea/point]
SLIDE 5: [idea/point]
SLIDE 6 (CTA): [call to action]
ANGLE: [1 sentence — the psychological angle]`,
  },

  'broll-script': {
    name: 'B-Roll Voiceover Script',
    tier: 3,
    maxTokens: 1024,
    platforms: ['facebook', 'instagram', 'tiktok'],
    buildPrompt: (ad, icp) => `Here is a competitor's ad that's performing well:

COMPETITOR: ${ad.competitor}
HOOK: ${ad.hook}
FULL TRANSCRIPT: ${ad.full_transcript}

Write a 15-30 second voiceover script for a b-roll video ad. No person on camera — just stock footage/product shots with a voiceover. These perform at 70-90% of UGC and cost almost nothing to produce.

Rules:
1. VOICEOVER: 40-100 words, conversational tone, reads naturally aloud
2. VISUAL DIRECTION: Brief notes on what footage should show during each section
3. Uses the same angle as the competitor ad
4. Speaks to ${icp.name}
5. Follow writing-rules.md

Output format:
VOICEOVER: [the spoken script]
VISUAL DIRECTION:
- [0-5s]: [what's on screen]
- [5-15s]: [what's on screen]
- [15-25s]: [what's on screen]
- [25-30s]: [CTA screen]
CTA: [what to do next]
ANGLE: [1 sentence — the psychological angle]`,
  },

  'text-overlay': {
    name: 'Animated Text Overlay',
    tier: 2,
    maxTokens: 512,
    platforms: ['tiktok', 'instagram'],
    buildPrompt: (ad, icp) => `Here is a competitor's ad that's performing well:

COMPETITOR: ${ad.competitor}
HOOK: ${ad.hook}
FULL TRANSCRIPT: ${ad.full_transcript}

Write 5-6 text cards for an animated text overlay video. No voice, no face — just bold text appearing on screen with music. These work as pattern interrupts and perform at 80-100% of UGC.

Rules:
1. Each card: 3-8 words maximum. Punchy. Sentence fragments OK.
2. Card 1 must be a hook that stops the scroll
3. Build tension or curiosity across cards
4. Last card is the CTA
5. Uses the same angle as the competitor ad
6. Speaks to ${icp.name}
7. Follow writing-rules.md

Output format:
CARD 1: [hook — stops the scroll]
CARD 2: [builds on hook]
CARD 3: [key insight or claim]
CARD 4: [proof or contrast]
CARD 5: [payoff]
CARD 6: [CTA]
ANGLE: [1 sentence — the psychological angle]`,
  },

  'short-caption': {
    name: 'Short Caption',
    tier: 1,
    maxTokens: 512,
    platforms: ['facebook', 'instagram', 'tiktok'],
    buildPrompt: (ad, icp) => `Here is a competitor's ad that's performing well:

COMPETITOR: ${ad.competitor}
HOOK: ${ad.hook}
FULL TRANSCRIPT: ${ad.full_transcript}

Write a short social media caption (30-60 words) for OUR product using the same psychological angle. This caption will accompany a video or image post.

Rules:
1. First line is the hook — must stop the scroll
2. 2-3 short sentences max after the hook
3. End with a CTA (comment, link, DM)
4. Speaks to ${icp.name}
5. Follow writing-rules.md

Output format:
CAPTION: [the full caption text]
HASHTAGS: [3-5 relevant hashtags]
ANGLE: [1 sentence — the psychological angle]`,
  },
};

module.exports = {
  FORMAT_DEFINITIONS,
  getEnabledFormats,
  buildUserPrompt,
  loadFormatsConfig,
};

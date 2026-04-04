# Eddie Vibe Marketer V2

A self-improving AI content system that scrapes competitor ads, generates 7 content formats with legendary copywriter DNA, produces avatar videos and static images, and publishes directly to your personal social profiles — all from one command.

Inspired by [Ernesto Lopez's $300K/yr app marketing system](https://x.com/ErnestoSOFTWARE).

---

## How It Works

Eddie runs in **cycles**. Each cycle has 6 phases:

```
 RESEARCH        GENERATE           QUALITY GATE       PRODUCE            PUBLISH           OPTIMIZE
 ─────────       ────────           ────────────       ───────            ───────           ────────
 Scrape Meta     Claude generates   Batch review       HeyGen avatars,    Browser Use       Pull ad data,
 Ad Library +    7 formats with     against writing    Argil clones,      posts to your     find winners,
 transcribe      Titan copywriter   rules. Pass,       Puppeteer images,  personal FB,      feed learnings
 with Whisper.   DNA injected.      fail, or rewrite.  UGC briefs.        LI, IG, TikTok.   into next cycle.

 Phase 1          Phase 3            Phase 3.5          Phase 4            Phase 6           Phase 5
 (automated)      (automated)        (automated)        (automated)        (automated)       (after data)
```

**One cycle = ~40 minutes of automation. Run `npm run full-cycle` and walk away.**

Each cycle gets smarter: Phase 5 identifies which ICPs, formats, platforms, and angles produced winners, then biases the next generation cycle toward those patterns.

---

## What's New in V2

| V1 | V2 |
|----|-----|
| 1 format (UGC video scripts) | 7 formats (UGC video, LinkedIn posts, screenshot statics, carousels, b-roll scripts, text overlays, short captions) |
| Generic Claude prompts | 18 Titan copywriter agents inject legendary copywriter DNA (Hormozi, Kennedy, Schwartz, etc.) |
| Arcads only ($1,100/mo for 100 videos) | HeyGen ($29/mo unlimited) + Argil ($149/mo personal clone) + Puppeteer static images |
| No publishing | Browser Use auto-posts to personal Facebook, LinkedIn, Instagram, TikTok |
| No quality review | Quality gate batch-reviews all scripts against writing rules before production |
| Track ICPs + angles only | Track ICPs + angles + formats + platforms for smarter optimization |

---

## What's In The Box

```
eddie-vibe-marketer/
├── scripts/                        # Phase executors (Node.js)
│   ├── ad-research.js              # Phase 1: Apify scrape + Whisper transcription
│   ├── voice-check.js              # Phase 2: Brand voice validation (one-time)
│   ├── generate-scripts.js         # Phase 3: Multi-format generation with Titans
│   ├── quality-gate.js             # Phase 3.5: Batch quality review
│   ├── produce-creatives.js        # Phase 4: Videos + images + UGC briefs
│   ├── optimize-loop.js            # Phase 5: Performance analysis + learnings
│   ├── build-publish-queue.js      # Phase 6a: Schedule posts per platform
│   ├── run-publisher.js            # Phase 6b: Execute publish queue
│   ├── full-cycle.js               # Orchestrator: 1 → 3 → 3.5 → 4 → 6a
│   ├── setup.js                    # Validates env + dependencies + configs
│   └── lib/                        # Shared modules
│       ├── titan-router.js         # Routes formats → copywriter agents
│       ├── formats.js              # 7 format definitions + prompt templates
│       ├── generator.js            # Content generation engine (Claude API)
│       ├── heygen-client.js        # HeyGen v2 API wrapper
│       ├── argil-client.js         # Argil API wrapper (personal clone)
│       └── image-generator.js      # Puppeteer HTML → PNG renderer
├── publisher/                      # Browser Use publisher (Python)
│   ├── publish.py                  # Entry point — called from Node via execFile
│   ├── requirements.txt            # browser-use, langchain-anthropic
│   └── platforms/                  # Per-platform posting logic
│       ├── facebook.py             #   Personal profile posting
│       ├── linkedin.py             #   Feed posts + articles
│       ├── instagram.py            #   Web interface posting
│       └── tiktok.py               #   Video upload flow
├── titans/                         # Titan Genome — 18 copywriter agents
│   ├── council/agents/             # Agent JSONs (Hormozi, Kennedy, etc.)
│   ├── config/                     # Router + author definitions
│   └── SWIPE_FILE_CONTEXT.md       # Copywriting principles reference
├── brand-voice/                    # Your brand identity (fill out once)
│   ├── voice.md                    # Tone, personality, vocabulary
│   ├── product.md                  # Product details, features, positioning
│   ├── icp.md                      # 2-4 audience personas (the multiplier)
│   └── writing-rules.md           # Anti-AI-slop rules (pre-configured)
├── config/                         # System configuration
│   ├── .env.example                # API key template
│   ├── research-config.json        # Competitor list + scraping settings
│   ├── formats.json                # Format enable/disable + tier config
│   ├── avatar-config.json          # ICP → avatar mappings (HeyGen/Argil)
│   └── publish-config.json         # Per-platform schedule + Chrome profile
├── templates/image-templates/      # HTML templates for Puppeteer rendering
├── data/                           # Runtime output (gitignored)
│   ├── competitor-research/        # Phase 1 output
│   ├── generated-scripts/          # Phase 3 output (by-format/)
│   ├── creatives/                  # Phase 4 output (videos, images, briefs)
│   ├── ad-performance/             # Phase 5 data + learnings.json
│   ├── publish-queue.json          # Phase 6a output
│   └── publish-log.json            # Phase 6b execution log
├── tests/                          # Smoke tests
├── ARCHITECTURE.md                 # Full data flow diagrams
├── AGENTS.md                       # AI agent documentation
├── ETHOS.md                        # Project principles
├── CHANGELOG.md                    # Version history
├── WALKTHROUGH.md                  # Interactive setup guide
└── DEPLOYMENT-GUIDE.md             # Detailed deployment instructions
```

---

## Prerequisites

- **Node.js** 18+ (`node -v`)
- **Python** 3.10+ (`python3 --version`) — for Browser Use publisher
- **Google Chrome** — for Browser Use personal profile posting
- API accounts (see below)

---

## Quick Start

```bash
# 1. Install
npm install
cd publisher && pip install -r requirements.txt && cd ..

# 2. Configure
cp config/.env.example .env
# Open .env and add your API keys

# 3. Set up brand voice
# Edit the 4 files in brand-voice/ with your actual brand info

# 4. Validate
npm run setup

# 5. Run
npm run full-cycle
```

---

## API Keys

| Key | Service | Purpose | Required | Cost |
|-----|---------|---------|----------|------|
| `APIFY_API_TOKEN` | [Apify](https://console.apify.com/account/integrations) | Scrape Meta Ad Library | Yes | ~$5-15/run |
| `OPENAI_API_KEY` | [OpenAI](https://platform.openai.com/api-keys) | Whisper transcription | Yes | ~$0.006/min |
| `ANTHROPIC_API_KEY` | [Anthropic](https://console.anthropic.com/settings/keys) | Content generation + quality gate + Browser Use | Yes | ~$0.01-0.50/script |
| `HEYGEN_API_KEY` | [HeyGen](https://app.heygen.com/settings) | ICP-matched avatar videos | For video | $29/mo (Creator) |
| `ARGIL_API_KEY` | [Argil](https://app.argil.ai/settings) | Personal clone videos | For clone | $149/mo (Pro) |
| `SINGULAR_API_KEY` | [Singular](https://app.singular.net/) | Ad performance data | For optimization | Varies |
| `CLAUDE_MODEL` | N/A | Model selection (default: Haiku) | No | Free setting |
| `SLACK_WEBHOOK_URL` | Slack | Cycle completion notifications | No | Free |

### Model Selection

Set `CLAUDE_MODEL` in your `.env`:

| Model | Cost/Script | Quality | Best For |
|-------|------------|---------|----------|
| `claude-haiku-4-5-20251001` (default) | ~$0.01 | Good | High volume, testing, iteration |
| `claude-sonnet-4-6` | ~$0.10 | Great | Polished content, after finding winners |
| `claude-opus-4-6` | ~$0.50 | Best | Premium brands, final campaign scripts |

---

## All Commands

| Command | Phase | What It Does |
|---------|-------|-------------|
| `npm run setup` | — | Validates API keys, brand voice, configs |
| `npm run phase1:research` | 1 | Scrapes competitor ads + transcribes with Whisper |
| `npm run phase2:voice-check` | 2 | Validates brand voice files (one-time) |
| `npm run phase3:generate` | 3 | Generates 7 content formats with Titan DNA |
| `npm run phase3:quality` | 3.5 | Quality gate review against writing rules |
| `npm run phase4:produce` | 4 | Produces HeyGen/Argil videos + Puppeteer images + UGC briefs |
| `npm run phase5:optimize` | 5 | Analyzes performance, writes learnings for next cycle |
| `npm run phase6:queue` | 6a | Builds publish queue with per-platform scheduling |
| `npm run phase6:publish` | 6b | Posts to personal profiles via Browser Use |
| `npm run phase6:publish -- --dry-run` | 6b | Preview what would be published (no posting) |
| `npm run phase6:publish -- --limit 3` | 6b | Publish max 3 items from queue |
| `npm run full-cycle` | All | Runs Phases 1 → 3 → 3.5 → 4 → 6a in sequence |

---

## The 7 Content Formats

Eddie generates content across 7 formats, organized in tiers that control volume:

| Format | Tier | Words | Output | Platforms |
|--------|------|-------|--------|-----------|
| **UGC Video** | 1 (all ads) | 40-120 | HOOK / BODY / CTA / ANGLE | Facebook, Instagram, TikTok |
| **Short Caption** | 1 (all ads) | 30-60 | Caption + hashtags | Instagram, TikTok, Facebook |
| **LinkedIn Post** | 2 (top 50%) | 150-300 | Hook line / body / CTA / hashtags | LinkedIn |
| **Screenshot Static** | 2 (top 50%) | 20-40 | Headline + subtext (rendered to PNG) | Facebook, Instagram, LinkedIn |
| **Text Overlay** | 2 (top 50%) | 18-48 | 6 cards, 3-8 words each (rendered to PNG) | Instagram, TikTok, Facebook |
| **Carousel** | 3 (top 20%) | 105-175 | Cover + 5 slides + CTA (rendered to PNG) | LinkedIn, Instagram, Facebook |
| **B-Roll Script** | 3 (top 20%) | 40-100 | Voiceover + visual direction + CTA | Facebook, Instagram, TikTok |

**Volume math:** 50 ads x 3 ICPs → Tier 1: 300 pieces, Tier 2: 225 pieces, Tier 3: 60 pieces = **~585 pieces per cycle** at ~$5-8 Haiku cost.

---

## Titan Copywriter Agents

Every piece of content is infused with copywriting DNA from legendary marketers. The Titan Router maps each format to 1-2 specialist agents:

| Format | Titan Agents | Why |
|--------|-------------|-----|
| UGC Video | Hormozi + Kennedy | Irresistible offers + direct response hooks |
| LinkedIn Post | Abraham + Bilyeu | Strategic value + inspirational storytelling |
| Screenshot Static | Schwartz + Bencivenga | Awareness-level headlines + emotional precision |
| Carousel | Sugarman + Brown | Sequential persuasion + unique mechanism reveals |
| B-Roll Script | Catona + Kennedy | Broadcast pacing + hard-hitting CTAs |
| Text Overlay | Schwartz + Kennedy | Pattern-interrupt headlines + urgency |
| Short Caption | Buchan + Mueller | Humor/personality + benefit-dense compression |

The agents are not standalone processes — their system prompts (~200 tokens each) are injected into the generation prompt as a "COPYWRITING STYLE INFLUENCE" section. No full council process unless you want it.

---

## Video Production

### HeyGen ($29/mo — Unlimited Videos)
ICP-matched avatars. Different avatar demographics for different audience segments:
- "Mom" ICP → Female avatar, 30-45 age range
- "Student" ICP → Male avatar, 18-25 age range
- Configure mappings in `config/avatar-config.json`

### Argil ($149/mo — Personal Clone)
Your face, your voice, your mannerisms. For founder-brand content where authenticity matters. Limited to top scripts (configurable `max_per_cycle`).

### Puppeteer (Free — Static Images)
HTML templates rendered to PNG for screenshot statics, carousels, and text overlay cards. Four screenshot styles: tweet, text-message, notes-app, review. Carousel slides with cover/content/CTA differentiation.

---

## Browser Use Publishing

Posts directly to your **personal profiles** (not business pages) using browser automation with your real Chrome login session.

### Supported Platforms
- **Facebook** — Personal feed posts with text + media
- **LinkedIn** — Feed posts with text + media upload
- **Instagram** — Web interface posting (requires media)
- **TikTok** — Video upload via tiktok.com/upload

### How It Works
1. `build-publish-queue.js` creates a schedule from your production manifest
2. Each platform has configured posting times and daily limits (in `config/publish-config.json`)
3. `run-publisher.js` processes the queue, calling Python's Browser Use agent for each post
4. Random jitter (1-5 min) on scheduled times to appear natural
5. 5-15 second pause between posts
6. Crash-safe: queue saves after every post, retry on failure (max 2 attempts)

### Setup
1. Set your Chrome profile path in `config/publish-config.json`
2. Set the Python venv path (default: `/Users/home/browser-use-local/.venv/bin/python`)
3. Log into all platforms in Chrome first — Browser Use uses your existing sessions
4. Always `--dry-run` before your first live publish

---

## Brand Voice Setup (One-Time)

Eddie's output quality depends entirely on how well you define your brand. Four files to customize:

### `brand-voice/voice.md` — How You Sound
Paste 3-5 of your best-performing ad scripts as examples. Define your tone, vocabulary, and cadence. Eddie learns your voice from these examples.

### `brand-voice/product.md` — What You're Selling
Product name, one-liner, core features, pricing, social proof, competitive advantages. Eddie weaves these proof points into content naturally.

### `brand-voice/icp.md` — Who You're Selling To
Define 2-4 audience personas with demographics, psychographics, language, and preferred angles. **This is the multiplier** — each ad gets rewritten once per ICP.

### `brand-voice/writing-rules.md` — The Anti-AI Filter
Pre-configured with banned AI-slop words, banned starters, and required style rules. The quality gate enforces these automatically.

---

## Self-Improvement Loop

```
Cycle 1: Broad exploration
├── Generate 585 pieces across 7 formats and 3 ICPs
├── Publish to personal profiles, run paid on Meta
├── Wait 7-14 days for performance data
└── Phase 5 finds: "Busy Mom" ICP + screenshot statics on Facebook = 3x lower CPA

Cycle 2: Informed by winners
├── Biased toward Busy Mom + screenshot statics + Facebook
├── More carousel content (Tier 3 winners get promoted)
├── LinkedIn posts underperforming → reduced volume
└── Phase 5 finds: Short hooks (under 5 words) + Hormozi-style offers win

Cycle 3+: Compounding intelligence
├── Double down on proven ICP × format × platform combinations
├── CPA drops further each cycle
└── Learnings compound across formats and platforms
```

The `learnings.json` file bridges cycles. It tracks:
- Best ICPs, competitor sources, angles (from V1)
- **Best formats** (which of the 7 content types convert)
- **Best platforms** (which social channels drive results)

---

## Cost Per Cycle

### Lean Setup (recommended to start)

| Service | Cost | Notes |
|---------|------|-------|
| Apify | $5-15 | Per scrape run |
| OpenAI Whisper | $2-10 | $0.006/min of audio |
| Claude Haiku | $5-8 | ~$0.01/piece × ~585 pieces |
| HeyGen | $29/mo | Unlimited avatar videos |
| Puppeteer | $0 | Free — renders locally |
| Browser Use | $0 | Free — open source |
| **Total** | **~$41-62/cycle** | + $29/mo HeyGen |

### Full Setup

| Service | Cost | Notes |
|---------|------|-------|
| Apify | $5-15 | Per scrape run |
| OpenAI Whisper | $2-10 | Transcription |
| Claude Sonnet | $50-60 | ~$0.10/piece for polish |
| HeyGen | $29/mo | Avatar videos |
| Argil | $149/mo | Personal clone videos |
| UGC Creators | $75-250 | For top-tier briefs |
| **Total** | **~$130-335/cycle** | + $178/mo subscriptions |

### Ways to Cut Costs
- Haiku (default) is 10x cheaper than Sonnet — start here
- 2-3 competitors instead of 10
- 2 ICPs instead of 4 — halves everything
- Skip Argil — HeyGen only until you prove ROI
- Disable formats you don't need in `config/formats.json`

---

## No Singular? No Problem

Export performance data from your ad platform and save as `data/ad-performance/manual-data.json`:

```json
[
  {
    "creative_id": "script-1",
    "creative_name": "Hook Test - Busy Mom - CompetitorA",
    "custom_installs": "150",
    "custom_revenue": "450.00",
    "adn_cost": "300.00"
  }
]
```

Then run `npm run phase5:optimize` as normal.

---

## Typical Workflow

```
Week 1:     npm run setup → customize brand voice → npm run full-cycle
            Review content → npm run phase6:publish --dry-run → npm run phase6:publish
            Upload top videos to Meta Ads as paid.

Week 2-3:   Content auto-posting to personal profiles.
            Paid ads collecting performance data.

Week 3-4:   npm run phase5:optimize → npm run full-cycle
            New content biased toward winners. Repeat.

Week 5+:    Each cycle gets smarter. CPA drops. Winners compound.
```

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `npm run setup` shows missing keys | Add API keys to `.env` |
| Brand voice shows "needs customization" | Replace all `[YOUR...]` placeholders in `brand-voice/*.md` |
| Phase 1 finds 0 ads | Check competitor config in `research-config.json` |
| Phase 3 auth error | Verify `ANTHROPIC_API_KEY` has credits |
| Phase 4 no HeyGen videos | Set `HEYGEN_API_KEY` and configure avatar IDs in `avatar-config.json` |
| Phase 5 creates template | No data yet — fill `manual-data.json` or connect Singular |
| Publisher fails with CAPTCHA | Log into the platform in Chrome manually, solve CAPTCHA, try again |
| Publisher fails with 2FA | Complete 2FA in Chrome — Browser Use uses your existing session |
| Scripts sound generic | Improve `voice.md` with more real examples of your best content |
| Too many pieces per cycle | Disable formats in `config/formats.json` or reduce ICPs |

---

## Dependencies

### Node.js (package.json)

| Package | Purpose |
|---------|---------|
| `@anthropic-ai/sdk` | Claude API for content generation + quality gate |
| `apify-client` | Meta Ad Library scraper |
| `openai` | Whisper transcription |
| `puppeteer` | HTML → PNG image rendering |
| `dotenv` | Environment variable loading |
| `axios` | HTTP client (HeyGen, Argil, Singular APIs) |
| `csv-writer` | UGC creator brief CSV export |
| `csv-parser` | Performance data CSV import |

### Python (publisher/requirements.txt)

| Package | Purpose |
|---------|---------|
| `browser-use` | Browser automation for personal profile posting |
| `langchain-anthropic` | Claude as the browser agent's decision engine |

---

## License

MIT

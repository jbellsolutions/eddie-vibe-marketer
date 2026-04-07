<div align="center">

# Eddie Vibe Marketer

### The AI Content Machine That Builds Itself

**Scrape your competitors' best ads. Generate 585+ content pieces across 7 formats. Produce videos with AI avatars. Publish to your personal profiles. Optimize. Repeat.**

One command. ~40 minutes. Every cycle gets smarter.

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Claude](https://img.shields.io/badge/Powered%20by-Claude-6366f1?logo=anthropic&logoColor=white)](https://anthropic.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

[Quick Start](#-quick-start) | [How It Works](#-how-it-works) | [The 7 Formats](#-the-7-content-formats) | [Titan Agents](#-18-titan-copywriter-agents) | [Dashboard](#-live-dashboard) | [Cost](#-cost-per-cycle)

</div>

---

## The Problem

You're spending **$5,000-15,000/month** on creative agencies, $1,100/month on Arcads, or grinding out content manually. Meanwhile, your competitors are shipping 10x more creative volume and testing angles you haven't even thought of.

The math is simple: **more creative volume = more winners found = lower CPA = more profit.** But the creative bottleneck kills most teams before they can scale.

## The Solution

Eddie is a **self-improving AI content pipeline** that:

1. **Scrapes your competitors' live ads** from Meta Ad Library (what's actually working right now)
2. **Generates 585+ content pieces per cycle** across 7 formats, each injected with DNA from legendary copywriters
3. **Produces videos** with AI avatars ($29/mo vs $1,100/mo for Arcads) and renders static images locally for free
4. **Publishes directly to your personal profiles** — Facebook, LinkedIn, Instagram, TikTok — via browser automation
5. **Learns from performance data** and biases the next cycle toward winners

**Run `npm run full-cycle` and walk away.** Come back to 585+ ready-to-ship content pieces.

---

## What You Get

```
npm run full-cycle
```

```
 RESEARCH          GENERATE             QUALITY GATE         PRODUCE              PUBLISH             OPTIMIZE
 ─────────         ────────             ────────────         ───────              ───────             ────────
 Scrape Meta       Claude generates     Batch review         HeyGen avatars,      Browser Use         Pull performance
 Ad Library +      7 formats with       against writing      Argil personal       posts to your       data, find winners,
 transcribe        18 Titan copywriter  rules. Pass,         clone, Puppeteer     personal FB, LI,    feed learnings
 with Whisper.     DNA injected.        fail, or rewrite.    static images.       IG, TikTok.         into next cycle.

 Phase 1            Phase 3              Phase 3.5            Phase 4              Phase 6             Phase 5
```

**One cycle = ~585 content pieces in ~40 minutes. Each cycle gets smarter.**

---

## Before & After

| | **Without Eddie** | **With Eddie** |
|---|---|---|
| **Creative volume** | 10-20 pieces/week | 585+ pieces/cycle |
| **Competitor intel** | Manual ad library browsing | Automated scrape + transcription |
| **Content quality** | Generic AI or expensive agency | 18 legendary copywriter agents |
| **Video production** | Arcads ($1,100/mo) or manual | HeyGen ($29/mo) + Argil clone |
| **Publishing** | Copy-paste to each platform | Auto-post to personal profiles |
| **Optimization** | Gut feel | Data-driven: winners compound |
| **Cost per cycle** | $2,000-5,000 | **$41-62** |
| **Time per cycle** | 2-4 weeks | **~40 minutes** |

---

## How It Works

### Phase 1: Competitive Intelligence
```
Competitor URLs → Apify scrapes Meta Ad Library → OpenAI Whisper transcribes video ads
→ Extracts: hooks, body copy, CTAs, angles, media type, platforms, active status
→ Output: research-summary.json (structured competitor ad database)
```
Scrapes real ads that are **running right now** — not templates, not theory. What's actually spending money today.

### Phase 3: Multi-Format Generation
```
Research + Brand Voice + Titan Copywriter DNA
→ 7 formats × ICPs × tiered competitor ads
→ 585+ content pieces per cycle
```
Each piece is generated through Claude with:
- Your **brand voice** (tone, vocabulary, product knowledge)
- Your **ICPs** (each ad rewritten per audience segment — the volume multiplier)
- **Titan copywriter DNA** (Hormozi's offers, Schwartz's awareness levels, Kennedy's direct response)
- **Writing rules** (anti-AI-slop filter enforced by quality gate)

### Phase 3.5: Quality Gate
Every script is batch-reviewed against your writing rules. Pass, fail, or rewrite. Nothing ships that reads like AI slop.

### Phase 4: Creative Production
- **UGC Videos** → HeyGen ICP-matched avatars ($29/mo unlimited) or Argil personal clone ($149/mo)
- **Static Images** → Puppeteer renders HTML templates to PNG (free, local)
- **Text Content** → Ready to post as-is

### Phase 6: Automated Publishing
Browser Use posts directly to your **personal profiles** (not business pages) using your real Chrome session. Random timing jitter, crash-safe queue, retry on failure.

### Phase 5: Self-Improvement
Pull performance data → identify winning ICPs, formats, platforms, angles → bias next cycle toward winners. **CPA drops every cycle.**

---

## The 7 Content Formats

| Format | Tier | Description | Platforms |
|--------|------|-------------|-----------|
| **UGC Video** | 1 (all ads) | HOOK / BODY / CTA / ANGLE — avatar-delivered | Facebook, Instagram, TikTok |
| **Short Caption** | 1 (all ads) | Punchy caption + hashtags | Instagram, TikTok, Facebook |
| **LinkedIn Post** | 2 (top 50%) | Hook line / value body / CTA / hashtags | LinkedIn |
| **Screenshot Static** | 2 (top 50%) | Headline + subtext rendered as tweet/text/notes/review | Facebook, Instagram, LinkedIn |
| **Text Overlay** | 2 (top 50%) | 6 cards, 3-8 words each — swipeable | Instagram, TikTok, Facebook |
| **Carousel** | 3 (top 20%) | Cover + 5 slides + CTA card | LinkedIn, Instagram, Facebook |
| **B-Roll Script** | 3 (top 20%) | Voiceover + visual direction + CTA | Facebook, Instagram, TikTok |

**Volume math:** 50 competitor ads x 3 ICPs → Tier 1: 300, Tier 2: 225, Tier 3: 60 = **~585 pieces/cycle** at ~$5-8 Claude Haiku cost.

### Plus 8 Long-Form Content Formats

Run `npm run content:generate` separately to produce:

| Format | Length | Use Case |
|--------|--------|----------|
| Authority Brief | 500-800 words | Thought leadership for email/blog |
| Facebook Post | 200-400 words | Organic feed engagement |
| LinkedIn Post | 200-400 words | Professional audience storytelling |
| LinkedIn Article | 800-1200 words | Deep-dive long-form on LinkedIn |
| Medium Article | 1000-1500 words | SEO + authority building |
| Substack Post | 800-1200 words | Newsletter audience nurture |
| Newsletter | 600-1000 words | Email list engagement |
| YouTube Video Package | Script + description + tags | Full video content kit |

---

## 18 Titan Copywriter Agents

Every piece of content is infused with copywriting DNA from legends. The Titan Router maps formats to specialist agents:

| Agent | Specialty | Formats |
|-------|-----------|---------|
| **Alex Hormozi** | Irresistible offers, value stacking | UGC Video |
| **Dan Kennedy** | Direct response, hard CTAs, urgency | UGC Video, B-Roll, Text Overlay |
| **Eugene Schwartz** | Awareness levels, breakthrough headlines | Screenshot Static, Text Overlay |
| **Jay Abraham** | Strategic value, unique mechanisms | LinkedIn Post |
| **Joe Sugarman** | Sequential persuasion, slippery slope | Carousel |
| **Gary Bencivenga** | Emotional precision, proof stacking | Screenshot Static |
| **Todd Brown** | Unique mechanism reveals | Carousel |
| **Tom Bilyeu** | Inspirational storytelling | LinkedIn Post |
| **Fred Catona** | Broadcast pacing, mass appeal | B-Roll Script |
| **Jon Buchan** | Humor, personality-driven copy | Short Caption |
| **Bill Mueller** | Benefit-dense compression | Short Caption |
| + 7 more | Kurtz, McCarthy, Marshall, Grossman, Renker, Ottley, Lead Gen Jay | Various specialties |

These aren't full agent processes — their system prompts (~200 tokens each) are injected as a "COPYWRITING STYLE INFLUENCE" section. Lightweight, effective, zero overhead.

---

## Live Dashboard

```bash
npm run dashboard
# → http://localhost:3000
```

<table>
<tr>
<td width="50%">

**Pipeline Overview** — stat cards, phase status, one-click run buttons

**Competitor Intelligence** — filterable table with expandable ad details

**Content Browser** — 212+ scripts in a card grid with format/ICP filters

</td>
<td width="50%">

**Quality Gate** — pass/fail donut chart + results table

**Performance** — bar charts for winning formats, ICPs, platforms

**Settings** — format toggles, competitor URLs, API key status

</td>
</tr>
</table>

Dark theme. Vanilla JS. No build step. SSE streaming for live phase output.

---

## Quick Start

```bash
# 1. Clone & install
git clone https://github.com/jbellsolutions/eddie-vibe-marketer.git
cd eddie-vibe-marketer
npm install

# 2. Set up the publisher (Python)
cd publisher && pip install -r requirements.txt && cd ..

# 3. Configure API keys
cp config/.env.example .env
# Edit .env with your keys (see API Keys section below)

# 4. Define your brand (the most important step)
# Edit the 4 files in brand-voice/ — this is what makes YOUR content unique:
#   voice.md      → How you sound (paste your 3-5 best-performing examples)
#   product.md    → What you're selling (features, proof, positioning)
#   icp.md        → Who you're selling to (2-4 personas — the volume multiplier)
#   writing-rules.md → Already configured with anti-AI-slop rules

# 5. Validate everything
npm run setup

# 6. Run it
npm run full-cycle
```

---

## API Keys

| Key | Service | Purpose | Required | Cost |
|-----|---------|---------|----------|------|
| `APIFY_API_TOKEN` | [Apify](https://console.apify.com/account/integrations) | Scrape Meta Ad Library | Yes | ~$5-15/run |
| `OPENAI_API_KEY` | [OpenAI](https://platform.openai.com/api-keys) | Whisper video transcription | Yes | ~$0.006/min |
| `ANTHROPIC_API_KEY` | [Anthropic](https://console.anthropic.com/settings/keys) | Content generation + quality gate + Browser Use | Yes | ~$0.01-0.50/script |
| `HEYGEN_API_KEY` | [HeyGen](https://app.heygen.com/settings) | ICP-matched avatar videos | For video | $29/mo |
| `ARGIL_API_KEY` | [Argil](https://app.argil.ai/settings) | Personal clone videos | Optional | $149/mo |
| `SINGULAR_API_KEY` | [Singular](https://app.singular.net/) | Ad performance data import | Optional | Varies |
| `SLACK_WEBHOOK_URL` | Slack | Cycle completion notifications | Optional | Free |

### Model Selection

Control quality vs. cost with `CLAUDE_MODEL` in `.env`:

| Model | Cost/Script | Quality | Use When |
|-------|-------------|---------|----------|
| `claude-haiku-4-5-20251001` **(default)** | ~$0.01 | Good | Testing, iteration, high volume |
| `claude-sonnet-4-6` | ~$0.10 | Great | Polished content, proven angles |
| `claude-opus-4-6` | ~$0.50 | Best | Premium brands, final campaigns |

---

## Cost Per Cycle

### Lean Setup — Start Here

| Service | Cost | Notes |
|---------|------|-------|
| Apify | $5-15 | Per scrape run |
| OpenAI Whisper | $2-10 | $0.006/min of audio |
| Claude Haiku | $5-8 | ~$0.01/piece x ~585 pieces |
| HeyGen | $29/mo | Unlimited avatar videos |
| Puppeteer | $0 | Renders static images locally |
| Browser Use | $0 | Open source browser automation |
| **Total** | **~$41-62/cycle** | + $29/mo HeyGen |

**That's ~$0.07-0.11 per content piece.** Including video production.

### Compared to Alternatives

| Alternative | Monthly Cost | Creative Volume |
|-------------|-------------|-----------------|
| Creative agency | $5,000-15,000 | 20-50 pieces |
| Arcads + copywriter | $2,200-3,500 | 50-100 videos |
| In-house content team | $8,000-15,000 | 100-200 pieces |
| **Eddie (lean setup)** | **$70-90** | **585+ pieces** |

---

## All Commands

| Command | What It Does |
|---------|-------------|
| `npm run setup` | Validates API keys, brand voice, configs |
| `npm run full-cycle` | **Runs the entire pipeline end-to-end** |
| `npm run phase1:research` | Scrapes competitor ads + transcribes video |
| `npm run phase2:voice-check` | Validates brand voice files (one-time) |
| `npm run phase3:generate` | Generates 7 ad content formats with Titan DNA |
| `npm run phase3:quality` | Quality gate review against writing rules |
| `npm run phase4:produce` | Produces videos (HeyGen/Argil) + static images |
| `npm run phase5:optimize` | Analyzes performance, writes learnings |
| `npm run phase6:queue` | Builds publish queue with platform scheduling |
| `npm run phase6:publish` | Posts to personal profiles via Browser Use |
| `npm run phase6:publish -- --dry-run` | Preview publish plan without posting |
| `npm run content:generate` | Generates 8 long-form content formats |
| `npm run dashboard` | Launches local dashboard on port 3000 |

---

## Video Production

### HeyGen — $29/mo Unlimited Avatar Videos
ICP-matched avatars. Different demographics per audience segment:
- "Busy Mom" ICP → Female avatar, 30-45
- "Young Founder" ICP → Male avatar, 25-35
- Configure in `config/avatar-config.json`

### Argil — $149/mo Personal Clone
Your face, your voice, your mannerisms. For founder-brand content where authenticity matters. Auto-limited to top scripts per cycle.

### Puppeteer — Free Static Images
HTML templates rendered to PNG locally. Four screenshot styles (tweet, text-message, notes-app, review), carousel slides, text overlay cards. Zero cost.

---

## Browser Use Publishing

Posts directly to your **personal profiles** (not business pages) using browser automation with your real Chrome login session.

**Supported:** Facebook, LinkedIn, Instagram, TikTok

**Safety features:**
- Random 1-5 minute jitter on scheduled times (looks natural)
- 5-15 second pause between posts
- Crash-safe queue (saves after every post)
- Retry on failure (max 2 attempts)
- `--dry-run` mode for testing
- `--limit N` to cap posts per run

---

## The Self-Improvement Loop

```
Cycle 1: Broad exploration
├── 585 pieces across 7 formats, 3 ICPs, 4 platforms
├── Phase 5 finds: "Busy Mom" ICP + screenshot statics on Facebook = 3x lower CPA
│
Cycle 2: Biased toward winners
├── More Busy Mom content, more screenshot statics, more Facebook
├── Phase 5 finds: Short hooks (under 5 words) + Hormozi-style offers win
│
Cycle 3+: Compounding intelligence
├── Double down on proven ICP x format x platform x angle combinations
├── CPA drops every cycle. Winners compound. Losers get pruned.
```

`learnings.json` bridges cycles, tracking: best ICPs, formats, platforms, competitor sources, angles, and specific copywriting patterns that convert.

---

## Project Structure

```
eddie-vibe-marketer/
├── scripts/                      # Pipeline phases (Node.js)
│   ├── ad-research.js            # Phase 1: Apify + Whisper
│   ├── generate-scripts.js       # Phase 3: 7 formats + Titans
│   ├── quality-gate.js           # Phase 3.5: Batch review
│   ├── produce-creatives.js      # Phase 4: Videos + images
│   ├── optimize-loop.js          # Phase 5: Performance analysis
│   ├── build-publish-queue.js    # Phase 6a: Scheduling
│   ├── run-publisher.js          # Phase 6b: Browser Use bridge
│   ├── generate-content.js       # 8 long-form content formats
│   ├── full-cycle.js             # End-to-end orchestrator
│   └── lib/                      # Titan router, formats, generators
├── publisher/                    # Browser Use publisher (Python)
├── titans/                       # 18 Titan copywriter agents
├── brand-voice/                  # Your brand identity (customize once)
├── config/                       # System configuration
├── dashboard/                    # Local web dashboard
├── templates/image-templates/    # HTML → PNG templates
├── data/                         # Runtime output (gitignored)
├── ARCHITECTURE.md               # Full data flow diagrams
├── AGENTS.md                     # AI agent documentation
├── WALKTHROUGH.md                # Interactive setup guide
└── DEPLOYMENT-GUIDE.md           # Detailed deployment
```

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `npm run setup` shows missing keys | Add API keys to `.env` |
| Brand voice "needs customization" | Replace `[YOUR...]` placeholders in `brand-voice/*.md` |
| Phase 1 finds 0 ads | Check competitor URLs in `config/research-config.json` |
| Phase 3 auth error | Verify `ANTHROPIC_API_KEY` has credits |
| Phase 4 no videos | Set `HEYGEN_API_KEY` + avatar IDs in `config/avatar-config.json` |
| Publisher hits CAPTCHA | Log into platform in Chrome manually, solve CAPTCHA, retry |
| Scripts sound generic | Improve `brand-voice/voice.md` with more real examples |
| Too many pieces | Disable formats in `config/formats.json` or reduce ICPs |

---

## Dependencies

**Node.js:** `@anthropic-ai/sdk` (Claude), `apify-client` (scraping), `openai` (Whisper), `puppeteer` (image rendering), `axios` (HTTP), `dotenv`, `csv-writer`, `csv-parser`

**Python:** `browser-use` (browser automation), `langchain-anthropic` (Claude agent)

---

## Inspired By

Built on [Ernesto Lopez's $300K/yr app marketing system](https://x.com/ErnestoSOFTWARE). Eddie takes the manual workflow and automates it end-to-end with multi-format generation, Titan copywriter DNA injection, and self-improving optimization loops.

---

<div align="center">

**Run one command. Get 585+ content pieces. Every cycle gets smarter.**

```bash
npm run full-cycle
```

MIT License

</div>

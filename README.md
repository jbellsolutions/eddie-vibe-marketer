# Eddie Vibe Marketer

A self-improving AI ad creative system that scrapes your competitors' best-performing ads, rewrites them in your brand voice, multiplies them across audience segments, and gets smarter every cycle based on real performance data.

Inspired by [Ernesto Lopez's $300K/yr app marketing system](https://x.com/ErnestoSOFTWARE).

---

## How It Works (The Big Picture)

Eddie runs in **cycles**. Each cycle has 5 phases:

```
 RESEARCH          BRAND VOICE         GENERATE           PRODUCE            OPTIMIZE
 ─────────         ───────────         ────────           ───────            ────────
 Scrape your       Load your           Claude rewrites    Top scripts go     Pull ad data,
 competitors'      tone, product,      each competitor    to UGC creators.   find winners,
 best Meta ads     ICPs, and           ad in YOUR voice   Rest go to         feed learnings
 + transcribe      anti-AI-slop        × every ICP.       Arcads AI actors.  into next cycle.
 them.             rules.              100-200 scripts.                      Repeat.

 Phase 1           Phase 2             Phase 3            Phase 4            Phase 5
 (automated)       (one-time setup)    (automated)        (automated)        (automated)
```

**One cycle = ~40 minutes of automation + 7-14 days of ad data collection. Repeat every 2-4 weeks.**

Each cycle gets smarter: Phase 5 identifies which ICPs, competitor sources, and psychological angles produced winners, then biases the next generation cycle toward those patterns.

---

## What's In The Box

```
eddie-vibe-marketer/
│
├── config/
│   ├── .env.example              # API key template (copy to .env)
│   └── research-config.json      # Competitor list + scraping settings
│
├── brand-voice/                  # YOUR brand identity (fill these out once)
│   ├── voice.md                  # How your brand sounds + example scripts
│   ├── product.md                # Product details, features, proof points
│   ├── icp.md                    # 2-4 audience personas (multiplier)
│   └── writing-rules.md          # Anti-AI-slop rules (pre-configured)
│
├── scripts/                      # The automation engine
│   ├── setup.js                  # Validates your config before first run
│   ├── ad-research.js            # Phase 1: Apify scraper + Whisper transcription
│   ├── voice-check.js            # Phase 2: Validates brand voice files
│   ├── generate-scripts.js       # Phase 3: Claude generates script variations
│   ├── produce-creatives.js      # Phase 4: UGC briefs + Arcads renders
│   ├── optimize-loop.js          # Phase 5: Performance analysis + learnings
│   └── full-cycle.js             # Runs Phase 1 → 3 → 4 in sequence
│
├── data/                         # Output (auto-created on first run)
│   ├── competitor-research/      # Scraped transcripts + analysis
│   ├── generated-scripts/        # All script variations (JSON)
│   ├── creatives/                # UGC briefs (CSV + text) + Arcads scripts
│   └── ad-performance/           # Performance snapshots + learnings.json
│
├── skills/                       # Claude Code skill definitions
│   ├── ad-research/SKILL.md
│   └── script-generation/SKILL.md
│
├── DEPLOYMENT-GUIDE.md           # Step-by-step setup instructions
└── README.md                     # This file
```

---

## Prerequisites

- **Node.js** 18+ (run `node -v` to check)
- **npm** (comes with Node)
- API accounts (see below)

---

## Quick Start (5 Commands)

```bash
# 1. Clone and install
git clone https://github.com/jbellsolutions/eddie-vibe-marketer.git
cd eddie-vibe-marketer
npm install

# 2. Set up API keys
cp config/.env.example .env
# Open .env and add your keys (see API Keys section below)

# 3. Validate setup
npm run setup

# 4. Customize brand voice (see Brand Voice section)
# Edit the 4 files in brand-voice/

# 5. Run your first cycle
npm run full-cycle
```

---

## API Keys

| Key | Service | What It Does | Required | Cost |
|-----|---------|-------------|----------|------|
| `APIFY_API_TOKEN` | [Apify](https://console.apify.com/account/integrations) | Scrapes Meta Ad Library for competitor video ads | Yes | ~$5-15/run |
| `OPENAI_API_KEY` | [OpenAI](https://platform.openai.com/api-keys) | Whisper transcribes competitor video ads to text | Yes | ~$0.006/min |
| `ANTHROPIC_API_KEY` | [Anthropic](https://console.anthropic.com/settings/keys) | Claude generates ad script variations | Yes | ~$0.01-0.10/script |
| `ARCADS_API_KEY` | [Arcads](https://app.arcads.ai/settings/api) | AI actor video generation from scripts | No | $49-199/mo |
| `SINGULAR_API_KEY` | [Singular](https://app.singular.net/) | Pulls ad performance data (CPA, ROAS) | No | Varies |
| `CLAUDE_MODEL` | N/A | Which Claude model to use (default: Haiku) | No | Free setting |
| `SLACK_WEBHOOK_URL` | Slack | Notifications when a cycle completes | No | Free |

### Model Selection

Set `CLAUDE_MODEL` in your `.env` to control quality vs. cost:

| Model | Cost/Script | Quality | Best For |
|-------|------------|---------|----------|
| `claude-haiku-4-5-20251001` (default) | ~$0.01 | Good | Starting out, high volume testing |
| `claude-sonnet-4-6` | ~$0.10 | Great | After you know what works, want polish |
| `claude-opus-4-6` | ~$0.50 | Best | Final campaign scripts, premium brands |

---

## Brand Voice Setup (One-Time)

This is the most important step. Eddie's output quality depends entirely on how well you define your brand. There are 4 files to customize:

### 1. `brand-voice/voice.md` — How You Sound

Paste 3-5 of your best-performing ad scripts as examples. Define your tone (casual? edgy? calm?), vocabulary (words you always/never use), and cadence (short sentences? slang? contractions?).

Eddie learns your voice from these examples and rewrites every competitor ad to match.

### 2. `brand-voice/product.md` — What You're Selling

Your product name, one-liner, core features (top 5 only), pricing, social proof (ratings, downloads, testimonials), and competitive advantages.

Eddie weaves these proof points into scripts naturally instead of making generic claims.

### 3. `brand-voice/icp.md` — Who You're Selling To

Define 2-4 audience personas. Each ICP includes demographics, psychographics (fears, desires, failed alternatives), their language, and the ad angle that works for them.

**This is the multiplier.** Each competitor ad gets rewritten once per ICP:
- 30 ads x 3 ICPs = 90 scripts
- 50 ads x 4 ICPs = 200 scripts

### 4. `brand-voice/writing-rules.md` — The Anti-AI Filter

Pre-configured with banned AI-slop words ("delve", "leverage", "game-changer"), banned sentence starters ("In today's world..."), and required writing style rules (short sentences, contractions, specific over generic).

Customize if needed, but the defaults are solid.

---

## Running Eddie

### NPM Commands

| Command | What It Does |
|---------|-------------|
| `npm run setup` | Validates API keys, brand voice files, and competitor config |
| `npm run phase1:research` | Scrapes competitor ads from Meta Ad Library + transcribes with Whisper |
| `npm run phase2:voice-check` | Validates your brand voice files are properly filled out |
| `npm run phase3:generate` | Generates script variations using Claude (competitor ads x ICPs) |
| `npm run phase4:produce` | Ranks scripts, exports UGC briefs + pushes to Arcads |
| `npm run phase5:optimize` | Pulls performance data, identifies winners, writes learnings |
| `npm run full-cycle` | Runs Phase 1 → 3 → 4 in sequence |

### Typical Workflow

```
Week 1:     npm run setup → customize brand voice → npm run full-cycle
            Upload creatives to Meta Ads. Let them run.

Week 2-3:   Ads collecting data. Do nothing.

Week 3-4:   npm run phase5:optimize → npm run full-cycle
            New scripts biased toward winners. Upload and repeat.

Week 5+:    Each cycle gets smarter. CPA drops. Winners compound.
```

---

## Phase-by-Phase Deep Dive

### Phase 1: Ad Research (`ad-research.js`)

**What it does:**
1. Reads your competitor list from `config/research-config.json`
2. Calls the Apify Meta Ad Library scraper for each competitor
3. Sorts results by longest-running ads (proxy for best-performing)
4. Downloads each video ad
5. Transcribes audio with OpenAI Whisper (verbose JSON format)
6. Extracts: full transcript, hook (first 20 words), body copy, headline, CTA
7. Saves structured JSON per ad + a master `research-summary.json`
8. Deletes video files after transcription to save disk space

**Output:** `data/competitor-research/research-summary.json`

**Config options** in `research-config.json`:
- `max_ads_per_competitor`: How many ads to scrape per competitor (default: 50)
- `default_country`: Country filter for ad library (default: "US")
- `ad_type`: "VIDEO" only — text ads are skipped
- `active_only`: Only scrape currently active ads (default: true)

### Phase 2: Brand Voice (`voice-check.js`)

Not automated — this is your one-time setup. The voice check script validates that all 4 brand voice files exist and have been customized (no `[YOUR` placeholder text remaining).

### Phase 3: Script Generation (`generate-scripts.js`)

**What it does:**
1. Loads all competitor ad transcripts from Phase 1
2. Loads all 4 brand voice files (voice, product, ICPs, writing rules)
3. Parses `icp.md` into individual ICP profiles
4. For each competitor ad x each ICP:
   - Sends a prompt to Claude with the competitor ad, your brand voice, product details, writing rules, and the specific ICP
   - Claude writes a NEW original script that uses the same angle/structure but in your voice, for that ICP
   - Output format: HOOK / BODY / CTA / ANGLE / WHY IT WORKS
5. Saves each script as individual JSON + a master `all-scripts.json`
6. 500ms delay between API calls for rate limiting

**Output:** `data/generated-scripts/all-scripts.json` + individual script files

**The prompt engineering is the core of Eddie.** Claude is instructed to:
- Use the competitor ad's angle and structure (what made it work)
- Write entirely in your brand voice
- Speak directly to the specific ICP
- Follow every rule in writing-rules.md (no AI slop)
- Keep scripts 15-45 seconds when read aloud (40-120 words)

### Phase 4: Creative Production (`produce-creatives.js`)

**What it does:**
1. Loads all generated scripts
2. Ranks them by priority (diversity of angles + competitors first)
3. Splits into two tiers:
   - **Top 15 scripts** → exported as UGC creator briefs
   - **Remaining scripts** → pushed to Arcads AI actors (or saved for manual upload)

**UGC Output** (`data/creatives/ugc-creator-briefs/`):
- `creator-briefs.csv` — spreadsheet with Script ID, Target Audience, Inspired By, Full Script, Direction Notes
- Individual `script-X-brief.txt` files with filming notes (9:16 vertical, 15-45 sec, lighting tips)

**Arcads Output** (`data/creatives/arcads-renders/` or `arcads-manual-upload/`):
- If `ARCADS_API_KEY` is set: automatically queues renders with up to 5 AI actors per script
- If not: saves clean script text files for manual upload to Arcads dashboard

### Phase 5: Self-Improvement Loop (`optimize-loop.js`)

**What it does:**
1. Pulls creative performance data from Singular API (last 30 days)
   - Or reads from `data/ad-performance/manual-data.json` if no Singular key
2. Calculates CPA and ROAS for each creative
3. Identifies top 20% performers (minimum 3)
4. Matches winners back to original scripts (by creative name/ID)
5. Analyzes patterns: which ICPs win? Which competitor sources? Which angles?
6. Writes `learnings.json` with:
   - Cycle stats (total tested, winners found, avg CPA, improvement %)
   - Winning patterns (best ICPs, best competitor sources, best angles)
   - Next cycle instructions (double down on X, avoid Y)
7. Saves a dated performance snapshot for historical tracking

**Output:** `data/ad-performance/learnings.json`

**The self-improvement loop:** When `full-cycle.js` runs, it checks for `learnings.json`. If it exists, it logs what worked last time. The generation phase then has access to this context, biasing new scripts toward winning patterns.

### Full Cycle (`full-cycle.js`)

Orchestrator that runs Phase 1 → 3 → 4 in sequence with error handling. If any phase fails, the cycle stops. Logs timing and provides a checklist of manual next steps (send briefs to creators, upload to Meta, wait for data, then optimize).

---

## Cost Per Cycle

### Lean Setup (recommended to start)

| Service | Cost | Notes |
|---------|------|-------|
| Apify | $5-15 | Pay per scrape result |
| OpenAI Whisper | $2-10 | $0.006/min of audio |
| Claude Haiku | $1-3 | ~$0.01/script, 100-200 scripts |
| Arcads | $0 | Skip initially — UGC only |
| UGC Creators | $75-250 | 5-10 scripts x $15-25 each |
| **Total** | **~$85-280** | Before ad spend |

### Full Setup

| Service | Cost | Notes |
|---------|------|-------|
| Apify | $5-15 | Pay per scrape result |
| OpenAI Whisper | $2-10 | Transcription |
| Claude Sonnet | $10-20 | ~$0.10/script |
| Arcads | $49-199/mo | AI actor renders |
| UGC Creators | $150-750 | 10-15 scripts x $15-50 each |
| **Total** | **~$215-1,000** | Before ad spend |

### Ways to Cut Costs

- Use Haiku (default) instead of Sonnet — 10x cheaper per script
- Start with 2-3 competitors instead of 10
- Use 2 ICPs instead of 4 — halves your script count
- Skip Arcads — go UGC-only until you find winning scripts
- Run Whisper locally with `whisper.cpp` (free, requires local setup)

---

## No Singular? No Problem

If you don't use Singular as your MMP, manually export performance data from Meta Ads Manager and save it as `data/ad-performance/manual-data.json`:

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

Then run `npm run phase5:optimize` as normal. Eddie will analyze this data the same way it would analyze Singular data.

---

## Competitor Configuration

Edit `config/research-config.json` to add your competitors:

```json
{
  "competitors": [
    {
      "name": "Calm App",
      "advertiser_id": "123456789",
      "keywords": ["meditation app", "sleep app"]
    }
  ]
}
```

**Finding advertiser IDs:**
1. Go to [facebook.com/ads/library](https://www.facebook.com/ads/library)
2. Search for the competitor
3. Click their page — the ID is in the URL

You can use `advertiser_id` (exact match) or `keywords` (broader search) or both.

---

## How the Self-Improvement Loop Works

```
Cycle 1: Broad exploration
├── Research 50 competitor ads
├── Generate 200 scripts (50 ads x 4 ICPs)
├── Test on Meta for 14 days
└── Phase 5 finds: "Busy Mom" ICP + "fear of missing out" angle = 3x lower CPA

Cycle 2: Informed by winners
├── Research same competitors (fresh ads)
├── Generate 200 scripts — but biased toward Busy Mom + FOMO angles
├── Test on Meta for 14 days
└── Phase 5 finds: Short hooks (under 5 words) outperform long hooks

Cycle 3: Compounding intelligence
├── Research expands to similar competitors
├── Scripts double down on Busy Mom + FOMO + short hooks
├── CPA drops further
└── Rinse and repeat
```

The `learnings.json` file is the bridge between cycles. It tells the next generation phase:
- Which ICPs to prioritize
- Which competitor sources produce winners
- Which psychological angles convert
- What to avoid

---

## Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `apify-client` | ^2.9.0 | Meta Ad Library scraper API |
| `openai` | ^4.52.0 | Whisper transcription API |
| `dotenv` | ^16.4.0 | Environment variable loading |
| `axios` | ^1.7.0 | HTTP client (Singular + Arcads APIs) |
| `csv-writer` | ^1.6.0 | UGC creator brief CSV export |
| `csv-parser` | ^3.0.0 | Performance data CSV import |

Note: The Anthropic SDK (`@anthropic-ai/sdk`) is loaded directly in the generation script without being in package.json — install it separately:

```bash
npm install @anthropic-ai/sdk
```

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `npm run setup` shows missing keys | Open `.env` and add your API keys |
| Brand voice files show "needs customization" | Replace all `[YOUR...]` placeholder text in `brand-voice/*.md` |
| Phase 1 finds 0 ads | Check your competitor `advertiser_id` or `keywords` in `research-config.json` |
| Phase 3 fails with auth error | Verify `ANTHROPIC_API_KEY` is valid and has credits |
| Phase 4 skips Arcads | Set `ARCADS_API_KEY` in `.env`, or use the manual upload files |
| Phase 5 creates a template | No performance data yet — fill in `manual-data.json` or connect Singular |
| Scripts sound too generic | Improve your `voice.md` — paste more real examples of your best content |
| Too many scripts to test | Reduce competitors or ICPs to lower the multiplier |

---

## License

MIT

# Eddie Vibe Marketer — Deployment Guide

## What This Is
A self-improving ad creative system inspired by Ernesto Lopez's $300K/yr app marketing pipeline. Eddie scrapes competitor ads, learns your brand voice, generates hundreds of script variations, pushes them to AI actors + UGC creators, and optimizes based on real performance data. Each cycle gets smarter.

---

## Step-by-Step Deployment (6 Steps)

### STEP 1: Install & Configure API Keys
**Time: 5 minutes**

```bash
cd eddie-vibe-marketer
npm install
cp config/.env.example .env
```

Open `.env` and add your keys:

| Key | Where to Get It | Required? |
|-----|-----------------|-----------|
| `APIFY_API_TOKEN` | [apify.com/account](https://console.apify.com/account/integrations) | Yes |
| `OPENAI_API_KEY` | [platform.openai.com](https://platform.openai.com/api-keys) | Yes |
| `ANTHROPIC_API_KEY` | [console.anthropic.com](https://console.anthropic.com/settings/keys) | Yes |
| `ARCADS_API_KEY` | [app.arcads.ai/settings](https://app.arcads.ai/settings/api) | Optional |
| `SINGULAR_API_KEY` | [app.singular.net](https://app.singular.net/) | Optional |

Then verify:
```bash
npm run setup
```

---

### STEP 2: Configure Your Competitors
**Time: 10 minutes**

Edit `config/research-config.json`:

```json
{
  "competitors": [
    {
      "name": "Prayer App X",
      "advertiser_id": "123456789",
      "keywords": ["prayer app", "daily devotional"]
    },
    {
      "name": "Meditation App Y",
      "advertiser_id": "",
      "keywords": ["guided meditation", "mindfulness app"]
    }
  ]
}
```

**How to find advertiser IDs:**
1. Go to [facebook.com/ads/library](https://www.facebook.com/ads/library)
2. Search for your competitor
3. Click their page → the ID is in the URL

---

### STEP 3: Set Up Your Brand Voice
**Time: 30-60 minutes (one-time)**

Edit these 4 files in `brand-voice/`:

| File | What to Put In It |
|------|-------------------|
| `voice.md` | How your brand sounds — paste 3-5 of your best ad scripts as examples |
| `product.md` | Your product details — features, pricing, social proof, app store URLs |
| `icp.md` | Your audience segments — 2-4 ICPs with demographics + psychographics |
| `writing-rules.md` | Already configured with anti-AI-slop rules — customize if needed |

Then verify:
```bash
npm run phase2:voice-check
```

---

### STEP 4: Run Your First Cycle
**Time: 15-30 minutes (automated)**

Option A — Full cycle (all phases):
```bash
npm run full-cycle
```

Option B — Step by step:
```bash
npm run phase1:research    # Scrape & transcribe competitor ads
npm run phase3:generate    # Generate script variations
npm run phase4:produce     # Export UGC briefs + push to Arcads
```

**What you get:**
- `data/competitor-research/` — All competitor ad transcripts + analysis
- `data/generated-scripts/` — 50-200+ script variations
- `data/creatives/ugc-creator-briefs/` — CSV + individual briefs for creators
- `data/creatives/arcads-*/` — Scripts formatted for Arcads upload

---

### STEP 5: Launch Ads
**Time: Manual**

1. **UGC Creators** — Send the briefs from `data/creatives/ugc-creator-briefs/` to your creators ($15-50/video)
2. **Arcads** — If API is connected, renders are automatic. If not, upload scripts from `data/creatives/arcads-manual-upload/`
3. **Meta Ads** — Upload all finished videos to Meta Ads Manager
4. **Let Meta optimize** — Use CBO or ABO, let it find winners over 7-14 days

---

### STEP 6: Close the Loop (Self-Improvement)
**Time: 5 minutes**

After 7-14 days of ad data:

```bash
npm run phase5:optimize
```

This pulls your performance data, identifies winners, and writes `data/ad-performance/learnings.json` — which automatically feeds into the next cycle.

Then run another cycle:
```bash
npm run full-cycle
```

Eddie now generates scripts **biased toward what worked**. Same angles, same ICPs, same competitor inspiration — but refined.

**Repeat every 2-4 weeks.**

---

## Architecture

```
eddie-vibe-marketer/
├── .env                          # Your API keys (never commit)
├── config/
│   ├── .env.example              # Template for API keys
│   └── research-config.json      # Competitors + scraping settings
├── brand-voice/
│   ├── writing-rules.md          # Anti-AI-slop rules
│   ├── voice.md                  # Your brand's tone + example scripts
│   ├── product.md                # Product details + proof points
│   └── icp.md                    # Audience segments (multiplier)
├── scripts/
│   ├── setup.js                  # Validates config
│   ├── ad-research.js            # Phase 1: Apify + Whisper
│   ├── voice-check.js            # Phase 2: Brand voice validation
│   ├── generate-scripts.js       # Phase 3: Claude script generation
│   ├── produce-creatives.js      # Phase 4: UGC briefs + Arcads
│   ├── optimize-loop.js          # Phase 5: Performance → learnings
│   └── full-cycle.js             # Runs phases 1→3→4 in sequence
├── data/
│   ├── competitor-research/      # Scraped ad transcripts
│   ├── generated-scripts/        # All script variations
│   ├── creatives/                # UGC briefs + Arcads renders
│   └── ad-performance/           # Performance data + learnings
└── DEPLOYMENT-GUIDE.md           # This file
```

## The Feedback Loop

```
┌─────────────────┐
│  1. RESEARCH    │ ← Apify scrapes Meta Ad Library
│  Competitor Ads │   Whisper transcribes video ads
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  2. BRAND VOICE │ ← writing-rules.md (anti-AI filter)
│  Load Context   │   voice.md + product.md + icp.md
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  3. GENERATE    │ ← Claude rewrites competitor ads
│  100s of Scripts│   in your voice × each ICP
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  4. PRODUCE     │ ← Top 15 → UGC creators ($15-50/vid)
│  Video Ads      │   Rest → Arcads AI actors
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  5. OPTIMIZE    │ ← Singular pulls CPA/ROAS data
│  Learn + Repeat │   Learnings feed next cycle
└────────┬────────┘
         │
         └──────────────→ Back to Step 1 (smarter)
```

## Cost Estimate Per Cycle

### Default (Haiku — recommended to start)
| Service | Est. Cost | Notes |
|---------|-----------|-------|
| Apify | $5-15 | Meta Ad Library scraper, pay per result |
| OpenAI Whisper | $2-10 | ~$0.006/min of audio |
| Claude Haiku | $1-3 | ~100-200 scripts @ ~$0.01 each |
| Arcads | $0 (skip) | Optional — start UGC-only |
| UGC Creators | $75-250 | 5-10 scripts × $15-25 each |
| **Total per cycle** | **~$85-280** | Before ad spend |

### Upgraded (Sonnet + Arcads)
| Service | Est. Cost | Notes |
|---------|-----------|-------|
| Apify | $5-15 | Meta Ad Library scraper |
| OpenAI Whisper | $2-10 | Transcription |
| Claude Sonnet | $10-20 | ~$0.10 per script |
| Arcads | $49-199/mo | AI actor video renders |
| UGC Creators | $150-750 | 10-15 scripts × $15-50 each |
| **Total per cycle** | **~$215-1,000** | Before ad spend |

### How to Cut Costs Further
- Set `CLAUDE_MODEL=claude-haiku-4-5-20251001` in .env (default, ~10x cheaper than Sonnet)
- Start with 2-3 competitors, not 10
- Use 2 ICPs instead of 4 (halves script count)
- Skip Arcads — go UGC-only until you find winners
- Run Whisper locally with `whisper.cpp` (free, requires setup)

## No Singular? No Problem.

If you don't use Singular as your MMP, you can:
1. Manually export performance data from Meta Ads Manager
2. Save it as `data/ad-performance/manual-data.json` in this format:

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

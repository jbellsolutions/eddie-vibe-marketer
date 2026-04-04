> **To install:** Open Claude Code in this folder and type `set this up for me` or `/walkthrough`

# Eddie Vibe Marketer V2 — Walkthrough

A self-improving AI content pipeline that scrapes competitor ads, generates 7 content formats with legendary copywriter DNA, produces videos and images, and publishes directly to your personal social profiles.

## Prerequisites

- Node.js 18+ (recommended: install via fnm)
- Python 3.10+ with pip
- Google Chrome installed (for Browser Use publishing)
- API keys for: Apify, OpenAI, Anthropic (required); HeyGen, Argil, Singular (optional)

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

For the publisher (Browser Use):
```bash
cd publisher && pip install -r requirements.txt
```

### 2. Configure Environment

```bash
cp config/.env.example .env
```

Fill in your API keys:
| Variable | Source | Required |
|----------|--------|----------|
| `APIFY_API_TOKEN` | https://console.apify.com/account/integrations | Yes |
| `OPENAI_API_KEY` | https://platform.openai.com/api-keys | Yes |
| `ANTHROPIC_API_KEY` | https://console.anthropic.com/settings/keys | Yes |
| `HEYGEN_API_KEY` | https://app.heygen.com/settings | For video |
| `ARGIL_API_KEY` | https://app.argil.ai/settings | For clone video |
| `SINGULAR_API_KEY` | https://app.singular.net/ | For optimization |
| `CLAUDE_MODEL` | Default: claude-haiku-4-5-20251001 | Optional |

### 3. Set Up Brand Voice

Edit these files with your actual brand information:
- `brand-voice/voice.md` — Your tone, personality, vocabulary
- `brand-voice/product.md` — What you sell, features, positioning
- `brand-voice/icp.md` — Who you sell to (ideal customer profiles)
- `brand-voice/writing-rules.md` — Content quality rules

### 4. Configure Competitors

Edit `config/research-config.json` with competitor Facebook page URLs.

### 5. Validate Setup

```bash
npm run setup
```

### 6. Run a Full Cycle

```bash
npm run full-cycle
```

This runs: Research → Generate → Quality Gate → Produce → Build Queue

### 7. Publish Content

Preview first:
```bash
npm run phase6:publish -- --dry-run
```

Then publish:
```bash
npm run phase6:publish
```

## All Commands

| Command | What It Does |
|---------|-------------|
| `npm run setup` | Validate env, dependencies, configs |
| `npm run phase1:research` | Scrape + transcribe competitor ads |
| `npm run phase2:voice-check` | Validate brand voice files |
| `npm run phase3:generate` | Generate 7 content formats |
| `npm run phase3:quality` | Quality gate review |
| `npm run phase4:produce` | Produce videos + images |
| `npm run phase5:optimize` | Analyze performance, generate learnings |
| `npm run phase6:queue` | Build publish queue with scheduling |
| `npm run phase6:publish` | Post to personal profiles |
| `npm run full-cycle` | Run phases 1→3→3.5→4→6a |

## After Your First Cycle

1. Review generated content in `data/generated-scripts/by-format/`
2. Check quality report: `data/generated-scripts/quality-report.json`
3. Review publish queue: `data/publish-queue.json`
4. After 7-14 days of ad performance data: `npm run phase5:optimize`
5. Run another cycle — it gets smarter each time

# ARCHITECTURE.md — Eddie Vibe Marketer V2

## Directory Layout

```
eddie-vibe-marketer/
├── scripts/                    # Phase executors (Node.js)
│   ├── ad-research.js          # Phase 1: Scrape + transcribe competitor ads
│   ├── voice-check.js          # Phase 2: Brand voice validation (one-time)
│   ├── generate-scripts.js     # Phase 3: Multi-format content generation
│   ├── quality-gate.js         # Phase 3.5: Batch quality review
│   ├── produce-creatives.js    # Phase 4: Video + image production
│   ├── optimize-loop.js        # Phase 5: Performance analysis + learnings
│   ├── build-publish-queue.js  # Phase 6a: Schedule posts
│   ├── run-publisher.js        # Phase 6b: Execute publish queue
│   ├── full-cycle.js           # Orchestrator: Phases 1→3→3.5→4→6a
│   ├── setup.js                # Validates env, dependencies, configs
│   └── lib/                    # Shared modules
│       ├── titan-router.js     # Routes formats → Titan copywriter agents
│       ├── formats.js          # 7 format definitions + prompt templates
│       ├── generator.js        # Content generation engine (Claude API)
│       ├── heygen-client.js    # HeyGen v2 API wrapper
│       ├── argil-client.js     # Argil API wrapper (personal clone)
│       └── image-generator.js  # Puppeteer HTML→PNG renderer
├── publisher/                  # Browser Use publisher (Python)
│   ├── publish.py              # Entry point — called from Node via execFile
│   ├── requirements.txt        # browser-use, langchain-anthropic
│   └── platforms/              # Per-platform posting logic
│       ├── facebook.py
│       ├── linkedin.py
│       ├── instagram.py
│       └── tiktok.py
├── titans/                     # Titan Genome copywriter agents
│   ├── council/agents/         # 18 agent JSONs (Hormozi, Kennedy, etc.)
│   ├── config/                 # router.json, authors.json
│   └── SWIPE_FILE_CONTEXT.md   # Copywriting principles reference
├── brand-voice/                # Brand identity (user-configured)
│   ├── voice.md                # Tone, personality, vocabulary
│   ├── product.md              # Product details, features, positioning
│   ├── icp.md                  # Ideal customer profiles
│   └── writing-rules.md        # Content quality rules
├── config/                     # System configuration
│   ├── .env.example            # Required API keys template
│   ├── research-config.json    # Competitor URLs, scraping params
│   ├── formats.json            # Format enable/disable + tier config
│   ├── avatar-config.json      # ICP→avatar mappings (HeyGen/Argil)
│   └── publish-config.json     # Per-platform schedule, Chrome profile
├── templates/image-templates/  # HTML templates for Puppeteer rendering
├── data/                       # Runtime data (gitignored)
│   ├── competitor-research/    # Phase 1 output
│   ├── generated-scripts/      # Phase 3 output (by-format/)
│   ├── creatives/              # Phase 4 output (videos, images, briefs)
│   ├── ad-performance/         # Phase 5 data + learnings.json
│   ├── publish-queue.json      # Phase 6a output
│   └── publish-log.json        # Phase 6b execution log
├── rules/                      # Quality rules for content review
├── skills/                     # Claude Code skill definitions
└── infrastructure/             # Deployment configs
```

## Data Flow

```
Competitor URLs (config)
        │
        ▼
┌─────────────────┐
│ Phase 1: Research│  Apify scrape → OpenAI Whisper transcription
│  ad-research.js  │  → hooks, angles, body copy extraction
└────────┬────────┘
         │  data/competitor-research/research-summary.json
         ▼
┌─────────────────┐
│ Phase 3: Generate│  Research + Brand Voice + Titan Agents
│ generate-scripts │  → 7 formats × ICPs × tiered ads
└────────┬────────┘
         │  data/generated-scripts/by-format/{format}/*.json
         ▼
┌─────────────────┐
│ Phase 3.5: QG   │  Batch review against writing-rules.md
│  quality-gate.js │  → pass/fail/rewrite per script
└────────┬────────┘
         │  data/generated-scripts/quality-report.json
         ▼
┌─────────────────┐
│ Phase 4: Produce │  UGC video → HeyGen/Argil/briefs
│produce-creatives │  Static formats → Puppeteer PNG
└────────┬────────┘  Text formats → save as-is
         │  data/creatives/production-manifest.json
         ▼
┌─────────────────┐
│ Phase 6a: Queue  │  Manifest → scheduled publish times
│build-publish-que │  per platform posting rules
└────────┬────────┘
         │  data/publish-queue.json
         ▼
┌─────────────────┐
│ Phase 6b: Publish│  Queue → Browser Use (Python)
│  run-publisher   │  → real Chrome → personal profiles
└────────┬────────┘
         │  data/publish-log.json
         ▼
┌─────────────────┐
│ Phase 5: Optimize│  Performance data (Singular/manual)
│  optimize-loop   │  → winner analysis → learnings.json
└─────────────────┘  → feeds next generation cycle
```

## Key Abstractions

### Titan Router (titan-router.js)
Maps content formats to 1-2 copywriter agents. Injects ~200 tokens of copywriting DNA per agent into the system prompt as a "COPYWRITING STYLE INFLUENCE" section. Lightweight — no full council process.

### Format System (formats.js)
Each format defines: name, tier (1-3), max tokens, platform targets, and a `buildPrompt()` function that returns the format-specific user prompt. Tiered generation controls volume: Tier 1 = all ads, Tier 2 = top 50%, Tier 3 = top 20%.

### Node-to-Python Bridge (run-publisher.js → publish.py)
`child_process.execFile` calls the Python publisher. Publisher outputs JSON to stdout. Node parses the result. This bridges the Node.js orchestrator with the Python Browser Use agent.

### Self-Improvement Loop
`learnings.json` tracks winning patterns across ICPs, competitor sources, angles, formats, and platforms. Next generation cycle uses these learnings to bias prompt selection toward proven winners.

## Integration Points

| External Service | Used By | Purpose |
|-----------------|---------|---------|
| Apify | ad-research.js | Meta Ad Library scraping |
| OpenAI (Whisper) | ad-research.js | Video ad transcription |
| Anthropic (Claude) | generator.js, quality-gate.js | Content generation + review |
| HeyGen | heygen-client.js | ICP-matched avatar videos |
| Argil | argil-client.js | Personal clone videos |
| Singular | optimize-loop.js | Ad performance data |
| Browser Use | publish.py | Personal profile posting |
| Puppeteer | image-generator.js | HTML→PNG static rendering |

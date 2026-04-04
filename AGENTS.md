# AGENTS.md — Eddie Vibe Marketer

## AI Agents in This System

### 1. Content Generator (Claude)
- **Role**: Generates all 7 content formats from competitor research + brand voice
- **Model**: claude-haiku-4-5-20251001 (default), configurable via CLAUDE_MODEL env var
- **Invoked by**: scripts/lib/generator.js
- **Input**: Competitor ad transcript + brand voice + ICP + Titan agent system prompts
- **Output**: Format-specific content (scripts, posts, captions, slide decks)

### 2. Quality Gate Reviewer (Claude)
- **Role**: Batch reviews generated content against writing rules
- **Model**: Same as CLAUDE_MODEL
- **Invoked by**: scripts/quality-gate.js
- **Input**: Batch of 5 scripts + writing-rules.md
- **Output**: Pass/fail verdict + violation list + optional rewrite

### 3. Titan Copywriter Agents (18 agents)
- **Role**: Inject copywriting DNA into generation prompts as style influences
- **Not standalone agents** — their system_prompt text is appended to the generator's prompt
- **Routing**: titan-router.js maps each format to 1-2 agents
- **Agents**: Hormozi, Kennedy, Schwartz, Bencivenga, Sugarman, Abraham, Bilyeu, Buchan, Mueller, Catona, Brown, Halbert, Hopkins, Ogilvy, Caples, Collier, Carlton, Makepeace

### 4. Browser Use Publisher (Python/Claude)
- **Role**: Posts content to personal social profiles via browser automation
- **Model**: Claude (via langchain-anthropic) for browser navigation decisions
- **Invoked by**: publisher/publish.py via child_process.execFile from Node
- **Input**: Platform + caption + optional media file
- **Output**: JSON success/failure result to stdout

## Agent Handoff Protocol

```
full-cycle.js (orchestrator)
  → ad-research.js (Apify + Whisper — no Claude)
  → generate-scripts.js (Claude + Titans)
  → quality-gate.js (Claude reviewer)
  → produce-creatives.js (HeyGen/Argil/Puppeteer — no Claude)
  → build-publish-queue.js (pure JS — no Claude)

run-publisher.js (separate trigger)
  → publish.py (Claude via Browser Use)
```

No agent-to-agent direct communication. The orchestrator (full-cycle.js) runs phases sequentially. Data passes through JSON files on disk.

## Configuration

| Agent | Config Location | Key Settings |
|-------|----------------|-------------|
| Generator | config/.env (CLAUDE_MODEL) | Model selection, max tokens |
| Quality Gate | config/.env (CLAUDE_MODEL) | Same model as generator |
| Titans | titans/council/agents/*.json | System prompts, routing in titan-router.js |
| Publisher | config/publish-config.json | Chrome profile, venv path, retry settings |

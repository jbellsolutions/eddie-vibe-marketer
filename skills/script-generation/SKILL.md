# Script Generation Skill

## Description
Generates hundreds of ad script variations by rewriting competitor ads in your brand voice, multiplied by each ICP segment. Uses Claude API with brand voice .md files as system context.

## Trigger
When user says: "generate scripts", "write ads", "create variations", "script generation"

## Steps
1. Load competitor research from `data/competitor-research/research-summary.json`
2. Load all brand voice files (writing-rules.md, voice.md, product.md, icp.md)
3. For each competitor ad × each ICP: generate a rewrite in brand voice
4. Save all scripts to `data/generated-scripts/`

## Usage
```bash
npm run phase3:generate
```

## Requirements
- ANTHROPIC_API_KEY in .env
- Completed Phase 1 research data
- Customized brand voice files in brand-voice/

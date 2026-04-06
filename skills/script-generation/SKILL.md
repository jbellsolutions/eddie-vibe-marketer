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

---

## Iron Law

**Never generate scripts without brand voice loaded.** Every generation call must have the full brand voice context (writing-rules.md, voice.md, product.md, icp.md) injected as system prompt. Scripts produced without brand voice are off-brand by definition and must be discarded.

## Phases

### Phase 1: Load Intelligence
- Verify `data/competitor-research/research-summary.json` exists and is non-empty
- Parse and validate research data structure (each entry must have hook, angle, body copy)
- Confirm `ANTHROPIC_API_KEY` is set and non-empty

### Phase 2: Load Brand Voice
- Load all brand voice files from `brand-voice/`: `writing-rules.md`, `voice.md`, `product.md`, `icp.md`
- Validate every required file exists and is non-empty
- Assemble combined system prompt from brand voice files

### Phase 3: Generate Per Format
- For each competitor ad in research data, crossed with each ICP segment:
  - Inject brand voice as system context
  - Generate rewrite in brand voice and tone
  - Tag output with source ad reference, ICP segment, and format type
- Save all generated scripts to `data/generated-scripts/`

### Phase 4: Validate Output
- Confirm every generated script has: ICP tag, source reference, non-empty body
- Reject any script that contains verbatim competitor copy (plagiarism check)
- Log total scripts generated per ICP and per competitor source
- Produce generation summary with counts and any validation failures

## Stop Conditions

Halt execution immediately if any of the following are true:

1. **No research data**: `data/competitor-research/research-summary.json` is missing, empty, or malformed
2. **Missing brand voice files**: Any of `writing-rules.md`, `voice.md`, `product.md`, or `icp.md` is absent or empty in `brand-voice/`
3. **API failure**: `ANTHROPIC_API_KEY` is unset, or Claude API returns repeated auth/rate-limit errors that cannot be retried

# Ad Research Skill

## Description
Scrapes competitor video ads from Meta Ad Library using Apify, transcribes them with OpenAI Whisper, and produces structured research data for script generation.

## Trigger
When user says: "research competitors", "scrape ads", "find competitor ads", "ad research"

## Steps
1. Load config from `config/research-config.json`
2. For each competitor, run Apify Meta Ad Library scraper
3. Download video ads
4. Transcribe each with Whisper
5. Extract hooks, angles, body copy
6. Save structured data to `data/competitor-research/`

## Usage
```bash
npm run phase1:research
```

## Requirements
- APIFY_API_TOKEN in .env
- OPENAI_API_KEY in .env
- Competitors configured in config/research-config.json

---

## Iron Law

**Never publish or pass forward raw scraped data.** All research output must be validated, structured, and stripped of platform metadata before use in downstream phases. Raw scrapes are intermediate artifacts, not deliverables.

## Phases

### Phase 1: Preflight Check
- Verify `APIFY_API_TOKEN` and `OPENAI_API_KEY` are set and non-empty
- Confirm `config/research-config.json` exists and contains at least one competitor entry
- Validate Apify actor is reachable (health ping)
- Ensure `data/competitor-research/` directory exists or can be created

### Phase 2: Scrape
- For each competitor, invoke the Apify Meta Ad Library scraper
- Download all returned video ad assets
- Log per-competitor ad counts; flag any competitor returning zero results

### Phase 3: Transcribe
- Run each downloaded video through OpenAI Whisper
- Validate transcription output is non-empty for each ad
- Store raw transcripts alongside video references

### Phase 4: Aggregate
- Extract hooks, angles, and body copy from each transcript
- Structure all data into `research-summary.json`
- Validate final output: every entry must have at minimum a hook, angle, and source URL
- Remove raw scrape artifacts after aggregation is complete

## Stop Conditions

Halt execution immediately if any of the following are true:

1. **API key missing**: `APIFY_API_TOKEN` or `OPENAI_API_KEY` is unset or empty in `.env`
2. **Apify actor unreachable**: Health check or initial scrape call returns a connection error or 4xx/5xx status
3. **Zero ads returned**: A full scrape run across all configured competitors yields zero video ads total
4. **Config missing**: `config/research-config.json` does not exist or contains no competitor entries

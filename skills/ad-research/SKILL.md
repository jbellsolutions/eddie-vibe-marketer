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

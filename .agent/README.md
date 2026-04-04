# .agent/ — Eddie Vibe Marketer Agent Context

This directory provides identity and state for AI agents working on this repo.

## Files

- `identity.json` — Project identity, components, fragile areas, dependencies
- `state.json` — Cross-session state tracking
- `agent.py` — Level 2 persistent agent (requires `pip install anthropic`)

## Usage

The identity.json is read by Claude Code at session start to understand the project context. state.json tracks health across sessions.

To run the Level 2 agent:
```bash
cd .agent && pip install anthropic && python agent.py
```

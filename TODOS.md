# TODOS

## Setup Required
- [ ] Fill in brand-voice/voice.md with actual brand voice
- [ ] Fill in brand-voice/product.md with product details
- [ ] Fill in brand-voice/icp.md with ICP definitions
- [ ] Configure HeyGen avatar IDs in config/avatar-config.json
- [ ] Set Argil clone_id after creating personal clone
- [ ] Add real competitor URLs to config/research-config.json
- [ ] Set Chrome profile path in config/publish-config.json
- [ ] Create .env from config/.env.example with real API keys

## Enhancements
- [ ] Add smoke tests for each phase script
- [ ] Update README.md for V2 (still describes V1 in parts)
- [ ] Add CSV export option for generated scripts
- [ ] Add Slack notification on publish cycle completion
- [ ] Add rate limiting awareness for HeyGen API
- [ ] Add carousel multi-image assembly (currently individual slides)
- [ ] Add A/B test support in publish queue (same content, different hooks)

## Technical Debt
- [ ] setup.js still references ARCADS_API_KEY in OPTIONAL_KEYS — update to HEYGEN/ARGIL
- [ ] Add input validation for publish-config.json schedule format
- [ ] Add graceful shutdown handler to run-publisher.js for mid-queue interrupts

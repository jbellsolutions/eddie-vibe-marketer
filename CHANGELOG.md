# Changelog

## [2.0.0] - 2026-04-02

### Added
- Multi-format content generation: 7 formats (ugc-video, linkedin-post, screenshot-static, carousel, broll-script, text-overlay, short-caption)
- Titan Genome integration: 18 copywriter agents injected as prompt enhancers
- Quality gate (Phase 3.5): Batch script review against writing rules
- HeyGen API v2 client for ICP-matched avatar videos
- Argil API client for personal clone videos
- Puppeteer-based image generation for static formats (screenshots, carousels, text overlays)
- Browser Use publisher for personal profile posting (Facebook, LinkedIn, Instagram, TikTok)
- Publish queue system with per-platform scheduling, jitter, and retry logic
- Format-specific prompt templates with tiered generation (Tier 1/2/3)
- Avatar-to-ICP configuration mapping
- Performance tracking across formats and platforms in optimize loop

### Changed
- Replaced Arcads ($1,100/mo) with HeyGen ($29/mo) + Argil ($149/mo)
- Rewrote produce-creatives.js for multi-format routing
- Rewrote full-cycle.js for V2 phase sequence
- Updated optimize-loop.js with format and platform winner tracking
- Bumped version to 2.0.0

### Removed
- Arcads API integration
- Ayrshare dependency (replaced with Browser Use)

## [1.0.0] - 2026-03-22

### Added
- Initial release: competitor ad scraping via Apify
- OpenAI Whisper transcription
- UGC video script generation via Claude
- Brand voice system (voice.md, product.md, icp.md, writing-rules.md)
- Singular performance loop
- Setup validation script

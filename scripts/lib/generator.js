/**
 * Core Content Generator
 *
 * Extracted generation loop shared by all formats.
 * Takes a format + brand voice + competitor ad + ICP + titan agents → content
 */

const Anthropic = require('@anthropic-ai/sdk');
const fs = require('fs');
const path = require('path');
const { buildUserPrompt, FORMAT_DEFINITIONS } = require('./formats');
const { getAgentsForFormat, buildTitanPromptSection } = require('./titan-router');

/**
 * Generate a single content piece for a given format, competitor ad, and ICP.
 *
 * @param {Anthropic} client - Anthropic API client
 * @param {object} competitorAd - Competitor ad data from research-summary.json
 * @param {object} brandVoice - Brand voice files { 'writing-rules', voice, product, icp }
 * @param {object} icp - Parsed ICP { name, content }
 * @param {string} format - Content format key (e.g., 'ugc-video')
 * @returns {string} Generated content text
 */
async function generateContent(client, competitorAd, brandVoice, icp, format) {
  const formatDef = FORMAT_DEFINITIONS[format];
  if (!formatDef) throw new Error(`Unknown format: ${format}`);

  // Get Titan agents for this format
  const titanAgents = getAgentsForFormat(format);
  const titanSection = buildTitanPromptSection(titanAgents);

  // Build system prompt: brand voice + Titan DNA
  const systemPrompt = `You are Eddie, an expert content creator. You create ${formatDef.name} content for social media.

CRITICAL RULES — loaded from writing-rules.md:
${brandVoice['writing-rules']}

BRAND VOICE — how we sound:
${brandVoice.voice}

PRODUCT — what we're selling:
${brandVoice.product}

TARGET AUDIENCE for this variation:
${icp.content}${titanSection}`;

  // Build format-specific user prompt
  const userPrompt = buildUserPrompt(format, competitorAd, icp);

  const response = await client.messages.create({
    model: process.env.CLAUDE_MODEL || 'claude-haiku-4-5-20251001',
    max_tokens: formatDef.maxTokens,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  });

  return response.content[0].text;
}

/**
 * Create an Anthropic client from environment
 */
function createClient() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

module.exports = {
  generateContent,
  createClient,
};

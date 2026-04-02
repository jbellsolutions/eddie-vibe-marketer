/**
 * Titan Router — Loads copywriter agent definitions and routes by content format.
 *
 * Each Titan agent has a system_prompt that embodies a legendary copywriter's style.
 * The router selects 1-2 agents per content format and returns their prompts
 * for injection into the generation pipeline.
 */

const fs = require('fs');
const path = require('path');

const AGENTS_DIR = path.resolve(__dirname, '..', '..', 'titans', 'council', 'agents');
const ROUTER_PATH = path.resolve(__dirname, '..', '..', 'titans', 'council', 'router.json');

// Format-to-agent routing map
// Each format gets 1-2 Titan agents whose style best fits the content type
const FORMAT_ROUTING = {
  'ugc-video':        ['alex_hormozi', 'dan_kennedy'],
  'linkedin-post':    ['jay_abraham', 'tom_bilyeu'],
  'screenshot-static':['eugene_schwartz', 'gary_bencivenga'],
  'carousel':         ['joe_sugarman', 'todd_brown'],
  'broll-script':     ['fred_catona', 'dan_kennedy'],
  'text-overlay':     ['eugene_schwartz', 'dan_kennedy'],
  'short-caption':    ['jon_buchan', 'bill_mueller'],
};

let _agentCache = null;
let _routerConfig = null;

/**
 * Load all agent definitions from disk (cached after first call)
 */
function loadAgents() {
  if (_agentCache) return _agentCache;

  _agentCache = {};
  const files = fs.readdirSync(AGENTS_DIR).filter(f => f.endsWith('.json'));

  for (const file of files) {
    const agent = JSON.parse(fs.readFileSync(path.join(AGENTS_DIR, file), 'utf8'));
    _agentCache[agent.agent_key] = agent;
  }

  return _agentCache;
}

/**
 * Load the council router config
 */
function loadRouterConfig() {
  if (_routerConfig) return _routerConfig;
  if (fs.existsSync(ROUTER_PATH)) {
    _routerConfig = JSON.parse(fs.readFileSync(ROUTER_PATH, 'utf8'));
  }
  return _routerConfig;
}

/**
 * Get Titan agents for a given content format.
 * Returns an array of agent objects with system_prompt, display_name, role, etc.
 *
 * @param {string} format - Content format key (e.g., 'ugc-video', 'linkedin-post')
 * @returns {Array} Array of agent objects, or empty array if format not mapped
 */
function getAgentsForFormat(format) {
  const agents = loadAgents();
  const agentKeys = FORMAT_ROUTING[format] || FORMAT_ROUTING['ugc-video'];

  return agentKeys
    .map(key => agents[key])
    .filter(Boolean);
}

/**
 * Build the Titan style influence prompt section from selected agents.
 * This gets appended to the system prompt in the generation pipeline.
 *
 * @param {Array} titanAgents - Array of agent objects from getAgentsForFormat()
 * @returns {string} Formatted prompt section to inject
 */
function buildTitanPromptSection(titanAgents) {
  if (!titanAgents || titanAgents.length === 0) return '';

  const sections = titanAgents.map(agent => {
    const primaryTechnique = agent.sub_agents && agent.sub_agents[0]
      ? agent.sub_agents[0].specialty
      : agent.role;

    return `COPYWRITING INFLUENCE — ${agent.display_name} (${agent.role}):
${agent.system_prompt}
Key technique: ${primaryTechnique}
Style: ${(agent.style_traits || []).join(', ')}`;
  });

  return `\n\n--- TITAN GENOME: COPYWRITING DNA ---
Apply these copywriting masters' perspectives to your writing. Use their techniques and thinking, but write in the brand voice defined above.

${sections.join('\n\n')}
--- END TITAN GENOME ---`;
}

/**
 * List all available agents with their key, name, and role
 */
function listAgents() {
  const agents = loadAgents();
  return Object.values(agents).map(a => ({
    key: a.agent_key,
    name: a.display_name,
    role: a.role,
    best_for: a.best_for || [],
  }));
}

module.exports = {
  getAgentsForFormat,
  buildTitanPromptSection,
  listAgents,
  loadAgents,
  loadRouterConfig,
  FORMAT_ROUTING,
};

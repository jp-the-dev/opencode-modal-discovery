const CACHE_TTL = parseInt(process.env.MODEL_DISCOVERY_CACHE_TTL || '300000', 10);
const cache = new Map();

function toName(id) {
  return id
    .split(/[/:\-_.]/)
    .filter(w => w.length > 0)
    .map(w => w === 'free' ? '(Free)' : w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
    .replace(/It$/, 'it');
}

function toModels(apiModels) {
  const out = {};
  for (const m of apiModels) {
    if (!m.id || typeof m.id !== 'string') continue;
    out[m.id] = {
      name: toName(m.id),
      tool_call: true,
      temperature: true,
      reasoning: false,
      attachment: false,
      cost: { input: 0, output: 0, cache_read: 0, cache_write: 0 },
      limit: { context: 128000, output: 4096 },
      status: 'active',
      options: {},
      headers: {},
    };
  }
  return out;
}

async function fetchModels(baseURL, apiKey) {
  const url = baseURL.replace(/\/+$/, '') + '/v1/models';
  const headers = { 'Content-Type': 'application/json' };
  if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;
  const res = await fetch(url, { headers, signal: AbortSignal.timeout(10000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const body = await res.json();
  if (!body?.data || !Array.isArray(body.data)) throw new Error('Invalid response format');
  return toModels(body.data);
}

export const server = async () => {
  return {
    config: async (config) => {
      if (!config.provider) return;
      for (const [pid, p] of Object.entries(config.provider)) {
        if (p.npm !== '@ai-sdk/openai-compatible') continue;
        const baseURL = p.options?.baseURL;
        if (!baseURL) continue;

        const cached = cache.get(baseURL);
        if (cached && Date.now() - cached.ts < CACHE_TTL) {
          p.models = cached.models;
          continue;
        }

        try {
          const models = await fetchModels(baseURL, p.options?.apiKey);
          cache.set(baseURL, { models, ts: Date.now() });
          p.models = models;
          console.log(`[model-discovery] Discovered ${Object.keys(models).length} models from ${baseURL}`);
        } catch (err) {
          console.error(`[model-discovery] Failed to fetch models from ${baseURL}: ${err.message}`);
          if (cached) {
            p.models = cached.models;
            console.warn(`[model-discovery] Using cached models for ${baseURL}`);
          }
        }
      }
    },
  };
};

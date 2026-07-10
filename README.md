# opencode-model-discovery

A plugin for [opencode](https://opencode.ai) that auto-discovers models from OpenAI-compatible providers.

## How it works

During configuration, the plugin intercepts providers using the `@ai-sdk/openai-compatible` npm package and queries their `/v1/models` endpoint to discover available models. Each discovered model is assigned sensible defaults for tool calling, temperature, context limits, and other settings.

## Features

- **Automatic model discovery** — Fetches available models from any OpenAI-compatible provider's `/v1/models` endpoint
- **Caching** — Caches discovered models (configurable TTL, default 5 minutes) to avoid repeated requests
- **Graceful fallback** — If fetching fails, falls back to cached models when available
- **Smart naming** — Converts model IDs (e.g. `gpt-4o-2024-08-06`) into human-readable names
- **Sensible defaults** — Sets default context limit (128K), output limit (4096), and cost values for all discovered models

## Configuration

| Environment variable | Default | Description |
|---|---|---|
| `MODEL_DISCOVERY_CACHE_TTL` | `300000` (5 min) | Cache TTL in milliseconds |

## Usage

Add `opencode-model-discovery` as a dependency and register the plugin:

```json
{
  "dependencies": {
    "@opencode-ai/plugin": "latest",
    "opencode-model-discovery": "latest"
  }
}
```

The plugin automatically hooks into any provider configured with `"npm": "@ai-sdk/openai-compatible"` and populates its `models` field with discovered models.

## Model defaults

Discovered models are assigned the following defaults:

| Property | Default |
|---|---|
| `tool_call` | `true` |
| `temperature` | `true` |
| `reasoning` | `false` |
| `attachment` | `false` |
| `cost.input` | `0` |
| `cost.output` | `0` |
| `cost.cache_read` | `0` |
| `cost.cache_write` | `0` |
| `limit.context` | `128000` |
| `limit.output` | `4096` |
| `status` | `active` |
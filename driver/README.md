# OpenRouter Driver

Standalone PoC driver for `PLAN2.md`. It starts several simulated office agents, asks OpenRouter what each one should do next, and sends Claude-compatible hook events to the existing Pixel Agents server.

## Run

Terminal A:

```powershell
npx pixel-agents
```

Terminal B:

```powershell
$env:OPENROUTER_API_KEY = "..."
npm.cmd run driver:build
npm.cmd run driver:start
```

Optional settings:

```powershell
$env:PIXEL_AGENTS_WORKSPACE = "C:\path\to\workspace"
$env:PIXEL_AGENTS_DRIVER_LOOP_MS = "2500"
$env:PIXEL_AGENTS_DRIVER_ACTION_MS = "1800"
$env:PIXEL_AGENTS_DRIVER_MAX_ITERATIONS = "3"
$env:PIXEL_AGENTS_DRIVER_MOCK = "1"
$env:OPENROUTER_MODEL_KIM = "meta-llama/llama-3.2-3b-instruct"
$env:OPENROUTER_MODEL_PARK = "qwen/qwen-2.5-7b-instruct"
$env:OPENROUTER_MODEL_LEE = "mistralai/ministral-3b"
```

The driver writes seed transcripts under `~/.claude/projects/<workspace>/` so the current server can adopt the sessions without server changes, then uses `POST /api/hooks/claude` for live activity.

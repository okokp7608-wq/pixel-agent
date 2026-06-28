import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
function numberFromEnv(name, fallback) {
    const raw = process.env[name];
    if (!raw)
        return fallback;
    const parsed = Number(raw);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}
function optionalNumberFromEnv(name) {
    const raw = process.env[name];
    if (!raw)
        return null;
    const parsed = Number(raw);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}
function optionalEnv(name) {
    const value = process.env[name]?.trim();
    return value ? value : undefined;
}
const defaultWorkspacePath = path.resolve(process.env.PIXEL_AGENTS_WORKSPACE ?? process.cwd());
export const DRIVER_CONFIG = {
    workspacePath: defaultWorkspacePath,
    providerId: 'claude',
    loopDelayMs: numberFromEnv('PIXEL_AGENTS_DRIVER_LOOP_MS', 2_500),
    actionDurationMs: numberFromEnv('PIXEL_AGENTS_DRIVER_ACTION_MS', 1_800),
    maxIterations: optionalNumberFromEnv('PIXEL_AGENTS_DRIVER_MAX_ITERATIONS'),
    openRouter: {
        baseUrl: process.env.OPENROUTER_BASE_URL?.replace(/\/$/, '') ?? 'https://openrouter.ai/api/v1',
        appName: process.env.OPENROUTER_APP_NAME ?? 'Pixel Agents OpenRouter Driver',
        siteUrl: optionalEnv('OPENROUTER_SITE_URL'),
    },
    agents: [
        {
            name: '김대리',
            model: process.env.OPENROUTER_MODEL_KIM ?? 'qwen/qwen-2.5-7b-instruct',
            targets: ['config.ts', 'package.json', 'server/src/hookEventHandler.ts'],
        },
        {
            name: '박사원',
            model: process.env.OPENROUTER_MODEL_PARK ?? 'qwen/qwen-2.5-7b-instruct',
            targets: ['README.md', 'webview-ui/src/App.tsx', 'server/src/server.ts'],
        },
        {
            name: '이주임',
            model: process.env.OPENROUTER_MODEL_LEE ?? 'qwen/qwen-2.5-7b-instruct',
            targets: ['npm test', 'npm run check-types', 'driver/src/index.ts'],
        },
    ],
};
export function getApiKey(agent) {
    const envName = agent.apiKeyEnv ?? 'OPENROUTER_API_KEY';
    const apiKey = process.env[envName]?.trim();
    if (apiKey)
        return apiKey;
    try {
        const raw = fs.readFileSync(path.join(os.homedir(), '.pixel-agents', 'openrouter.json'), 'utf8');
        const parsed = JSON.parse(raw);
        return typeof parsed.apiKey === 'string' && parsed.apiKey.trim()
            ? parsed.apiKey.trim()
            : undefined;
    }
    catch {
        return undefined;
    }
}

import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import type { AgentRuntime } from './agentRuntime.js';
import type { AgentStateStore } from './agentStateStore.js';
import type { LoadedAssets, LoadedCharacterSprites } from './assetLoader.js';
import { readConfig, writeConfig } from './configPersistence.js';
import { readLayoutFromFile, writeLayoutToFile } from './layoutPersistence.js';
import { claudeProvider } from './providers/index.js';

type WsSend = (message: Record<string, unknown>) => void;

/** Async hook toggle side effect (install/uninstall + script copy). Provided by cli.ts. */
export type SetHooksEnabledSideEffect = (enabled: boolean) => Promise<void> | void;

/** Cached assets loaded at server startup. Sent to each WebSocket client on webviewReady. */
export interface AssetCache {
  characters: LoadedCharacterSprites | null;
  floorTiles: string[][][] | null;
  wallTiles: string[][][][] | null;
  furniture: LoadedAssets | null;
  defaultLayout: Record<string, unknown> | null;
}

export interface ClientMessageContext {
  store: AgentStateStore;
  runtime?: AgentRuntime;
  cache: AssetCache | null;
  /** Install/uninstall hooks side effect. Needs server url+token known only to cli.ts. */
  onSetHooksEnabled?: SetHooksEnabledSideEffect;
}

// ── Setting key constants (mirror adapters/vscode/constants.ts) ──
const KEY_SOUND_ENABLED = 'pixel-agents.soundEnabled';
const KEY_LAST_SEEN_VERSION = 'pixel-agents.lastSeenVersion';
const KEY_ALWAYS_SHOW_LABELS = 'pixel-agents.alwaysShowLabels';
const KEY_WATCH_ALL_SESSIONS = 'pixel-agents.watchAllSessions';
const KEY_HOOKS_ENABLED = 'pixel-agents.hooksEnabled';
const KEY_HOOKS_INFO_SHOWN = 'pixel-agents.hooksInfoShown';
const OPENROUTER_FILE_NAME = 'openrouter.json';

interface OpenRouterKeyFile {
  apiKey?: string;
  updatedAt?: string;
}

/**
 * Handle incoming ClientMessage from a WebSocket client.
 *
 * In standalone mode, the server is the authority for all state: assets,
 * layout, settings, agents. Assets are loaded once at startup and cached
 * in memory. Each connecting client receives the full state on webviewReady.
 */
export function handleClientMessage(
  msg: Record<string, unknown>,
  send: WsSend,
  ctx: ClientMessageContext,
): void {
  const { store, runtime } = ctx;
  const adapter = store.getAdapter();

  switch (msg.type) {
    case 'webviewReady':
      handleWebviewReady(send, ctx);
      break;

    case 'saveLayout':
      if (msg.layout) {
        writeLayoutToFile(msg.layout as Record<string, unknown>);
      }
      break;

    case 'saveAgentSeats':
      if (msg.seats) {
        adapter?.saveSeats(
          msg.seats as Record<string, { palette?: number; hueShift?: number; seatId?: string }>,
        );
      }
      break;

    case 'setSoundEnabled':
      adapter?.setSetting(KEY_SOUND_ENABLED, msg.enabled);
      break;

    case 'setLastSeenVersion':
      adapter?.setSetting(KEY_LAST_SEEN_VERSION, msg.version as string);
      break;

    case 'setAlwaysShowLabels':
      adapter?.setSetting(KEY_ALWAYS_SHOW_LABELS, msg.enabled);
      break;

    case 'setWatchAllSessions': {
      const enabled = msg.enabled as boolean;
      adapter?.setSetting(KEY_WATCH_ALL_SESSIONS, enabled);
      if (runtime) runtime.watchAllSessions.current = enabled;
      break;
    }

    case 'setHooksEnabled': {
      const enabled = msg.enabled as boolean;
      adapter?.setSetting(KEY_HOOKS_ENABLED, enabled);
      if (runtime) runtime.hooksEnabled.current = enabled;
      void ctx.onSetHooksEnabled?.(enabled);
      break;
    }

    case 'setHooksInfoShown':
      adapter?.setSetting(KEY_HOOKS_INFO_SHOWN, true);
      break;

    case 'setOpenRouterApiKey': {
      const apiKey = typeof msg.apiKey === 'string' ? msg.apiKey.trim() : '';
      if (apiKey) {
        writeOpenRouterApiKey(apiKey);
      }
      send({ type: 'openRouterKeyStatus', configured: hasOpenRouterApiKey() });
      break;
    }

    case 'clearOpenRouterApiKey':
      clearOpenRouterApiKey();
      send({ type: 'openRouterKeyStatus', configured: false });
      break;

    case 'submitAgentPrompt': {
      const prompt = typeof msg.prompt === 'string' ? msg.prompt.trim() : '';
      if (prompt) {
        broadcastAgentPrompt(prompt, store);
      }
      break;
    }

    case 'addExternalAssetDirectory': {
      const newPath = msg.path as string | undefined;
      if (!newPath) break;
      const cfg = readConfig();
      if (!cfg.externalAssetDirectories.includes(newPath)) {
        cfg.externalAssetDirectories.push(newPath);
        writeConfig(cfg);
      }
      send({ type: 'externalAssetDirectoriesUpdated', dirs: cfg.externalAssetDirectories });
      break;
    }

    case 'removeExternalAssetDirectory': {
      const removePath = msg.path as string | undefined;
      if (!removePath) break;
      const cfg = readConfig();
      cfg.externalAssetDirectories = cfg.externalAssetDirectories.filter((d) => d !== removePath);
      writeConfig(cfg);
      send({ type: 'externalAssetDirectoriesUpdated', dirs: cfg.externalAssetDirectories });
      break;
    }

    default:
      // focusAgent, exportLayout, importLayout
      // require IDE-specific handling (not yet implemented for standalone)
      break;
  }
}

function handleWebviewReady(send: WsSend, ctx: ClientMessageContext): void {
  const { store, runtime, cache } = ctx;
  const adapter = store.getAdapter();

  // 1. Provider capabilities (must arrive before any agent messages)
  send({
    type: 'providerCapabilities',
    readingTools: [...claudeProvider.readingTools],
    subagentToolNames: [...claudeProvider.subagentToolNames],
  });

  // 2. Assets (from server cache, loaded at startup via pngjs)
  if (cache) {
    if (cache.characters) {
      send({ type: 'characterSpritesLoaded', characters: cache.characters.characters });
    }
    if (cache.floorTiles) {
      send({ type: 'floorTilesLoaded', sprites: cache.floorTiles });
    }
    if (cache.wallTiles) {
      send({ type: 'wallTilesLoaded', sets: cache.wallTiles });
    }
    if (cache.furniture) {
      send({
        type: 'furnitureAssetsLoaded',
        catalog: cache.furniture.catalog,
        sprites: Object.fromEntries(cache.furniture.sprites),
      });
    }
  }

  // 3. Layout (saved file, or bundled default)
  const savedLayout = readLayoutFromFile();
  send({ type: 'layoutLoaded', layout: savedLayout ?? cache?.defaultLayout ?? null });

  // 4. Settings (from adapter, with sensible defaults when adapter is absent)
  const cfg = readConfig();
  const watchAllSessions = adapter?.getSetting(KEY_WATCH_ALL_SESSIONS, false) ?? false;
  const hooksEnabled = adapter?.getSetting(KEY_HOOKS_ENABLED, true) ?? true;
  send({
    type: 'settingsLoaded',
    soundEnabled: adapter?.getSetting(KEY_SOUND_ENABLED, true) ?? true,
    lastSeenVersion: adapter?.getSetting(KEY_LAST_SEEN_VERSION, '') ?? '',
    extensionVersion: process.env.PIXEL_AGENTS_VERSION ?? '',
    watchAllSessions,
    alwaysShowLabels: adapter?.getSetting(KEY_ALWAYS_SHOW_LABELS, false) ?? false,
    hooksEnabled,
    hooksInfoShown: adapter?.getSetting(KEY_HOOKS_INFO_SHOWN, false) ?? false,
    openRouterApiKeyConfigured: hasOpenRouterApiKey(),
    externalAssetDirectories: cfg.externalAssetDirectories,
  });

  // Sync runtime refs with the persisted settings so scanners behave correctly
  // from the first tick after a server restart.
  if (runtime) {
    runtime.watchAllSessions.current = watchAllSessions;
    runtime.hooksEnabled.current = hooksEnabled;
  }

  // 5. Restore persisted external agents (standalone only; VS Code handles its own restore)
  runtime?.restoreExternalAgents();

  // 6. Existing agents (either just restored, or from VS Code adapter if present)
  const agentIds: number[] = [];
  const folderNames: Record<number, string> = {};
  const externalAgents: Record<number, boolean> = {};
  for (const [id, agent] of store) {
    agentIds.push(id);
    if (agent.folderName) {
      folderNames[id] = agent.folderName;
    }
    if (agent.isExternal) {
      externalAgents[id] = true;
    }
  }
  const seats = adapter?.loadSeats() ?? {};
  send({
    type: 'existingAgents',
    agents: agentIds,
    agentMeta: seats,
    folderNames,
    externalAgents,
  });
}

function getOpenRouterApiKeyPath(): string {
  return path.join(os.homedir(), '.pixel-agents', OPENROUTER_FILE_NAME);
}

function hasOpenRouterApiKey(): boolean {
  if (process.env.OPENROUTER_API_KEY?.trim()) return true;
  try {
    const raw = fs.readFileSync(getOpenRouterApiKeyPath(), 'utf8');
    const parsed = JSON.parse(raw) as OpenRouterKeyFile;
    return typeof parsed.apiKey === 'string' && parsed.apiKey.trim().length > 0;
  } catch {
    return false;
  }
}

function writeOpenRouterApiKey(apiKey: string): void {
  const filePath = getOpenRouterApiKeyPath();
  fs.mkdirSync(path.dirname(filePath), { recursive: true, mode: 0o700 });
  fs.writeFileSync(
    filePath,
    `${JSON.stringify({ apiKey, updatedAt: new Date().toISOString() }, null, 2)}\n`,
    { mode: 0o600 },
  );
}

function clearOpenRouterApiKey(): void {
  try {
    fs.unlinkSync(getOpenRouterApiKeyPath());
  } catch {
    /* file may not exist */
  }
}

function broadcastAgentPrompt(prompt: string, store: AgentStateStore): void {
  const timestamp = Date.now();
  store.broadcast({
    type: 'agentChatMessage',
    role: 'user',
    sender: '사용자',
    text: prompt,
    timestamp,
  });

  const agents = [...store.entries()].filter(([, agent]) => !agent.hooksOnly);
  if (agents.length === 0) {
    store.broadcast({
      type: 'agentChatMessage',
      role: 'debug',
      sender: '시스템',
      text: '표시할 에이전트가 없습니다. 먼저 OpenRouter 드라이버를 실행해 주세요.',
      timestamp: Date.now(),
    });
    return;
  }

  for (const [index, [id, agent]] of agents.entries()) {
    const delayMs = index * 700;
    const toolId = `chat-${timestamp}-${id}`;
    const sender = agent.agentName ?? `에이전트 #${id}`;
    const reply = buildAgentPromptReply(prompt, index, sender);

    setTimeout(() => {
      store.broadcast({
        type: 'agentChatMessage',
        id,
        role: 'agent',
        sender,
        text: reply,
        timestamp: Date.now(),
      });
      store.broadcast({
        type: 'agentToolStart',
        id,
        toolId,
        status: `대화 중: ${shorten(prompt, 32)}`,
        toolName: index % 2 === 0 ? 'Read' : 'Edit',
      });
      store.broadcast({ type: 'agentStatus', id, status: 'active' });
    }, delayMs);

    setTimeout(() => {
      store.broadcast({ type: 'agentToolDone', id, toolId });
      store.broadcast({ type: 'agentStatus', id, status: 'waiting', awaitingInput: false });
    }, delayMs + 1_800);
  }
}

function buildAgentPromptReply(prompt: string, index: number, sender: string): string {
  const topic = shorten(prompt, 44);
  const templates = [
    `${topic} 내용을 먼저 확인해볼게요.`,
    `좋아요. 저는 ${topic} 관점에서 다음 행동을 정리하겠습니다.`,
    `${sender}가 이어서 볼게요. 핵심은 "${topic}" 같습니다.`,
    `이 입력을 기준으로 서로 역할을 나눠 움직여보겠습니다.`,
  ];
  return templates[index % templates.length] ?? templates[0];
}

function shorten(value: string, maxLength: number): string {
  return value.length > maxLength ? `${value.slice(0, maxLength - 1)}…` : value;
}

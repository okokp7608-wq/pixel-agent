import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

import type { AgentConfig } from './config.js';

interface ServerConfig {
  port: number;
  pid: number;
  token: string;
  startedAt: number;
}

export interface DriverSession {
  sessionId: string;
  transcriptPath: string;
  projectDir: string;
  cwd: string;
}

export interface HookPayload {
  session_id: string;
  hook_event_name: string;
  [key: string]: unknown;
}

const SERVER_JSON_PATH = path.join(os.homedir(), '.pixel-agents', 'server.json');

export class OfficeBridge {
  private serverConfig: ServerConfig | null = null;

  constructor(
    private readonly workspacePath: string,
    private readonly providerId: string,
  ) {}

  async waitForServer(timeoutMs = 20_000): Promise<void> {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      const config = this.readServerConfig();
      if (config && (await this.healthCheck(config))) {
        this.serverConfig = config;
        return;
      }
      await sleep(500);
    }
    throw new Error(
      `${SERVER_JSON_PATH}에서 실행 중인 Pixel Agents 서버를 찾지 못했습니다. 먼저 npx pixel-agents를 실행하세요.`,
    );
  }

  createSession(agent: AgentConfig): DriverSession {
    const sessionId = randomUUID();
    const projectDir = this.projectDirForWorkspace(this.workspacePath);
    const transcriptPath = path.join(projectDir, `${sessionId}.jsonl`);
    fs.mkdirSync(projectDir, { recursive: true });

    this.appendJsonl(transcriptPath, {
      type: 'system',
      subtype: 'init',
      content: 'openrouter-driver-ready',
      cwd: this.workspacePath,
      driver: 'openrouter',
      agentName: agent.name,
      model: agent.model,
      seed: seedPadding(agent),
    });

    return {
      sessionId,
      transcriptPath,
      projectDir,
      cwd: this.workspacePath,
    };
  }

  async announceSession(session: DriverSession): Promise<void> {
    await this.postHook({
      session_id: session.sessionId,
      hook_event_name: 'SessionStart',
      source: 'openrouter-driver',
      transcript_path: session.transcriptPath,
      cwd: session.cwd,
    });
  }

  async startTool(session: DriverSession, toolName: string, toolInput: Record<string, unknown>): Promise<void> {
    await this.postHook({
      session_id: session.sessionId,
      hook_event_name: 'PreToolUse',
      tool_name: toolName,
      tool_input: toolInput,
    });
  }

  async finishTool(session: DriverSession): Promise<void> {
    await this.postHook({
      session_id: session.sessionId,
      hook_event_name: 'PostToolUse',
    });
  }

  async stopTurn(session: DriverSession): Promise<void> {
    await this.postHook({
      session_id: session.sessionId,
      hook_event_name: 'Stop',
    });
  }

  async endSession(session: DriverSession, reason = 'exit'): Promise<void> {
    await this.postHook({
      session_id: session.sessionId,
      hook_event_name: 'SessionEnd',
      reason,
    });
  }

  appendUserPrompt(session: DriverSession, text: string): void {
    this.appendJsonl(session.transcriptPath, {
      type: 'user',
      message: {
        role: 'user',
        content: text,
      },
      timestamp: new Date().toISOString(),
    });
  }

  appendAssistantToolUse(
    session: DriverSession,
    toolId: string,
    toolName: string,
    toolInput: Record<string, unknown>,
  ): void {
    this.appendJsonl(session.transcriptPath, {
      type: 'assistant',
      message: {
        role: 'assistant',
        content: [
          {
            type: 'tool_use',
            id: toolId,
            name: toolName,
            input: toolInput,
          },
        ],
      },
      timestamp: new Date().toISOString(),
    });
  }

  appendToolResult(session: DriverSession, toolId: string): void {
    this.appendJsonl(session.transcriptPath, {
      type: 'user',
      message: {
        role: 'user',
        content: [
          {
            type: 'tool_result',
            tool_use_id: toolId,
            content: 'OpenRouter driver simulated action completed.',
          },
        ],
      },
      timestamp: new Date().toISOString(),
    });
  }

  appendTurnDuration(session: DriverSession): void {
    this.appendJsonl(session.transcriptPath, {
      type: 'system',
      subtype: 'turn_duration',
      duration_ms: 1,
      timestamp: new Date().toISOString(),
    });
  }

  private async postHook(payload: HookPayload): Promise<void> {
    const config = this.serverConfig ?? this.readServerConfig();
    if (!config) {
      throw new Error(`${SERVER_JSON_PATH}를 읽을 수 없습니다. Pixel Agents 서버가 실행 중인지 확인하세요.`);
    }
    this.serverConfig = config;

    const response = await fetch(`http://127.0.0.1:${config.port}/api/hooks/${this.providerId}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Pixel Agents hook POST 실패: HTTP ${response.status} ${await response.text()}`);
    }
  }

  private appendJsonl(transcriptPath: string, record: Record<string, unknown>): void {
    fs.mkdirSync(path.dirname(transcriptPath), { recursive: true });
    fs.appendFileSync(transcriptPath, `${JSON.stringify(record)}\n`, 'utf8');
  }

  private readServerConfig(): ServerConfig | null {
    try {
      const raw = fs.readFileSync(SERVER_JSON_PATH, 'utf8');
      const parsed = JSON.parse(raw) as Partial<ServerConfig>;
      if (
        typeof parsed.port === 'number' &&
        typeof parsed.pid === 'number' &&
        typeof parsed.token === 'string'
      ) {
        return parsed as ServerConfig;
      }
    } catch {
      /* missing or malformed server.json */
    }
    return null;
  }

  private async healthCheck(config: ServerConfig): Promise<boolean> {
    try {
      const response = await fetch(`http://127.0.0.1:${config.port}/api/health`);
      return response.ok;
    } catch {
      return false;
    }
  }

  private projectDirForWorkspace(workspacePath: string): string {
    return path.join(os.homedir(), '.claude', 'projects', normalizeProjectPath(workspacePath));
  }
}

function normalizeProjectPath(absPath: string): string {
  return absPath.replace(/[^a-zA-Z0-9-]/g, '-');
}

function seedPadding(agent: AgentConfig): string {
  return `Seed transcript for ${agent.name} (${agent.model}). `.repeat(80);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

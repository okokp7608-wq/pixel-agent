import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
const SERVER_JSON_PATH = path.join(os.homedir(), '.pixel-agents', 'server.json');
export class OfficeBridge {
    workspacePath;
    providerId;
    serverConfig = null;
    constructor(workspacePath, providerId) {
        this.workspacePath = workspacePath;
        this.providerId = providerId;
    }
    async waitForServer(timeoutMs = 20_000) {
        const deadline = Date.now() + timeoutMs;
        while (Date.now() < deadline) {
            const config = this.readServerConfig();
            if (config && (await this.healthCheck(config))) {
                this.serverConfig = config;
                return;
            }
            await sleep(500);
        }
        throw new Error(`${SERVER_JSON_PATH}에서 실행 중인 Pixel Agents 서버를 찾지 못했습니다. 먼저 npx pixel-agents를 실행하세요.`);
    }
    createSession(agent) {
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
    async announceSession(session) {
        await this.postHook({
            session_id: session.sessionId,
            hook_event_name: 'SessionStart',
            source: 'openrouter-driver',
            transcript_path: session.transcriptPath,
            cwd: session.cwd,
        });
    }
    async startTool(session, toolName, toolInput) {
        await this.postHook({
            session_id: session.sessionId,
            hook_event_name: 'PreToolUse',
            tool_name: toolName,
            tool_input: toolInput,
        });
    }
    async finishTool(session) {
        await this.postHook({
            session_id: session.sessionId,
            hook_event_name: 'PostToolUse',
        });
    }
    async stopTurn(session) {
        await this.postHook({
            session_id: session.sessionId,
            hook_event_name: 'Stop',
        });
    }
    async endSession(session, reason = 'exit') {
        await this.postHook({
            session_id: session.sessionId,
            hook_event_name: 'SessionEnd',
            reason,
        });
    }
    appendUserPrompt(session, text) {
        this.appendJsonl(session.transcriptPath, {
            type: 'user',
            message: {
                role: 'user',
                content: text,
            },
            timestamp: new Date().toISOString(),
        });
    }
    appendAssistantToolUse(session, toolId, toolName, toolInput) {
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
    appendToolResult(session, toolId) {
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
    appendTurnDuration(session) {
        this.appendJsonl(session.transcriptPath, {
            type: 'system',
            subtype: 'turn_duration',
            duration_ms: 1,
            timestamp: new Date().toISOString(),
        });
    }
    async postHook(payload) {
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
    appendJsonl(transcriptPath, record) {
        fs.mkdirSync(path.dirname(transcriptPath), { recursive: true });
        fs.appendFileSync(transcriptPath, `${JSON.stringify(record)}\n`, 'utf8');
    }
    readServerConfig() {
        try {
            const raw = fs.readFileSync(SERVER_JSON_PATH, 'utf8');
            const parsed = JSON.parse(raw);
            if (typeof parsed.port === 'number' &&
                typeof parsed.pid === 'number' &&
                typeof parsed.token === 'string') {
                return parsed;
            }
        }
        catch {
            /* missing or malformed server.json */
        }
        return null;
    }
    async healthCheck(config) {
        try {
            const response = await fetch(`http://127.0.0.1:${config.port}/api/health`);
            return response.ok;
        }
        catch {
            return false;
        }
    }
    projectDirForWorkspace(workspacePath) {
        return path.join(os.homedir(), '.claude', 'projects', normalizeProjectPath(workspacePath));
    }
}
function normalizeProjectPath(absPath) {
    return absPath.replace(/[^a-zA-Z0-9-]/g, '-');
}
function seedPadding(agent) {
    return `Seed transcript for ${agent.name} (${agent.model}). `.repeat(80);
}
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

import type { DriverAction } from './config.js';

export interface AgentDecision {
  action: DriverAction;
  target: string;
  reason: string;
}

export interface OfficeToolAction {
  action: Exclude<DriverAction, 'rest'>;
  toolName: 'Read' | 'Edit' | 'Bash';
  toolInput: Record<string, unknown>;
  logText: string;
}

const ACTIONS = new Set<DriverAction>(['read', 'write', 'run', 'rest']);

export function parseDecision(rawText: string): AgentDecision {
  const parsed = parseJsonObject(rawText);
  const action = typeof parsed.action === 'string' ? parsed.action.trim().toLowerCase() : 'rest';
  const target = typeof parsed.target === 'string' ? parsed.target.trim() : '';
  const reason = typeof parsed.reason === 'string' ? parsed.reason.trim() : '';

  return {
    action: ACTIONS.has(action as DriverAction) ? (action as DriverAction) : 'rest',
    target: cleanSingleLine(target).slice(0, 120),
    reason: cleanSingleLine(reason || '다음 작업을 고르는 중').slice(0, 160),
  };
}

export function fallbackDecision(reason: string): AgentDecision {
  return {
    action: 'rest',
    target: '',
    reason: cleanSingleLine(reason).slice(0, 160) || '잠시 대기합니다',
  };
}

export function toOfficeTool(agentName: string, decision: AgentDecision): OfficeToolAction | null {
  const target = decision.target || defaultTarget(decision.action);
  switch (decision.action) {
    case 'read':
      return {
        action: 'read',
        toolName: 'Read',
        toolInput: { file_path: target },
        logText: `[${agentName}] 읽기: ${target} 파일을 살펴보고 있어요. ${decision.reason}`,
      };
    case 'write':
      return {
        action: 'write',
        toolName: 'Edit',
        toolInput: {
          file_path: target,
          old_string: '',
          new_string: '',
        },
        logText: `[${agentName}] 수정: ${target}를 정리하는 중이에요. ${decision.reason}`,
      };
    case 'run':
      return {
        action: 'run',
        toolName: 'Bash',
        toolInput: { command: target },
        logText: `[${agentName}] 실행: ${target} 명령을 확인하고 있어요. ${decision.reason}`,
      };
    case 'rest':
      return null;
  }
}

export function restLog(agentName: string, decision: AgentDecision): string {
  return `[${agentName}] 휴식: 잠깐 쉬는 중이에요. ${decision.reason}`;
}

function parseJsonObject(rawText: string): Record<string, unknown> {
  const candidates = [
    rawText,
    rawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, ''),
    extractFirstJsonObject(rawText),
  ].filter((value): value is string => Boolean(value?.trim()));

  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate) as unknown;
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
    } catch {
      /* try next candidate */
    }
  }

  throw new Error(`OpenRouter 응답을 JSON으로 해석할 수 없습니다: ${rawText.slice(0, 200)}`);
}

function extractFirstJsonObject(rawText: string): string | null {
  const start = rawText.indexOf('{');
  const end = rawText.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) return null;
  return rawText.slice(start, end + 1);
}

function cleanSingleLine(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function defaultTarget(action: DriverAction): string {
  switch (action) {
    case 'read':
      return 'README.md';
    case 'write':
      return 'notes.md';
    case 'run':
      return 'npm test';
    case 'rest':
      return '';
  }
}

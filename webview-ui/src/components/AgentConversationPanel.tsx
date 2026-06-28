import { useState } from 'react';

import type { AgentChatMessage } from '../hooks/useExtensionMessages.js';
import { transport } from '../transport/index.js';
import { Button } from './ui/Button.js';

interface AgentConversationPanelProps {
  messages: AgentChatMessage[];
  agentCount: number;
  apiReady: boolean;
  onOpenRouterKeySettings: () => void;
}

export function AgentConversationPanel({
  messages,
  agentCount,
  apiReady,
  onOpenRouterKeySettings,
}: AgentConversationPanelProps) {
  const [prompt, setPrompt] = useState('');
  const canSend = prompt.trim().length > 0;
  const recent = messages.slice(-8);

  if (!apiReady) {
    return (
      <section className="absolute left-6 bottom-24 z-50 w-[min(440px,calc(100%-24px))] pixel-panel border-border px-6 pt-5 pb-6">
        <div className="flex items-center justify-between gap-4 mb-4">
          <span className="text-accent-bright text-lg leading-none">OpenRouter API</span>
          <span className="text-2xs text-text-muted leading-none">입력 필요</span>
        </div>
        <p className="text-xs text-text-muted leading-snug m-0 mb-5">
          API 키를 먼저 저장하면 Agent 대화 입력창이 열립니다.
        </p>
        <div className="flex justify-end">
          <Button variant="accent" size="sm" onClick={onOpenRouterKeySettings}>
            OpenRouter 키 입력
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section className="absolute left-6 bottom-24 z-50 w-[min(440px,calc(100%-24px))] pixel-panel border-border px-6 pt-5 pb-6">
      <div className="flex items-center justify-between gap-4 mb-4">
        <span className="text-accent-bright text-lg leading-none">Agent 대화</span>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onOpenRouterKeySettings}
            className="text-2xs text-text-muted underline cursor-pointer"
          >
            OpenRouter 키
          </button>
          <span className="text-2xs text-text-muted leading-none">{agentCount}명 연결됨</span>
        </div>
      </div>

      <div className="h-42 overflow-y-auto flex flex-col gap-2 pr-2 mb-5">
        {recent.length === 0 ? (
          <p className="text-xs text-text-muted leading-snug m-0">
            아래에 입력하면 에이전트들이 화면에서 말풍선으로 답하고 움직입니다.
          </p>
        ) : (
          recent.map((message, index) => (
            <div
              key={`${message.timestamp}-${index}`}
              className={`text-xs leading-snug px-3 py-2 border ${
                message.role === 'user'
                  ? 'border-accent text-white'
                  : message.role === 'debug'
                    ? 'border-status-permission text-status-permission'
                    : 'border-border text-text'
              }`}
            >
              <span className="text-text-muted mr-2">{message.sender ?? 'Agent'}</span>
              {message.text}
            </div>
          ))
        )}
      </div>

      <form
        className="flex flex-col gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          const value = prompt.trim();
          if (!value) return;
          transport.send({ type: 'submitAgentPrompt', prompt: value });
          setPrompt('');
        }}
      >
        <textarea
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          placeholder="에이전트에게 지시할 내용을 입력하세요"
          rows={3}
          className="w-full resize-none bg-bg border-2 border-border text-text px-4 py-3 text-sm outline-none shadow-pixel"
        />
        <div className="flex justify-end">
          <Button variant="accent" size="sm" disabled={!canSend}>
            보내기
          </Button>
        </div>
      </form>
    </section>
  );
}

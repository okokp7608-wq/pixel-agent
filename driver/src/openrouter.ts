import type { AgentConfig, DriverConfig } from './config.js';

interface ChatCompletionResponse {
  choices?: Array<{
    message?: {
      content?: string | Array<{ type?: string; text?: string }>;
    };
  }>;
}

const MOCK_ACTIONS = ['read', 'write', 'run', 'rest'] as const;

export class OpenRouterClient {
  constructor(private readonly config: DriverConfig['openRouter']) {}

  async completeJson(options: {
    agent: AgentConfig;
    apiKey?: string;
    userPrompt: string;
    signal?: AbortSignal;
  }): Promise<string> {
    if (process.env.PIXEL_AGENTS_DRIVER_MOCK === '1' || !options.apiKey) {
      return this.mockResponse(options.agent);
    }

    const apiKey = options.apiKey;
    const requestOptions = {
      ...options,
      apiKey,
    };

    const text = await this.postChatCompletion(requestOptions, true).catch(async (error: unknown) => {
      if (error instanceof OpenRouterHttpError && error.status === 400) {
        return this.postChatCompletion(requestOptions, false);
      }
      throw error;
    });

    let parsed: ChatCompletionResponse;
    try {
      parsed = JSON.parse(text) as ChatCompletionResponse;
    } catch {
      throw new Error(`OpenRouter 응답이 JSON이 아닙니다: ${text.slice(0, 500)}`);
    }

    const content = parsed.choices?.[0]?.message?.content;
    if (typeof content === 'string') return content;
    if (Array.isArray(content)) {
      return content
        .map((part) => (typeof part.text === 'string' ? part.text : ''))
        .join('')
        .trim();
    }
    throw new Error('OpenRouter 응답에 message.content가 없습니다');
  }

  private mockResponse(agent: AgentConfig): string {
    const action = MOCK_ACTIONS[Math.floor(Math.random() * MOCK_ACTIONS.length)];
    const target = agent.targets?.length
      ? agent.targets[Math.floor(Math.random() * agent.targets.length)]
      : 'README.md';
    const reason = `모의 ${action} 작업을 선택했어요.`;

    return JSON.stringify({ action, target, reason });
  }

  private async postChatCompletion(
    options: {
      agent: AgentConfig;
      apiKey: string;
      userPrompt: string;
      signal?: AbortSignal;
    },
    jsonMode: boolean,
  ): Promise<string> {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${options.apiKey}`,
      'Content-Type': 'application/json',
      'X-Title': this.config.appName,
    };
    if (this.config.siteUrl) {
      headers['HTTP-Referer'] = this.config.siteUrl;
    }

    const body = {
      model: options.agent.model,
      temperature: options.agent.temperature ?? 0.4,
      ...(jsonMode ? { response_format: { type: 'json_object' } } : {}),
      messages: [
        {
          role: 'system',
          content:
            options.agent.systemPrompt ??
            '당신은 픽셀 오피스에서 일하는 사무실 직원입니다. 항상 한국어로 짧게 판단합니다.',
        },
        {
          role: 'user',
          content: options.userPrompt,
        },
      ],
    };

    const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: options.signal,
    });

    const text = await response.text();
    if (!response.ok) {
      throw new OpenRouterHttpError(response.status, text);
    }

    return text;
  }
}

class OpenRouterHttpError extends Error {
  constructor(
    readonly status: number,
    readonly body: string,
  ) {
    super(`OpenRouter HTTP ${status}: ${body.slice(0, 500)}`);
  }
}

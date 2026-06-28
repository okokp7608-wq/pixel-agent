import { parseDecision, restLog, toOfficeTool } from './actions.js';
import { getApiKey } from './config.js';
export class AgentRunner {
    agent;
    driverConfig;
    openRouter;
    office;
    logger;
    session = null;
    iteration = 0;
    constructor(agent, driverConfig, openRouter, office, logger) {
        this.agent = agent;
        this.driverConfig = driverConfig;
        this.openRouter = openRouter;
        this.office = office;
        this.logger = logger;
    }
    async run(signal) {
        const apiKey = getApiKey(this.agent);
        this.session = this.office.createSession(this.agent);
        await this.office.announceSession(this.session);
        await this.office.stopTurn(this.session);
        this.logger.agent(this.agent.name, `[${this.agent.name}] 시작: ${this.agent.model} 모델로 오피스에 입장했어요.`);
        while (!signal.aborted && this.shouldContinue()) {
            const decision = await this.decide(apiKey, signal);
            if (signal.aborted)
                break;
            const officeTool = toOfficeTool(this.agent.name, decision);
            if (!officeTool) {
                this.logger.agent(this.agent.name, restLog(this.agent.name, decision));
                this.office.appendUserPrompt(this.session, `다음 행동을 정해주세요: ${decision.reason}`);
                await this.office.stopTurn(this.session);
                this.office.appendTurnDuration(this.session);
                await sleep(this.loopDelayMs(), signal);
                continue;
            }
            const toolId = `or-${Date.now()}-${this.iteration}`;
            this.logger.agent(this.agent.name, officeTool.logText);
            this.office.appendUserPrompt(this.session, `다음 행동: ${decision.action} ${decision.target}`);
            await this.office.startTool(this.session, officeTool.toolName, officeTool.toolInput);
            this.office.appendAssistantToolUse(this.session, toolId, officeTool.toolName, officeTool.toolInput);
            await sleep(this.actionDurationMs(), signal);
            if (signal.aborted)
                break;
            await this.office.finishTool(this.session);
            this.office.appendToolResult(this.session, toolId);
            await this.office.stopTurn(this.session);
            this.office.appendTurnDuration(this.session);
            await sleep(this.loopDelayMs(), signal);
        }
        if (this.session) {
            await this.office.endSession(this.session, 'exit').catch((error) => {
                this.logger.warn(`[${this.agent.name}] 종료 신호 전송 실패: ${error instanceof Error ? error.message : String(error)}`);
            });
        }
    }
    async decide(apiKey, signal) {
        this.iteration += 1;
        const prompt = buildDecisionPrompt(this.agent, this.iteration);
        try {
            const raw = await this.openRouter.completeJson({
                agent: this.agent,
                apiKey,
                userPrompt: prompt,
                signal,
            });
            return parseDecision(raw);
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            this.logger.warn(`[${this.agent.name}] OpenRouter 호출 실패: ${message}`);
            return fallbackMovingDecision(this.agent, this.iteration);
        }
    }
    loopDelayMs() {
        return this.agent.loopDelayMs ?? this.driverConfig.loopDelayMs;
    }
    actionDurationMs() {
        return this.agent.actionDurationMs ?? this.driverConfig.actionDurationMs;
    }
    shouldContinue() {
        return this.driverConfig.maxIterations === null || this.iteration < this.driverConfig.maxIterations;
    }
}
function buildDecisionPrompt(agent, iteration) {
    const targets = agent.targets?.length ? agent.targets.join(', ') : 'README.md, package.json, npm test';
    return [
        `당신의 이름은 ${agent.name}입니다.`,
        '픽셀 오피스 데모에서 실제 파일을 수정하지 않고, 지금 할 일을 하나 고릅니다.',
        `추천 대상: ${targets}`,
        `현재 반복 번호: ${iteration}`,
        '가능한 action은 read, write, run, rest 중 하나입니다.',
        '반드시 다음 JSON 객체 하나만 응답하세요.',
        '{"action":"read|write|run|rest","target":"대상 파일 또는 명령","reason":"한국어 한 줄 이유"}',
    ].join('\n');
}
function fallbackMovingDecision(agent, iteration) {
    const actions = ['read', 'write', 'run'];
    const action = actions[iteration % actions.length];
    const targets = agent.targets?.length ? agent.targets : ['README.md'];
    const target = targets[iteration % targets.length] ?? 'README.md';
    return {
        action,
        target,
        reason: 'OpenRouter 응답이 불안정해서 모의 작업으로 계속 움직입니다',
    };
}
function sleep(ms, signal) {
    return new Promise((resolve) => {
        if (signal.aborted) {
            resolve();
            return;
        }
        const timer = setTimeout(resolve, ms);
        signal.addEventListener('abort', () => {
            clearTimeout(timer);
            resolve();
        }, { once: true });
    });
}

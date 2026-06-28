import { AgentRunner } from './agent.js';
import { DRIVER_CONFIG } from './config.js';
import { DriverLogger } from './logger.js';
import { OpenRouterClient } from './openrouter.js';
import { OfficeBridge } from './office.js';
async function main() {
    const logger = new DriverLogger();
    const abortController = new AbortController();
    process.once('SIGINT', () => abortController.abort());
    process.once('SIGTERM', () => abortController.abort());
    logger.info(`[driver] workspace: ${DRIVER_CONFIG.workspacePath}`);
    logger.info('[driver] Pixel Agents 서버를 찾는 중입니다.');
    const office = new OfficeBridge(DRIVER_CONFIG.workspacePath, DRIVER_CONFIG.providerId);
    await office.waitForServer();
    logger.info(`[driver] ${DRIVER_CONFIG.agents.length}개 에이전트를 시작합니다.`);
    const openRouter = new OpenRouterClient(DRIVER_CONFIG.openRouter);
    const runners = DRIVER_CONFIG.agents.map((agent) => new AgentRunner(agent, DRIVER_CONFIG, openRouter, office, logger));
    await Promise.all(runners.map((runner) => runner.run(abortController.signal)));
}
main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
});

<h1 align="center">
    <a href="https://github.com/pixel-agents-hq/pixel-agents/discussions">
        <img src="webview-ui/public/banner.png" alt="Pixel Agents">
    </a>
</h1>

<h2 align="center" style="padding-bottom: 20px;">
  AI 에이전트가 실제로 일하는 모습을 말풍선을 통해서 보여주는 인터페이스
</h2>

<div align="center" style="margin-top: 25px;">

[![version](https://img.shields.io/endpoint?url=https%3A%2F%2Fgist.githubusercontent.com%2Fpablodelucca%2F3cd28398fa4a2c0a636e1d51d41aee39%2Fraw%2Fversion.json)](https://github.com/pixel-agents-hq/pixel-agents/releases)
[![marketplaces](https://img.shields.io/endpoint?url=https%3A%2F%2Fgist.githubusercontent.com%2Fpablodelucca%2F3cd28398fa4a2c0a636e1d51d41aee39%2Fraw%2Finstalls.json)](https://marketplace.visualstudio.com/items?itemName=pablodelucca.pixel-agents)
[![stars](https://img.shields.io/github/stars/pixel-agents-hq/pixel-agents?logo=github&color=0183ff&style=flat)](https://github.com/pixel-agents-hq/pixel-agents/stargazers)
[![license](https://img.shields.io/github/license/pixel-agents-hq/pixel-agents?color=0183ff&style=flat)](https://github.com/pixel-agents-hq/pixel-agents/blob/main/LICENSE)
[![good first issues](https://img.shields.io/github/issues/pixel-agents-hq/pixel-agents/good%20first%20issue?color=7057ff&label=good%20first%20issues)](https://github.com/pixel-agents-hq/pixel-agents/issues?q=is%3Aopen+is%3Aissue+label%3A%22good+first+issue%22)


## 행안부 6주차 과제 변경사항

이 저장소에는 `PLAN2.md` 요구사항에 맞춰 OpenRouter 기반 픽셀 에이전트 실행 흐름을 추가했다. 사용자는 웹 화면에서 OpenRouter API 키를 먼저 입력하고, 그 다음 에이전트에게 직접 지시내용을 입력할 수 있다. 입력된 지시는 화면의 에이전트 대화 패널에 표시되며, 에이전트 상태와 디버그 대화는 픽셀 오피스 위 말풍선/상태 표시로 함께 나타난다.

### 작업 폴더

- 과제 루트: `C:\Users\KAC\Documents\행안부_고급인증과정\6주차과제\pixel-agents-main`
- 실제 소스 루트: `C:\Users\KAC\Documents\행안부_고급인증과정\6주차과제\pixel-agents-main\pixel-agents-main`
- 과제 계획 문서: `C:\Users\KAC\Documents\행안부_고급인증과정\6주차과제\pixel-agents-main\PLAN2.md`
- 실행 주소: `http://127.0.0.1:3100/`
- OpenRouter 키 저장 위치: `C:\Users\KAC\.pixel-agents\openrouter.json`
- Pixel Agents 서버 설정/상태 위치: `C:\Users\KAC\.pixel-agents\server.json`, `C:\Users\KAC\.pixel-agents\standalone-state.json`
- 드라이버 세션 파일 위치: `C:\Users\KAC\.claude\projects\<workspace-hash>\*.jsonl`

### 추가 및 수정된 주요 소스 경로

- `driver/`  
  OpenRouter 기반 standalone 드라이버를 추가한 폴더다. 서버에 Claude 호환 hook 이벤트를 보내 픽셀 에이전트가 실제로 화면에 입장하고 움직이게 한다.
- `driver/src/config.ts`  
  드라이버 설정, 기본 모델, 반복 주기, OpenRouter API 키 로딩을 담당한다. `OPENROUTER_API_KEY` 환경변수가 없으면 `C:\Users\KAC\.pixel-agents\openrouter.json`을 읽는다.
- `driver/src/openrouter.ts`  
  OpenRouter Chat Completions API 호출과 JSON 응답 파싱을 담당한다.
- `driver/src/agent.ts`  
  각 에이전트가 OpenRouter 응답에 따라 읽기, 실행, 대기 같은 행동을 선택하도록 한다.
- `driver/src/office.ts`  
  Pixel Agents 서버의 `/api/hooks/claude` 엔드포인트로 `SessionStart`, `PreToolUse`, `PostToolUse`, `Stop` 이벤트를 보낸다.
- `server/src/clientMessageHandler.ts`  
  OpenRouter 키 저장/삭제, API 키 설정 상태 전송, 사용자 지시내용 제출(`submitAgentPrompt`), 대화 메시지 브로드캐스트(`agentChatMessage`)를 처리한다.
- `core/asyncapi.yaml`  
  OpenRouter 키 상태, 키 저장/삭제, 사용자 지시 입력, 에이전트 대화 메시지 프로토콜을 추가했다.
- `core/src/messages.ts`  
  `core/asyncapi.yaml`에서 자동 생성된 타입 정의 파일이다.
- `webview-ui/src/App.tsx`  
  화면 진입 시 OpenRouter API 키 입력창을 먼저 띄우고, 키 저장 후 사용자 지시 입력 패널을 열도록 게이트 흐름을 추가했다.
- `webview-ui/src/components/OpenRouterKeyModal.tsx`  
  OpenRouter API 키 입력 모달이다. 키 표시/숨김과 저장 동작을 제공한다.
- `webview-ui/src/components/AgentConversationPanel.tsx`  
  사용자가 에이전트에게 직접 지시내용을 입력하는 웹 패널이다. API 키가 없으면 입력창 대신 키 입력 안내를 보여준다.
- `webview-ui/src/components/DebugView.tsx`  
  디버그 화면에서 에이전트 대화 메시지도 함께 볼 수 있도록 확장했다.
- `webview-ui/src/office/components/ToolOverlay.tsx`  
  에이전트 상태와 대화 내용을 픽셀 오피스 위 말풍선처럼 표시한다.
- `webview-ui/src/hooks/useExtensionMessages.ts`  
  서버 메시지를 받아 React 상태와 캔버스 상태에 반영한다. 특히 `existingAgents`가 레이아웃 로딩 이후 도착해도 즉시 `os.addAgent(...)`를 호출하도록 수정해, "3명 연결됨"은 보이지만 픽셀 에이전트가 안 보이던 문제를 해결했다.
- `package.json`  
  `driver:build`, `driver:dev`, `driver:start` 스크립트를 추가했다.

### 구현된 화면 흐름

1. `http://127.0.0.1:3100/` 접속
2. OpenRouter API 키 입력 모달 표시
3. 키 저장 후 에이전트 지시내용 입력창 표시
4. 사용자가 직접 지시내용 입력 후 `보내기`
5. 대화 패널에 사용자 입력과 에이전트 응답 표시
6. 픽셀 오피스 화면 위에 에이전트 상태와 말풍선 표시
7. 디버그 화면에서도 에이전트 대화/상태 메시지 확인 가능

### 실행 방법

프로젝트 소스 루트에서 실행한다.

```powershell
cd "C:\Users\KAC\Documents\행안부_고급인증과정\6주차과제\pixel-agents-main\pixel-agents-main"
npm install
npm run build
node dist/cli.js --port 3100
```

별도 터미널에서 드라이버를 실행한다.

```powershell
cd "C:\Users\KAC\Documents\행안부_고급인증과정\6주차과제\pixel-agents-main\pixel-agents-main"
npm run driver:start
```

브라우저에서 아래 주소를 연다.

```text
http://127.0.0.1:3100/
```

### 검증한 내용

- `npm.cmd run check-types` 통과
- `npm.cmd run lint` 통과
- `npm.cmd run build` 통과
- `node dist/cli.js --port 3100` 서버 실행 확인
- `node driver/dist/index.js` 드라이버 실행 확인
- 서버 로그에서 에이전트 1, 2, 3 생성 확인
- 브라우저에서 OpenRouter API 키 입력창이 먼저 뜨는 것 확인
- API 키 입력 이후 사용자 지시내용 입력창이 열리는 흐름 확인
- 기존 에이전트 복원 시 픽셀 에이전트가 화면에 보이지 않던 문제 수정 확인

## Features

- **One agent, one character** — every Claude Code terminal gets its own animated character
- **Live activity tracking** — characters animate based on what the agent is actually doing (writing, reading, running commands)
- **Office layout editor** — design your office with floors, walls, and furniture using a built-in editor
- **Speech bubbles** — visual indicators when an agent is waiting for input or needs permission
- **Sound notifications** — optional chime when an agent finishes its turn
- **Sub-agent visualization** — Task tool sub-agents spawn as separate characters linked to their parent
- **Persistent layouts** — your office design is saved and shared across VS Code windows
- **External asset directories** — load custom or third-party furniture packs from any folder on your machine
- **Diverse characters** — 6 diverse characters. These are based on the amazing work of [JIK-A-4, Metro City](https://jik-a-4.itch.io/metrocity-free-topdown-character-pack).
### 전체 아키텍처
```text
OpenRouter
    │
Driver (Node)
    │
Agent Loop
    │
Hook API
    │
Pixel Agents Server
    │
WebView
``
###  프로젝트 구조
```text
project/
  README.md
  core/
    asyncapi.yaml
    src/
      adapter.ts
      constants.ts
      index.ts
      messages.ts
      normalizeProjectPath.ts
      provider.ts
      schemas.ts
      teamProvider.ts
      terminalAdapter.ts
      transport.ts
      assets/
  driver/
    package.json
    README.md
    tsconfig.json
    dist/
      actions.js
      agent.js
      config.js
      index.js
      logger.js
      office.js
      openrouter.js
    src/
      actions.ts
      agent.ts
      config.ts
      index.ts
      logger.ts
      office.ts
      openrouter.ts
  server/
    manual-hook-events.http
    package.json
    tsconfig.test.json
    vitest.config.ts
    __tests__/
      agentStateStore.test.ts
      claude-hook.test.ts
      claude.test.ts
      claudeHookInstaller.test.ts
      claudeTeamProvider.test.ts
      fileStateAdapter.test.ts
      fileWatcherDismissal.test.ts
      hookEventHandler.test.ts
      migrateVsCodeState.test.ts
      mockClaudeRunner.test.ts
      server.test.ts
      sessionRouter.test.ts
      teamUtils.test.ts
    src/
      agentRuntime.ts
      agentStateStore.ts
      assetLoader.ts
      cli.ts
      clientMessageHandler.ts
      configPersistence.ts
      constants.ts
      dismissalTracker.ts
      fileStateAdapter.ts
      fileWatcher.ts
      hookEventHandler.ts
      httpServer.ts
      layoutPersistence.ts
      server.ts
      sessionRouter.ts
      teamUtils.ts
      timerManager.ts
      transcriptParser.ts
      types.ts
      providers/
```
### 구현 내용
신규 Driver
index.ts : 실행 진입점
config.ts : 에이전트 설정
agent.ts : Agent Loop
office.ts : Hook 전송
openrouter.ts : OpenRouter 호출
actions.ts : 행동 매핑
logger.ts : 한국어 로그
### 수정 사항
Driver 폴더 신규 추가
OpenRouter API 연동
Hook 기반 행동 처리
Action 매핑 구현
한국어 로그 추가
### 실행 방법
```bash
npm install
npm run build
npx pixel-agents
node driver/dist/index.js
```
### 향후 개선
Provider 승격
JSONL 의존 제거
실제 파일 편집 Tool 연결
협업형 Multi-Agent 지원
10. 결론
기존 Pixel Agents의 렌더링 및 서버 구조를 유지하면서 OpenRouter 기반의 독립적인 Driver를 추가하여 Multi-Agent 환경을 구현하는 것을 목표로 하였으며, 확장 가능한 구조를 확보하였다.

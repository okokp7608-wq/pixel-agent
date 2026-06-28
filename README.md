<h1 align="center">
    <a href="https://github.com/pixel-agents-hq/pixel-agents/discussions">
        <img src="webview-ui/public/banner.png" alt="Pixel Agents">
    </a>
</h1>

<h2 align="center" style="padding-bottom: 20px;">
  The game interface where AI agents build real things
</h2>

<div align="center" style="margin-top: 25px;">

[![version](https://img.shields.io/endpoint?url=https%3A%2F%2Fgist.githubusercontent.com%2Fpablodelucca%2F3cd28398fa4a2c0a636e1d51d41aee39%2Fraw%2Fversion.json)](https://github.com/pixel-agents-hq/pixel-agents/releases)
[![marketplaces](https://img.shields.io/endpoint?url=https%3A%2F%2Fgist.githubusercontent.com%2Fpablodelucca%2F3cd28398fa4a2c0a636e1d51d41aee39%2Fraw%2Finstalls.json)](https://marketplace.visualstudio.com/items?itemName=pablodelucca.pixel-agents)
[![stars](https://img.shields.io/github/stars/pixel-agents-hq/pixel-agents?logo=github&color=0183ff&style=flat)](https://github.com/pixel-agents-hq/pixel-agents/stargazers)
[![license](https://img.shields.io/github/license/pixel-agents-hq/pixel-agents?color=0183ff&style=flat)](https://github.com/pixel-agents-hq/pixel-agents/blob/main/LICENSE)
[![good first issues](https://img.shields.io/github/issues/pixel-agents-hq/pixel-agents/good%20first%20issue?color=7057ff&label=good%20first%20issues)](https://github.com/pixel-agents-hq/pixel-agents/issues?q=is%3Aopen+is%3Aissue+label%3A%22good+first+issue%22)

</div>

<div align="center">
<a href="https://marketplace.visualstudio.com/items?itemName=pablodelucca.pixel-agents">🛒 VS Code Marketplace</a> • <a href="https://github.com/pixel-agents-hq/pixel-agents/discussions">💬 Discussions</a> • <a href="https://github.com/pixel-agents-hq/pixel-agents/issues">🐛 Issues</a> • <a href="CONTRIBUTING.md">🤝 Contributing</a> • <a href="CHANGELOG.md">📋 Changelog</a>
</div>

<br/>

Pixel Agents turns multi-agent AI systems into something you can actually see and manage. Each agent becomes a character in a pixel art office. They walk around, sit at their desk, and visually reflect what they are doing — typing when writing code, reading when searching files, waiting when it needs your attention.

It ships in **two flavors from the same source tree**:

- **VS Code extension** — `pablodelucca.pixel-agents` on the [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=pablodelucca.pixel-agents) and [Open VSX](https://open-vsx.org/extension/pablodelucca/pixel-agents). Agents spawn into VS Code terminals; characters render in the panel area.
- **Standalone CLI** — `npx pixel-agents` runs a local Fastify server and serves the office as a browser SPA. Useful in tmux workflows, remote sessions, or any environment without a desktop VS Code.

Internally, the architecture is fully agent-agnostic and platform-agnostic: a typed `HookProvider` interface defines the integration boundary so adding a new AI tool is a single subdirectory of code. Claude Code is the reference implementation today; Codex, Gemini, Cursor, and others are on the roadmap.

![Pixel Agents screenshot](webview-ui/public/Screenshot.jpg)

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

<p align="center">
  <img src="webview-ui/public/characters.png" alt="Pixel Agents characters" width="320" height="72" style="image-rendering: pixelated;">
</p>

## Requirements

- VS Code 1.105.0 or later
- [Claude Code CLI](https://docs.anthropic.com/en/docs/claude-code) installed and configured
- **Platform**: Windows, Linux, and macOS are supported

## Getting Started

If you just want to use Pixel Agents, the easiest way is to download the [VS Code extension](https://marketplace.visualstudio.com/items?itemName=pablodelucca.pixel-agents). If you want to play with the code, develop, or contribute, then:

### Install from source

```bash
git clone https://github.com/pixel-agents-hq/pixel-agents.git
cd pixel-agents
npm install      # npm workspaces installs root + server + webview-ui in one shot
npm run build
```

Then press **F5** in VS Code to launch the Extension Development Host.

To try the **standalone CLI** locally:

```bash
node dist/cli.js                 # or npx pixel-agents [--port 3100] after publish
```

It starts the Fastify server, opens the webview SPA at `http://localhost:3100`, and (in the same `~/.pixel-agents/` namespace) shares your hooks and layout with the VS Code extension if both are running.

### Browser Preview & Hosted Reports

The browser-preview version of the webview can be built and staged for Vercel separately from the VS Code extension build.

```bash
npm run test
npm run e2e
npm run e2e -- --attach-videos-on-success
npm run vercel:prepare
```

Run `npm run test:report` separately when you want the combined Allure report locally without preparing the full Vercel output.

The staged Vercel output serves the standalone webview at `/webview/` and the Linux Allure report at `/reports/allure/`, combining the `e2e`, `server`, and `webview` suites. The GitHub Actions deploy job expects `VERCEL_TOKEN`, `VERCEL_ORG_ID`, and `VERCEL_PROJECT_ID` secrets.

### Usage

1. Open the **Pixel Agents** panel (it appears in the bottom panel area alongside your terminal)
2. Click **+ Agent** to spawn a new Claude Code terminal and its character. Right-click for the option to launch with `--dangerously-skip-permissions` (bypasses all tool approval prompts)
3. Start coding with Claude — watch the character react in real time
4. Click a character to select it, then click a seat to reassign it
5. Click **Layout** to open the office editor and customize your space

## Layout Editor

The built-in editor lets you design your office:

- **Floor** — Full HSB color control
- **Walls** — Auto-tiling walls with color customization
- **Tools** — Select, paint, erase, place, eyedropper, pick
- **Undo/Redo** — 50 levels with Ctrl+Z / Ctrl+Y
- **Export/Import** — Share layouts as JSON files via the Settings modal

The grid is expandable up to 64×64 tiles. Click the ghost border outside the current grid to grow it.

### Office Assets

All office assets (furniture, floors, walls) are now **fully open-source** and included in this repository under `webview-ui/public/assets/`. No external purchases or imports are needed — everything works out of the box.

Each furniture item lives in its own folder under `assets/furniture/` with a `manifest.json` that declares its sprites, rotation groups, state groups (on/off), and animation frames. Floor tiles are individual PNGs in `assets/floors/`, and wall tile sets are in `assets/walls/`. This modular structure makes it easy to add, remove, or modify assets without touching any code.

To add a new furniture item, create a folder in `webview-ui/public/assets/furniture/` with your PNG sprite(s) and a `manifest.json`, then rebuild. The asset manager (`scripts/asset-manager.html`) provides a visual editor for creating and editing manifests.

To use furniture from an external directory, open Settings → **Add Asset Directory**. See [docs/external-assets.md](docs/external-assets.md) for the full manifest format and how to use third-party asset packs.

Characters are based on the amazing work of [JIK-A-4, Metro City](https://jik-a-4.itch.io/metrocity-free-topdown-character-pack).

## How It Works

Pixel Agents has two parallel detection paths:

- **Hooks mode** (preferred) — Claude Code's official Hooks API POSTs events (`SessionStart`, `PreToolUse`, `Notification`, `Stop`, etc.) to a local Fastify server (`POST /api/hooks/:providerId`). Instant, reliable. Server discovery via `~/.pixel-agents/server.json`.
- **Heuristic mode** (fallback) — Polls JSONL transcript files at `~/.claude/projects/<project-hash>/<session-id>.jsonl`. Used when hooks aren't installed.

A single `HookProvider.normalizeHookEvent(raw)` translates each CLI's hook payload into a canonical `AgentEvent`. The shared `AgentRuntime` dispatches on `AgentEvent.kind`, mutates `AgentStateStore`, and the broadcast layer translates state events into typed `ServerMessage` over the active transport.

The webview runs a lightweight game loop with canvas rendering, BFS pathfinding, and a character state machine (idle → walk → type/read). Everything is pixel-perfect at integer zoom levels. Game state lives in an imperative `OfficeState` class outside React; React components read from it during render but don't own the state.

No modifications to Claude Code are needed — Pixel Agents is purely observational.

## Tech Stack

Four-package monorepo, npm workspaces:

- **`core/`** — TypeScript-only protocol + interfaces (AsyncAPI 3.0 contract, `HookProvider`, `MessageTransport`, `StateAdapter`). Zero runtime side effects.
- **`server/`** — Fastify v5 (HTTP + WebSocket), Vitest. Owns `AgentRuntime`, `AgentStateStore`, `SessionRouter`, `DismissalTracker`, file watching, transcript parsing, providers. Ships the `npx pixel-agents` CLI.
- **`adapters/vscode/`** — VS Code Extension API. Composes `core/` + `server/` for the desktop surface.
- **`webview-ui/`** — React 19, Vite, Canvas 2D. Transport-agnostic (`PostMessageTransport` in VS Code, `WebSocketTransport` in the browser).

Builds: esbuild (extension + CLI + hook scripts), Vite (webview SPA). Tests: Vitest (server + webview unit), Playwright (e2e against real VS Code + standalone Fastify).

## Known Limitations

- **Agent-terminal sync** — the way agents are connected to Claude Code terminal instances is not super robust and sometimes desyncs, especially when terminals are rapidly opened/closed or restored across sessions.
- **Heuristic-based status detection** — Claude Code's JSONL transcript format does not provide clear signals for when an agent is waiting for user input or when it has finished its turn. The current detection is based on heuristics (idle timers, turn-duration events) and often misfires — agents may briefly show the wrong status or miss transitions.
- **Linux/macOS tip** — if you launch VS Code without a folder open (e.g. bare `code` command), agents will start in your home directory. This is fully supported; just be aware your Claude sessions will be tracked under `~/.claude/projects/` using your home directory as the project root.

## Troubleshooting

If your agent appears stuck on idle or doesn't spawn:

1. **Debug View** — In the Pixel Agents panel, click the gear icon (Settings), then toggle **Debug View**. This shows connection diagnostics per agent: JSONL file status, lines parsed, last data timestamp, and file path. If you see "JSONL not found", the extension can't locate the session file.
2. **Debug Console** — If you're running from source (Extension Development Host via F5), open VS Code's **View > Debug Console**. Search for `[Pixel Agents]` to see detailed logs: project directory resolution, JSONL polling status, path encoding mismatches, and unrecognized JSONL record types.

## Where This Is Going

The long-term vision is an interface where managing AI agents feels like playing the Sims, but the results are real things built.

- **Agents as characters** you can see, assign, monitor, and redirect, each with visible roles (designer, coder, writer, reviewer), stats, context usage, and tools.
- **Desks as directories** — drag an agent to a desk to assign it to a project or working directory.
- **An office as a project** — with a Kanban board on the wall where idle agents can pick up tasks autonomously.
- **Deep inspection** — click any agent to see its model, branch, system prompt, and full work history. Interrupt it, chat with it, or redirect it.
- **Token health bars** — rate limits and context windows visualized as in-game stats.
- **Fully customizable** — upload your own character sprites, themes, and office assets. Eventually maybe even move beyond pixel art into 3D or VR.

For this to work, the architecture needs to be modular at every level:

- **Platform-agnostic**: VS Code extension today, Electron app, web app, or any other host environment tomorrow.
- **Agent-agnostic**: Claude Code today, but built to support Codex, OpenCode, Gemini, Cursor, Copilot, and others through composable adapters.
- **Theme-agnostic**: community-created assets, skins, and themes from any contributor.

We're actively working on the core module and adapter architecture that makes this possible. If you're interested to talk about this further, please visit our [Discussions Section](https://github.com/pixel-agents-hq/pixel-agents/discussions).

## Community & Contributing

Use **[Issues](https://github.com/pixel-agents-hq/pixel-agents/issues)** to report bugs or request features. Join **[Discussions](https://github.com/pixel-agents-hq/pixel-agents/discussions)** for questions and conversations.

See [CONTRIBUTING.md](CONTRIBUTING.md) for instructions on how to contribute.

Please read our [Code of Conduct](CODE_OF_CONDUCT.md) before participating.

## Supporting the Project

If you find Pixel Agents useful, consider supporting its development:

<a href="https://github.com/sponsors/pablodelucca">
  <img src="https://img.shields.io/badge/Sponsor-GitHub-ea4aaa?logo=github" alt="GitHub Sponsors">
</a>
<a href="https://ko-fi.com/pablodelucca">
  <img src="https://img.shields.io/badge/Support-Ko--fi-ff5e5b?logo=ko-fi" alt="Ko-fi">
</a>

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=pixel-agents-hq/pixel-agents&type=Date)](https://www.star-history.com/?repos=pixel-agents-hq%2Fpixel-agents&type=date&legend=bottom-right)

## License

This project is licensed under the [MIT License](LICENSE).

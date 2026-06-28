# PLAN.md - Multi-Agent 확장성 고도화 설계서

본 문서는 단일 에이전트 중심의 시각화를 넘어 다중 독립 에이전트(Multi-Agent)가 동일 프로젝트 및 여러 독립 터미널 세션에서 병렬 실행될 때, 이를 효과적으로 모니터링하고 시각적으로 구분하도록 아키텍처를 개선하는 계획을 정리합니다.

---

## 1. 목표 개선 사항 (Goal Description)

1.  **다중 에이전트 세션의 자동 추적 활성화**:
    *   현재는 설정 창에서 `watchAllSessions`를 직접 켜야만 같은 워크스페이스 내에서 띄운 다른 CLI 세션들을 감지합니다. 이 옵션의 기본값을 `true`로 설정하여, 에이전트가 다른 독립 터미널(cmd, powershell, tmux 등)에서 병렬 기동하더라도 픽셀 아트 사무실에 즉시 에이전트 캐릭터로 자동 집결하도록 개선합니다.
2.  **스프라이트 아바타의 시각적 다양성 강화**:
    *   기본 캐릭터 스프라이트는 6개만 로드되므로 다중 에이전트가 많아지면 모습이 겹치게 됩니다. 캐릭터의 색상 필터 값(`hueShift`)을 최초 스폰 단계부터 0도 ~ 360도 범위의 무작위 값으로 다채롭게 부여하여 에이전트 간의 시각적 식별성을 대폭 증가시킵니다.

---

## 2. 코드 수정 범위 (Proposed Changes)

### [Component: Server Configuration]

#### [MODIFY] [configPersistence.ts](file:///c:/Users/KAC/Documents/행안부_고급인증과정/6주차과제/pixel-agents-main/pixel-agents-main/server/src/configPersistence.ts)
*   **변경 내용**: `DEFAULT_ADAPTER_SETTINGS.watchAllSessions` 기본값을 `false`에서 `true`로 변경합니다.
*   **파일 라인**: [L41](file:///c:/Users/KAC/Documents/행안부_고급인증과정/6주차과제/pixel-agents-main/pixel-agents-main/server/src/configPersistence.ts#L41)

---

### [Component: Webview Visualizer]

#### [MODIFY] [officeState.ts](file:///c:/Users/KAC/Documents/행안부_고급인증과정/6주차과제/pixel-agents-main/pixel-agents-main/webview-ui/src/office/engine/officeState.ts)
*   **변경 내용**: `pickDiversePalette()` 메서드에서 캐릭터 색상 편차를 결정하는 `hueShift`를 첫 번째 라운드부터 무작위(0 ~ 360도)로 할당하도록 개선합니다.
*   **파일 라인**: [L240-L261](file:///c:/Users/KAC/Documents/행안부_고급인증과정/6주차과제/pixel-agents-main/pixel-agents-main/webview-ui/src/office/engine/officeState.ts#L240-L261)

---

## 3. 검증 방안 (Verification Plan)

### 타입 세이프티 점검
*   `npm run check-types` 명령을 구동하여 TypeScript 컴파일 에러가 발생하지 않는지 확인합니다.
